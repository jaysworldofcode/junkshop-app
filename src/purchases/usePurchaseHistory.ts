import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { groupPurchasesByDay, type PurchaseDaySection, type PurchaseListEntry } from '@/domain/purchaseHistory';
import { listPurchases } from '@/purchases/purchaseRepository';

export function usePurchaseHistory(): {
  sections: PurchaseDaySection[];
  isLoading: boolean;
  error: string | null;
} {
  const database = useSQLiteContext();
  const [entries, setEntries] = useState<PurchaseListEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isCancelled = false;

      async function load() {
        setError(null);

        try {
          const rows = await listPurchases(database);
          if (!isCancelled) {
            setEntries(rows);
          }
        } catch (loadError) {
          if (!isCancelled) {
            setError(loadError instanceof Error ? loadError.message : 'Could not load purchases.');
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
    }, [database])
  );

  const sections = useMemo(() => groupPurchasesByDay(entries), [entries]);

  return { sections, isLoading, error };
}
