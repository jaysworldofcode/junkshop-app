export const MIGRATION_007_CREATE_SYNC_METADATA = `
CREATE TABLE IF NOT EXISTS device_metadata (
  id TEXT PRIMARY KEY NOT NULL,
  device_id TEXT NOT NULL UNIQUE,
  device_name TEXT,
  role TEXT NOT NULL DEFAULT 'standalone' CHECK (role IN ('main', 'daily', 'standalone')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS data_imports (
  id TEXT PRIMARY KEY NOT NULL,
  export_id TEXT NOT NULL,
  source_device_id TEXT NOT NULL,
  source_device_name TEXT,
  imported_at TEXT NOT NULL,
  import_mode TEXT NOT NULL CHECK (import_mode IN ('replace', 'merge')),
  source_exported_at TEXT NOT NULL,
  records_added INTEGER NOT NULL DEFAULT 0,
  records_updated INTEGER NOT NULL DEFAULT 0,
  records_skipped INTEGER NOT NULL DEFAULT 0,
  records_conflicted INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_data_imports_export
  ON data_imports (export_id);
`;
