import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';

import { TOP_SELLERS_LIMIT } from '@/constants/person';
import { getPeriodTotals, getSaleDetail, listSellerPurchases, listTransactions } from '@/dashboard/dashboardRepository';
import { useFocusedQuery } from '@/db/useFocusedQuery';
import type { DateRange } from '@/domain/dateRange';
import type { SaleDetail } from '@/domain/dashboard';
import { rankTopSellers } from '@/domain/person';

export function usePeriodTotals({ from, to }: DateRange) {
  const query = useCallback((database: SQLiteDatabase) => getPeriodTotals(database, { from, to }), [from, to]);
  return useFocusedQuery(query, 'Could not load the dashboard.');
}

export function useTopSellers({ from, to }: DateRange) {
  const query = useCallback(
    async (database: SQLiteDatabase) =>
      rankTopSellers(await listSellerPurchases(database, { from, to }), TOP_SELLERS_LIMIT),
    [from, to]
  );
  return useFocusedQuery(query, 'Could not load top sellers.');
}

export function useTransactions({ from, to }: DateRange) {
  const query = useCallback((database: SQLiteDatabase) => listTransactions(database, { from, to }), [from, to]);
  return useFocusedQuery(query, 'Could not load transactions.');
}

export function useSaleDetail(id: string): {
  data: SaleDetail | null;
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
} {
  const database = useSQLiteContext();
  const [loadedId, setLoadedId] = useState(id);
  const [data, setData] = useState<SaleDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (loadedId !== id) {
    setLoadedId(id);
    setData(null);
    setIsLoading(true);
    setError(null);
  }

  const reload = useCallback(async () => {
    setError(null);
    try {
      const detail = await getSaleDetail(database, id);
      setData(detail);
      if (!detail) {
        setError('This sale could not be found.');
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load this sale.');
    } finally {
      setIsLoading(false);
    }
  }, [database, id]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload])
  );

  return { data, isLoading: isLoading && !data, error, reload };
}
