import { useCallback, useMemo } from 'react';
import type { SQLiteDatabase } from 'expo-sqlite';

import { useFocusedQuery } from '@/db/useFocusedQuery';
import { groupExpensesByDay } from '@/domain/expense';
import { listExpenses } from '@/expenses/expenseRepository';

export function useExpenses() {
  const query = useCallback((database: SQLiteDatabase) => listExpenses(database), []);
  const { data, isLoading, error } = useFocusedQuery(query, 'Could not load expenses.');
  const sections = useMemo(() => groupExpensesByDay(data ?? []), [data]);

  return { sections, isLoading, error };
}
