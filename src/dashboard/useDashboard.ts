import { useCallback } from 'react';
import type { SQLiteDatabase } from 'expo-sqlite';

import { getPeriodTotals, getSaleDetail, listTransactions } from '@/dashboard/dashboardRepository';
import { useFocusedQuery } from '@/db/useFocusedQuery';
import type { DateRange } from '@/domain/dateRange';

export function usePeriodTotals({ from, to }: DateRange) {
  const query = useCallback((database: SQLiteDatabase) => getPeriodTotals(database, { from, to }), [from, to]);
  return useFocusedQuery(query, 'Could not load the dashboard.');
}

export function useTransactions({ from, to }: DateRange) {
  const query = useCallback((database: SQLiteDatabase) => listTransactions(database, { from, to }), [from, to]);
  return useFocusedQuery(query, 'Could not load transactions.');
}

export function useSaleDetail(id: string) {
  const query = useCallback((database: SQLiteDatabase) => getSaleDetail(database, id), [id]);
  return useFocusedQuery(query, 'Could not load this sale.');
}
