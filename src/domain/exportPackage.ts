import {
  BACKUP_FILE_EXTENSION,
  EXPORT_FORMAT,
  EXPORT_FORMAT_VERSION,
  EXPORT_TABLES,
  OPTIONAL_EXPORT_TABLES,
  type ExportTable,
} from '@/constants/dataTransfer';

export type ExportValue = string | number | null;
export type ExportRow = Record<string, ExportValue>;
export type ExportTables = Record<ExportTable, ExportRow[]>;
export type RecordCounts = Record<ExportTable, number>;

export type ExportManifest = {
  exportId: string;
  deviceId: string;
  deviceName: string | null;
  exportedAt: string;
  appVersion: string | null;
  schemaVersion: number;
  recordCounts: RecordCounts;
};

export type ExportPackage = {
  format: typeof EXPORT_FORMAT;
  formatVersion: number;
  manifest: ExportManifest;
  tables: ExportTables;
};

export class ExportPackageError extends Error {}

export function countRecords(tables: ExportTables): RecordCounts {
  return Object.fromEntries(EXPORT_TABLES.map((table) => [table, tables[table].length])) as RecordCounts;
}

export function totalRecords(counts: RecordCounts): number {
  return EXPORT_TABLES.reduce((sum, table) => sum + counts[table], 0);
}

export function serializeExportPackage(exportPackage: ExportPackage): string {
  return JSON.stringify(exportPackage);
}

/** Validates the whole file before anything touches the database. Throws ExportPackageError with a readable reason. */
export function parseExportPackage(text: string, currentSchemaVersion: number): ExportPackage {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new ExportPackageError('This file is not a Junkshop export. It could not be read as JSON.');
  }

  if (!isObject(parsed) || parsed.format !== EXPORT_FORMAT) {
    throw new ExportPackageError('This file is not a Junkshop export.');
  }
  if (typeof parsed.formatVersion !== 'number' || parsed.formatVersion > EXPORT_FORMAT_VERSION) {
    throw new ExportPackageError('This export was made by a newer version of the app. Update the app on this phone first.');
  }

  const manifest = parseManifest(parsed.manifest);
  if (manifest.schemaVersion > currentSchemaVersion) {
    throw new ExportPackageError('This export was made by a newer version of the app. Update the app on this phone first.');
  }

  const tables = parseTables(parsed.tables);
  const counts = countRecords(tables);
  for (const table of EXPORT_TABLES) {
    if (counts[table] !== manifest.recordCounts[table]) {
      throw new ExportPackageError('This export is incomplete. The record counts do not match. Export it again.');
    }
  }

  return { format: EXPORT_FORMAT, formatVersion: parsed.formatVersion, manifest, tables };
}

/** "junkshop-export-20261006-183600.json", sortable by name. */
export function exportFileName(prefix: string, date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  const day = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
  const time = `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  return `${prefix}${day}-${time}${BACKUP_FILE_EXTENSION}`;
}

export function isBackupFileName(name: string, prefix: string): boolean {
  return name.startsWith(prefix) && name.endsWith(BACKUP_FILE_EXTENSION);
}

function parseManifest(value: unknown): ExportManifest {
  if (!isObject(value)) {
    throw new ExportPackageError('This export is missing its summary.');
  }

  const { exportId, deviceId, deviceName, exportedAt, appVersion, schemaVersion, recordCounts } = value;
  if (
    typeof exportId !== 'string' ||
    typeof deviceId !== 'string' ||
    typeof exportedAt !== 'string' ||
    Number.isNaN(Date.parse(exportedAt)) ||
    typeof schemaVersion !== 'number' ||
    !Number.isInteger(schemaVersion) ||
    !isObject(recordCounts)
  ) {
    throw new ExportPackageError('This export has a damaged summary.');
  }

  const counts = {} as RecordCounts;
  for (const table of EXPORT_TABLES) {
    const count = recordCounts[table] ?? (OPTIONAL_EXPORT_TABLES.includes(table) ? 0 : undefined);
    if (typeof count !== 'number' || !Number.isInteger(count) || count < 0) {
      throw new ExportPackageError('This export has a damaged summary.');
    }
    counts[table] = count;
  }

  return {
    exportId,
    deviceId,
    deviceName: typeof deviceName === 'string' ? deviceName : null,
    exportedAt,
    appVersion: typeof appVersion === 'string' ? appVersion : null,
    schemaVersion,
    recordCounts: counts,
  };
}

function parseTables(value: unknown): ExportTables {
  if (!isObject(value)) {
    throw new ExportPackageError('This export has no data.');
  }

  const tables = {} as ExportTables;
  for (const table of EXPORT_TABLES) {
    const rows = value[table] ?? (OPTIONAL_EXPORT_TABLES.includes(table) ? [] : undefined);
    if (!Array.isArray(rows)) {
      throw new ExportPackageError(`This export is missing ${table}.`);
    }
    tables[table] = rows.map((row) => parseRow(row, table));
  }
  return tables;
}

function parseRow(value: unknown, table: ExportTable): ExportRow {
  if (!isObject(value) || typeof value.id !== 'string' || value.id === '') {
    throw new ExportPackageError(`This export has a damaged ${table} record.`);
  }

  for (const cell of Object.values(value)) {
    if (cell !== null && typeof cell !== 'string' && typeof cell !== 'number') {
      throw new ExportPackageError(`This export has a damaged ${table} record.`);
    }
  }

  return value as ExportRow;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
