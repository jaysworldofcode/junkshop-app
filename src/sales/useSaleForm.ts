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
  type SaleLineFigures,
  type SaleSummary,
  type SavedSale,
} from '@/domain/sale';
import { nowIso } from '@/domain/timestamps';
import { createSaleFormState, saleFormReducer, type SaleFormAction, type SaleFormState } from '@/sales/saleFormReducer';
import { saveSale } from '@/sales/saleRepository';

export function useSaleForm(pricesByMaterial: Map<string, ProductPrices>): {
  state: SaleFormState;
  dispatch: (action: SaleFormAction) => void;
  lineFigures: Record<string, SaleLineFigures>;
  summary: SaleSummary;
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

  const save = useCallback(async (): Promise<SavedSale | null> => {
    const errors = validateSaleDraft(state.draft, pricesByMaterial);
    if (hasSaleErrors(errors)) {
      dispatch({ type: 'setErrors', errors });
      return null;
    }

    dispatch({ type: 'submitStart' });

    try {
      const saved = await saveSale(
        database,
        buildNewSale(state.draft, pricesByMaterial, { createId, timestamp: nowIso() })
      );
      dispatch({ type: 'submitSuccess', saved });
      return saved;
    } catch (error) {
      dispatch({
        type: 'submitFailure',
        message: error instanceof Error ? error.message : 'Could not save this sale. Nothing was saved.',
      });
      return null;
    }
  }, [database, pricesByMaterial, state.draft]);

  return { state, dispatch, lineFigures, summary, save };
}
