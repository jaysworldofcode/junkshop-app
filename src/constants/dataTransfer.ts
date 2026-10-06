export const EXPORT_FORMAT = 'junkshop-export';
export const EXPORT_FORMAT_VERSION = 1;

/** Parents before children, so foreign keys hold while rows are inserted. */
export const EXPORT_TABLES = [
  'materials',
  'material_prices',
  'purchases',
  'purchase_items',
  'sales',
  'sale_items',
  'expenses',
] as const;

export type ExportTable = (typeof EXPORT_TABLES)[number];

export const EXPORT_TABLE_LABELS: Record<ExportTable, string> = {
  materials: 'Products',
  material_prices: 'Price records',
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
