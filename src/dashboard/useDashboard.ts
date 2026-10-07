import { useCallback } from 'react';
import type { SQLiteDatabase } from 'expo-sqlite';

import { TOP_SELLERS_LIMIT } from '@/constants/person';
import { getPeriodTotals, getSaleDetail, listSellerPurchases, listTransactions } from '@/dashboard/dashboardRepository';
import { useFocusedQuery } from '@/db/useFocusedQuery';
import type { DateRange } from '@/domain/dateRange';
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

export function useSaleDetail(id: string) {
  const query = useCallback((database: SQLiteDatabase) => getSaleDetail(database, id), [id]);
  return useFocusedQuery(query, 'Could not load this sale.');
}
