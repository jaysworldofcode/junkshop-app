import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Native (iOS/Android): an exclusive transaction, so no other query can slip in
 * between the statements. See runInTransaction.web.ts for the web build.
 */
export async function runInTransaction(
  database: SQLiteDatabase,
  task: (transaction: SQLiteDatabase) => Promise<void>
): Promise<void> {
  await database.withExclusiveTransactionAsync(async (transaction) => {
    await task(transaction);
  });
}
