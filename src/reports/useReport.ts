import { useCallback } from 'react';
import type { SQLiteDatabase } from 'expo-sqlite';

import { useFocusedQuery } from '@/db/useFocusedQuery';
import type { DateRange } from '@/domain/dateRange';
import { getReport } from '@/reports/reportRepository';

export function useReport({ from, to }: DateRange) {
  const query = useCallback((database: SQLiteDatabase) => getReport(database, { from, to }), [from, to]);
  return useFocusedQuery(query, 'Could not load the report.');
}
