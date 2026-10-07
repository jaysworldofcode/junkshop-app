import { Platform } from 'react-native';
import type { SQLiteDatabase } from 'expo-sqlite';

import { MIGRATION_001_CREATE_MATERIALS } from '@/db/migrations/001_create_materials';
import { MIGRATION_002_CREATE_PURCHASES } from '@/db/migrations/002_create_purchases';
import { MIGRATION_003_CREATE_MATERIAL_PRICES } from '@/db/migrations/003_create_material_prices';
import { MIGRATION_004_CREATE_SALES } from '@/db/migrations/004_create_sales';
import { MIGRATION_005_CREATE_EXPENSES } from '@/db/migrations/005_create_expenses';
import { MIGRATION_006_ADD_EXPENSE_TITLE } from '@/db/migrations/006_add_expense_title';
import { MIGRATION_007_CREATE_SYNC_METADATA } from '@/db/migrations/007_create_sync_metadata';
import { MIGRATION_008_ADD_SUPPLIER_PRICE_TYPE } from '@/db/migrations/008_add_supplier_price_type';
import { MIGRATION_009_CREATE_PEOPLE } from '@/db/migrations/009_create_people';

type Migration = {
  version: number;
  sql: string;
};

const MIGRATIONS: Migration[] = [
  {
    version: 1,
    sql: MIGRATION_001_CREATE_MATERIALS,
  },
  {
    version: 2,
    sql: MIGRATION_002_CREATE_PURCHASES,
  },
  {
    version: 3,
    sql: MIGRATION_003_CREATE_MATERIAL_PRICES,
  },
  {
    version: 4,
    sql: MIGRATION_004_CREATE_SALES,
  },
  {
    version: 5,
    sql: MIGRATION_005_CREATE_EXPENSES,
  },
  {
    version: 6,
    sql: MIGRATION_006_ADD_EXPENSE_TITLE,
  },
  {
    version: 7,
    sql: MIGRATION_007_CREATE_SYNC_METADATA,
  },
  {
    version: 8,
    sql: MIGRATION_008_ADD_SUPPLIER_PRICE_TYPE,
  },
  {
    version: 9,
    sql: MIGRATION_009_CREATE_PEOPLE,
  },
];

export const LATEST_SCHEMA_VERSION = MIGRATIONS[MIGRATIONS.length - 1].version;

export async function applyMigrations(database: SQLiteDatabase): Promise<void> {
  await enableWalWhenSupported(database);
  await database.execAsync('PRAGMA foreign_keys = ON;');

  const versionRow = await database.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let currentVersion = versionRow?.user_version ?? 0;

  for (const migration of MIGRATIONS) {
    if (migration.version <= currentVersion) {
      continue;
    }

    // A migration that stops halfway, such as a table rebuild, rolls back instead of blocking the next launch.
    await database.withTransactionAsync(async () => {
      await database.execAsync(migration.sql);
      await database.execAsync(`PRAGMA user_version = ${migration.version}`);
    });
    currentVersion = migration.version;
  }
}

async function enableWalWhenSupported(database: SQLiteDatabase): Promise<void> {
  // WAL is a native SQLite feature. The web build may reject this PRAGMA.
  if (Platform.OS === 'web') {
    return;
  }

  await database.execAsync("PRAGMA journal_mode = 'wal';");
}
