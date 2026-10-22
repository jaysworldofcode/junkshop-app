import { useCallback, useMemo, useReducer } from 'react';
import { useSQLiteContext } from 'expo-sqlite';

import { createId } from '@/domain/ids';
import { todayLocalDateKey } from '@/domain/localDate';
import type { ProductPrices } from '@/domain/materialPrice';
import {
  buildNewSale,
  computeSaleLineFigures,
  hasSaleErrors,
  summarizeSale,
  unitCostFor,
  validateSaleDraft,
  type SaleDraft,
  type SaleLineFigures,
  type SaleSummary,
  type SavedSale,
} from '@/domain/sale';
import { nowIso } from '@/domain/timestamps';
import { useDayChangeCheck } from '@/hooks/useDayChangeCheck';
import {
  createSaleFormState,
  saleFormReducer,
  syncSaleToday,
  type SaleFormAction,
  type SaleFormState,
} from '@/sales/saleFormReducer';
import { saveSale } from '@/sales/saleRepository';

export function useSaleForm(pricesByMaterial: Map<string, ProductPrices>): {
  state: SaleFormState;
  dispatch: (action: SaleFormAction) => void;
  lineFigures: Record<string, SaleLineFigures>;
  summary: SaleSummary;
  validate: () => boolean;
  save: () => Promise<SavedSale | null>;
} {
  const database = useSQLiteContext();
  const [state, dispatch] = useReducer(saleFormReducer, undefined, () => createSaleFormState(todayLocalDateKey()));

  const lineFigures = useMemo(
    () =>
      Object.fromEntries(
        state.draft.lines.map((line) => [
          line.key,
          computeSaleLineFigures(line, unitCostFor(line.materialId, pricesByMaterial)),
        ])
      ),
    [pricesByMaterial, state.draft.lines]
  );

  const summary = useMemo(() => summarizeSale(Object.values(lineFigures)), [lineFigures]);

  const syncToday = useCallback(() => dispatch({ type: 'syncToday', today: todayLocalDateKey() }), []);
  useDayChangeCheck(syncToday);

  const validateDraft = useCallback(
    (draft: SaleDraft): boolean => {
      const errors = validateSaleDraft(draft, pricesByMaterial);
      if (hasSaleErrors(errors)) {
        dispatch({ type: 'setErrors', errors });
        return false;
      }
      return true;
    },
    [pricesByMaterial]
  );

  const validate = useCallback((): boolean => validateDraft(state.draft), [state.draft, validateDraft]);

  const save = useCallback(async (): Promise<SavedSale | null> => {
    const today = todayLocalDateKey();
    const { draft } = syncSaleToday(state, today);
    dispatch({ type: 'syncToday', today });

    if (!validateDraft(draft)) {
      return null;
    }

    dispatch({ type: 'submitStart' });

    try {
      const saved = await saveSale(database, buildNewSale(draft, pricesByMaterial, { createId, timestamp: nowIso() }));
      dispatch({ type: 'submitSuccess', saved });
      return saved;
    } catch (error) {
      dispatch({
        type: 'submitFailure',
        message: error instanceof Error ? error.message : 'Could not save this sale. Nothing was saved.',
      });
      return null;
    }
  }, [database, pricesByMaterial, state, validateDraft]);

  return { state, dispatch, lineFigures, summary, validate, save };
}
