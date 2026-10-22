import { useCallback, useMemo, useReducer } from 'react';
import { useSQLiteContext } from 'expo-sqlite';

import { createId } from '@/domain/ids';
import { todayLocalDateKey } from '@/domain/localDate';
import {
  buildNewPurchase,
  computeLineFigures,
  hasPurchaseErrors,
  summarizePurchase,
  validatePurchaseDraft,
  type PurchaseDraft,
  type PurchaseLineFigures,
  type PurchaseSummary,
  type SavedPurchase,
} from '@/domain/purchase';
import { nowIso } from '@/domain/timestamps';
import { useDayChangeCheck } from '@/hooks/useDayChangeCheck';
import {
  createPurchaseFormState,
  purchaseFormReducer,
  syncPurchaseToday,
  type PurchaseFormAction,
  type PurchaseFormState,
} from '@/purchases/purchaseFormReducer';
import { savePurchase } from '@/purchases/purchaseRepository';

export function usePurchaseForm(): {
  state: PurchaseFormState;
  dispatch: (action: PurchaseFormAction) => void;
  lineFigures: Record<string, PurchaseLineFigures>;
  summary: PurchaseSummary;
  validate: () => boolean;
  save: () => Promise<SavedPurchase | null>;
} {
  const database = useSQLiteContext();
  const [state, dispatch] = useReducer(purchaseFormReducer, undefined, () =>
    createPurchaseFormState(todayLocalDateKey())
  );

  const lineFigures = useMemo(
    () => Object.fromEntries(state.draft.lines.map((line) => [line.key, computeLineFigures(line)])),
    [state.draft.lines]
  );

  const summary = useMemo(() => summarizePurchase(Object.values(lineFigures)), [lineFigures]);

  const syncToday = useCallback(() => dispatch({ type: 'syncToday', today: todayLocalDateKey() }), []);
  useDayChangeCheck(syncToday);

  const validateDraft = useCallback((draft: PurchaseDraft): boolean => {
    const errors = validatePurchaseDraft(draft);
    if (hasPurchaseErrors(errors)) {
      dispatch({ type: 'setErrors', errors });
      return false;
    }
    return true;
  }, []);

  const validate = useCallback((): boolean => validateDraft(state.draft), [state.draft, validateDraft]);

  const save = useCallback(async (): Promise<SavedPurchase | null> => {
    const today = todayLocalDateKey();
    const { draft } = syncPurchaseToday(state, today);
    dispatch({ type: 'syncToday', today });

    if (!validateDraft(draft)) {
      return null;
    }

    dispatch({ type: 'submitStart' });

    try {
      const saved = await savePurchase(database, buildNewPurchase(draft, { createId, timestamp: nowIso() }));
      dispatch({ type: 'submitSuccess', saved });
      return saved;
    } catch (error) {
      dispatch({
        type: 'submitFailure',
        message: error instanceof Error ? error.message : 'Could not save this purchase. Nothing was saved.',
      });
      return null;
    }
  }, [database, state, validateDraft]);

  return { state, dispatch, lineFigures, summary, validate, save };
}
