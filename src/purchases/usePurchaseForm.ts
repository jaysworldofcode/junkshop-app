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
  type PurchaseLineFigures,
  type PurchaseSummary,
  type SavedPurchase,
} from '@/domain/purchase';
import { nowIso } from '@/domain/timestamps';
import { createPurchaseFormState, purchaseFormReducer, type PurchaseFormAction, type PurchaseFormState } from '@/purchases/purchaseFormReducer';
import { savePurchase } from '@/purchases/purchaseRepository';

export function usePurchaseForm(): {
  state: PurchaseFormState;
  dispatch: (action: PurchaseFormAction) => void;
  lineFigures: Record<string, PurchaseLineFigures>;
  summary: PurchaseSummary;
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

  const save = useCallback(async (): Promise<SavedPurchase | null> => {
    const errors = validatePurchaseDraft(state.draft);
    if (hasPurchaseErrors(errors)) {
      dispatch({ type: 'setErrors', errors });
      return null;
    }

    dispatch({ type: 'submitStart' });

    try {
      const saved = await savePurchase(database, buildNewPurchase(state.draft, { createId, timestamp: nowIso() }));
      dispatch({ type: 'submitSuccess', saved });
      return saved;
    } catch (error) {
      dispatch({
        type: 'submitFailure',
        message: error instanceof Error ? error.message : 'Could not save this purchase. Nothing was saved.',
      });
      return null;
    }
  }, [database, state.draft]);

  return { state, dispatch, lineFigures, summary, save };
}
