export const EXPORT_FORMAT = 'junkshop-export';
export const EXPORT_FORMAT_VERSION = 1;

/** Parents before children, so foreign keys hold while rows are inserted. */
export const EXPORT_TABLES = [
  'materials',
  'material_prices',
  'people',
  'purchases',
  'purchase_items',
  'sales',
  'sale_items',
  'expenses',
] as const;

export type ExportTable = (typeof EXPORT_TABLES)[number];

/** Tables added after the first app release. Exports from older versions do not have them, so they import as empty. */
export const OPTIONAL_EXPORT_TABLES: readonly ExportTable[] = ['people'];

export const EXPORT_TABLE_LABELS: Record<ExportTable, string> = {
  materials: 'Products',
  material_prices: 'Price records',
  people: 'People',
  purchases: 'Purchases',
  purchase_items: 'Purchase items',
  sales: 'Sales',
  sale_items: 'Sale items',
  expenses: 'Expenses',
};

export const EXPORT_MIME_TYPE = 'application/json';
export const EXPORT_UTI = 'public.json';
export const EXPORT_FILE_PREFIX = 'junkshop-export-';
export const AUTO_BACKUP_FILE_PREFIX = 'junkshop-autobackup-';
export const PRE_REPLACE_BACKUP_FILE_PREFIX = 'junkshop-before-replace-';
export const BACKUP_FILE_EXTENSION = '.json';
export const AUTO_BACKUPS_TO_KEEP = 5;
export const LOCAL_BACKUP_DIRECTORY = 'backups';

export const REPLACE_CONFIRMATION_PHRASE = 'Replace All Data';
