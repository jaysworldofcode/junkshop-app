import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';

/**
 * Runs `query` whenever the screen comes into view and whenever `query` changes.
 * Wrap `query` in useCallback so it only changes when its inputs do.
 */
export function useFocusedQuery<T>(
  query: (database: SQLiteDatabase) => Promise<T>,
  fallbackError: string
): { data: T | null; isLoading: boolean; error: string | null } {
  const database = useSQLiteContext();
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isCancelled = false;

      async function load() {
        setIsLoading(true);
        setError(null);

        try {
          const result = await query(database);
          if (!isCancelled) {
            setData(result);
          }
        } catch (loadError) {
          if (!isCancelled) {
            setError(loadError instanceof Error ? loadError.message : fallbackError);
          }
        } finally {
          if (!isCancelled) {
            setIsLoading(false);
          }
        }
      }

      void load();

      return () => {
        isCancelled = true;
      };
    }, [database, fallbackError, query])
  );

  return { data, isLoading, error };
}
