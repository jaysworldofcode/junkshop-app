import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  ExportPackageError,
  countRecords,
  exportFileName,
  isBackupFileName,
  parseExportPackage,
  serializeExportPackage,
  type ExportPackage,
  type ExportTables,
} from './exportPackage';

const SCHEMA_VERSION = 7;

function samplePackage(overrides: Partial<ExportPackage['manifest']> = {}): ExportPackage {
  const tables: ExportTables = {
    materials: [{ id: 'm1', name: 'Copper', unit: 'kg', is_active: 1 }],
    material_prices: [],
    purchases: [{ id: 'p1', total_amount: 12500, notes: null }],
    purchase_items: [],
    sales: [],
    sale_items: [],
    expenses: [],
  };

  return {
    format: 'junkshop-export',
    formatVersion: 1,
    manifest: {
      exportId: 'e1',
      deviceId: 'd1',
      deviceName: 'Daily phone',
      exportedAt: '2026-10-06T10:00:00.000Z',
      appVersion: '1.0.0',
      schemaVersion: SCHEMA_VERSION,
      recordCounts: countRecords(tables),
      ...overrides,
    },
    tables,
  };
}

test('reads back what it writes', () => {
  const original = samplePackage();
  const parsed = parseExportPackage(serializeExportPackage(original), SCHEMA_VERSION);
  assert.deepEqual(parsed, original);
});

test('rejects files that are not Junkshop exports', () => {
  assert.throws(() => parseExportPackage('not json', SCHEMA_VERSION), ExportPackageError);
  assert.throws(() => parseExportPackage('{"format":"other"}', SCHEMA_VERSION), ExportPackageError);
});

test('rejects exports from a newer schema', () => {
  const text = serializeExportPackage(samplePackage({ schemaVersion: SCHEMA_VERSION + 1 }));
  assert.throws(() => parseExportPackage(text, SCHEMA_VERSION), /newer version/);
});

test('rejects an export whose counts do not match its rows', () => {
  const exportPackage = samplePackage();
  exportPackage.manifest.recordCounts.purchases = 2;
  assert.throws(() => parseExportPackage(serializeExportPackage(exportPackage), SCHEMA_VERSION), /incomplete/);
});

test('rejects rows without an id or with nested values', () => {
  const missingId = samplePackage();
  missingId.tables.materials = [{ name: 'Copper' } as never];
  assert.throws(() => parseExportPackage(serializeExportPackage(missingId), SCHEMA_VERSION), ExportPackageError);

  const nested = JSON.parse(serializeExportPackage(samplePackage()));
  nested.tables.materials[0].name = { text: 'Copper' };
  assert.throws(() => parseExportPackage(JSON.stringify(nested), SCHEMA_VERSION), ExportPackageError);
});

test('names backup files so they sort by time', () => {
  const name = exportFileName('junkshop-autobackup-', new Date(2026, 9, 6, 8, 5, 9));
  assert.equal(name, 'junkshop-autobackup-20261006-080509.json');
  assert.equal(isBackupFileName(name, 'junkshop-autobackup-'), true);
  assert.equal(isBackupFileName(name, 'junkshop-export-'), false);
});
