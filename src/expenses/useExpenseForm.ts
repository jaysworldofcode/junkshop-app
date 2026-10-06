import { useCallback, useEffect, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';

import {
  createEmptyExpenseDraft,
  draftFromExpense,
  expenseValuesFromDraft,
  hasExpenseErrors,
  validateExpenseDraft,
  type ExpenseDraft,
  type ExpenseErrors,
  type ExpenseField,
} from '@/domain/expense';
import { todayLocalDateKey } from '@/domain/localDate';
import { nowIso } from '@/domain/timestamps';
import { getExpense, insertExpense, updateExpense } from '@/expenses/expenseRepository';

/** Add a new expense, or edit one when `expenseId` is given. */
export function useExpenseForm(expenseId?: string) {
  const database = useSQLiteContext();
  const [draft, setDraft] = useState<ExpenseDraft>(() => createEmptyExpenseDraft(todayLocalDateKey()));
  const [errors, setErrors] = useState<ExpenseErrors>({});
  const [isLoading, setIsLoading] = useState(Boolean(expenseId));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!expenseId) {
      return;
    }

    let isCancelled = false;

    getExpense(database, expenseId)
      .then((expense) => {
        if (isCancelled) {
          return;
        }
        if (expense) {
          setDraft(draftFromExpense(expense));
        } else {
          setLoadError('This expense could not be found.');
        }
      })
      .catch((error: unknown) => {
        if (!isCancelled) {
          setLoadError(error instanceof Error ? error.message : 'Could not load this expense.');
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [database, expenseId]);

  const change = useCallback((field: ExpenseField, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSaveError(null);
  }, []);

  const save = useCallback(async (): Promise<boolean> => {
    const nextErrors = validateExpenseDraft(draft);
    if (hasExpenseErrors(nextErrors)) {
      setErrors(nextErrors);
      return false;
    }

    setIsSaving(true);
    try {
      const values = expenseValuesFromDraft(draft);
      if (expenseId) {
        await updateExpense(database, expenseId, values, nowIso());
      } else {
        await insertExpense(database, values, nowIso());
      }
      return true;
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Could not save this expense.');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [database, draft, expenseId]);

  return { draft, errors, isLoading, loadError, isSaving, saveError, change, save };
}
