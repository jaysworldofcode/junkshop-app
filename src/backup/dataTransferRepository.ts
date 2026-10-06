import Constants from 'expo-constants';
import * as Device from 'expo-device';
import type { SQLiteDatabase } from 'expo-sqlite';

import { EXPORT_FORMAT, EXPORT_FORMAT_VERSION, EXPORT_TABLES, type ExportTable } from '@/constants/dataTransfer';
import { LATEST_SCHEMA_VERSION } from '@/db/migrate';
import { runInTransaction } from '@/db/runInTransaction';
import {
  ExportPackageError,
  countRecords,
  totalRecords,
  type ExportPackage,
  type ExportRow,
  type ExportTables,
  type RecordCounts,
} from '@/domain/exportPackage';
import { createId } from '@/domain/ids';
import { nowIso } from '@/domain/timestamps';

type DeviceIdentity = {
  deviceId: string;
  deviceName: string | null;
};

type ColumnInfo = {
  name: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
};

export async function getDeviceIdentity(database: SQLiteDatabase): Promise<DeviceIdentity> {
  const existing = await database.getFirstAsync<{ device_id: string; device_name: string | null }>(
    'SELECT device_id, device_name FROM device_metadata ORDER BY created_at LIMIT 1'
  );
  if (existing) {
    return { deviceId: existing.device_id, deviceName: existing.device_name };
  }

  const identity = { deviceId: createId(), deviceName: Device.deviceName ?? Device.modelName ?? null };
  const timestamp = nowIso();
  await database.runAsync(
    `INSERT INTO device_metadata (id, device_id, device_name, role, created_at, updated_at)
     VALUES (?, ?, ?, 'standalone', ?, ?)`,
    [createId(), identity.deviceId, identity.deviceName, timestamp, timestamp]
  );
  return identity;
}

export async function buildExportPackage(database: SQLiteDatabase): Promise<ExportPackage> {
  const identity = await getDeviceIdentity(database);
  const tables = {} as ExportTables;
  for (const table of EXPORT_TABLES) {
    tables[table] = await database.getAllAsync<ExportRow>(`SELECT * FROM ${table} ORDER BY created_at, id`);
  }

  return {
    format: EXPORT_FORMAT,
    formatVersion: EXPORT_FORMAT_VERSION,
    manifest: {
      exportId: createId(),
      deviceId: identity.deviceId,
      deviceName: identity.deviceName,
      exportedAt: nowIso(),
      appVersion: Constants.expoConfig?.version ?? null,
      schemaVersion: LATEST_SCHEMA_VERSION,
      recordCounts: countRecords(tables),
    },
    tables,
  };
}

export async function countLocalRecords(database: SQLiteDatabase): Promise<RecordCounts> {
  const counts = {} as RecordCounts;
  for (const table of EXPORT_TABLES) {
    const row = await database.getFirstAsync<{ count: number }>(`SELECT COUNT(*) AS count FROM ${table}`);
    counts[table] = row?.count ?? 0;
  }
  return counts;
}

export async function hasBusinessData(database: SQLiteDatabase): Promise<boolean> {
  return totalRecords(await countLocalRecords(database)) > 0;
}

/** Changes whenever a row is added or edited, so an unchanged database is not backed up again. */
export async function dataFingerprint(database: SQLiteDatabase): Promise<string> {
  const parts: string[] = [];
  for (const table of EXPORT_TABLES) {
    const row = await database.getFirstAsync<{ count: number; latest: string | null }>(
      `SELECT COUNT(*) AS count, MAX(updated_at) AS latest FROM ${table}`
    );
    parts.push(`${table}:${row?.count ?? 0}:${row?.latest ?? ''}`);
  }
  return parts.join('|');
}

export async function hasImportedBefore(database: SQLiteDatabase, exportId: string): Promise<boolean> {
  const row = await database.getFirstAsync<{ id: string }>('SELECT id FROM data_imports WHERE export_id = ? LIMIT 1', [
    exportId,
  ]);
  return row !== null;
}

/**
 * Checks every imported row against this phone's tables. Older exports may lack newer columns;
 * those fall back to the column default, and a required column with no default rejects the file.
 */
export async function validateAgainstSchema(database: SQLiteDatabase, exportPackage: ExportPackage): Promise<void> {
  for (const table of EXPORT_TABLES) {
    const columns = await tableColumns(database, table);
    const required = columns.filter((column) => column.notnull === 1 && column.dflt_value === null && column.pk === 0);

    for (const row of exportPackage.tables[table]) {
      const missing = required.find((column) => row[column.name] === undefined || row[column.name] === null);
      if (missing) {
        throw new ExportPackageError(`This export has a ${table} record without ${missing.name}.`);
      }
    }
  }
}

/** Deletes every business row and inserts the package in one transaction. Any failure leaves the data unchanged. */
export async function replaceAllData(database: SQLiteDatabase, exportPackage: ExportPackage): Promise<void> {
  const columnsByTable = new Map<ExportTable, string[]>();
  for (const table of EXPORT_TABLES) {
    columnsByTable.set(
      table,
      (await tableColumns(database, table)).map((column) => column.name)
    );
  }

  await runInTransaction(database, async (transaction) => {
    for (const table of [...EXPORT_TABLES].reverse()) {
      await transaction.runAsync(`DELETE FROM ${table}`);
    }

    for (const table of EXPORT_TABLES) {
      const rows = exportPackage.tables[table];
      if (rows.length === 0) {
        continue;
      }

      const knownColumns = columnsByTable.get(table) ?? [];
      const columns = knownColumns.filter((column) => rows.some((row) => row[column] !== undefined));
      const placeholders = columns.map(() => '?').join(', ');
      const statement = await transaction.prepareAsync(
        `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`
      );
      try {
        for (const row of rows) {
          await statement.executeAsync(columns.map((column) => row[column] ?? null));
        }
      } finally {
        await statement.finalizeAsync();
      }
    }

    const timestamp = nowIso();
    await transaction.runAsync(
      `INSERT INTO data_imports (
         id, export_id, source_device_id, source_device_name, imported_at, import_mode,
         source_exported_at, records_added, status
       ) VALUES (?, ?, ?, ?, ?, 'replace', ?, ?, 'completed')`,
      [
        createId(),
        exportPackage.manifest.exportId,
        exportPackage.manifest.deviceId,
        exportPackage.manifest.deviceName,
        timestamp,
        exportPackage.manifest.exportedAt,
        totalRecords(exportPackage.manifest.recordCounts),
      ]
    );
  });
}

async function tableColumns(database: SQLiteDatabase, table: ExportTable): Promise<ColumnInfo[]> {
  return database.getAllAsync<ColumnInfo>(`PRAGMA table_info(${table})`);
}
