import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Web: expo-sqlite does not support exclusive transactions on web, so this uses
 * the regular transaction. It still rolls back every statement if one fails.
 */
export async function runInTransaction(
  database: SQLiteDatabase,
  task: (transaction: SQLiteDatabase) => Promise<void>
): Promise<void> {
  await database.withTransactionAsync(async () => {
    await task(database);
  });
}
