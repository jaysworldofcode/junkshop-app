import { useCallback, useEffect, useReducer, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';

import { runInTransaction } from '@/db/runInTransaction';
import { createId } from '@/domain/ids';
import { todayLocalDateKey } from '@/domain/localDate';
import { NO_PRICES, type ProductPrices } from '@/domain/materialPrice';
import { nowIso } from '@/domain/timestamps';
import {
  draftFromProduct,
  hasFieldErrors,
  optionalText,
  priceChangesFromDraft,
  validateProductDraft,
  type Product,
} from '@/domain/product';
import { getProductPrices, writePriceChanges } from '@/products/materialPriceRepository';
import {
  findActiveDuplicate,
  getProduct,
  insertProduct,
  updateProduct,
} from '@/products/productRepository';
import {
  createProductFormState,
  productFormReducer,
  type ProductFormState,
} from '@/products/productFormReducer';

export type ProductSaveResult =
  | { status: 'saved' }
  | { status: 'invalid' }
  | { status: 'duplicate'; product: Product }
  | { status: 'missing' }
  | { status: 'error'; message: string };

type UseProductFormOptions = {
  productId?: string;
};

export function useProductForm({ productId }: UseProductFormOptions = {}): {
  state: ProductFormState;
  currentPrices: ProductPrices;
  isLoading: boolean;
  loadError: string | null;
  change: (field: keyof ProductFormState['draft'], value: string | boolean) => void;
  save: (options?: { ignoreDuplicateWarning?: boolean }) => Promise<ProductSaveResult>;
} {
  const database = useSQLiteContext();
  const [state, dispatch] = useReducer(productFormReducer, undefined, createProductFormState);
  const [isLoading, setIsLoading] = useState(Boolean(productId));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [existing, setExisting] = useState<Product | null>(null);
  const [currentPrices, setCurrentPrices] = useState<ProductPrices>(NO_PRICES);

  useEffect(() => {
    if (!productId) {
      return;
    }

    let isCancelled = false;

    const loadedProductId = productId;

    async function loadProduct() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const [product, prices] = await Promise.all([
          getProduct(database, loadedProductId),
          getProductPrices(database, loadedProductId),
        ]);
        if (isCancelled) {
          return;
        }

        if (!product) {
          setExisting(null);
          setLoadError('This product is no longer in the catalog.');
          return;
        }

        setExisting(product);
        setCurrentPrices(prices);
        dispatch({ type: 'hydrate', draft: draftFromProduct(product, prices) });
      } catch (error) {
        if (!isCancelled) {
          setLoadError(error instanceof Error ? error.message : 'Could not open this product.');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadProduct();

    return () => {
      isCancelled = true;
    };
  }, [database, productId]);

  const change = useCallback((field: keyof ProductFormState['draft'], value: string | boolean) => {
    dispatch({ type: 'change', field, value });
  }, []);

  const save = useCallback(
    async (options?: { ignoreDuplicateWarning?: boolean }): Promise<ProductSaveResult> => {
      const fieldErrors = validateProductDraft(state.draft);
      if (hasFieldErrors(fieldErrors)) {
        dispatch({ type: 'setFieldErrors', fieldErrors });
        return { status: 'invalid' };
      }

      if (productId && !existing) {
        return { status: 'missing' };
      }

      dispatch({ type: 'submitStart' });

      try {
        if (state.draft.isActive && !options?.ignoreDuplicateWarning) {
          const duplicate = await findActiveDuplicate(
            database,
            { name: state.draft.name, unit: state.draft.unit },
            productId
          );

          if (duplicate) {
            dispatch({ type: 'submitSuccess' });
            return { status: 'duplicate', product: duplicate };
          }
        }

        const timestamp = nowIso();
        const today = todayLocalDateKey();
        const materialId = existing?.id ?? createId();
        const priceChanges = priceChangesFromDraft(state.draft, materialId, currentPrices);

        await runInTransaction(database, async (transaction) => {
          if (existing) {
            await updateProduct(transaction, {
              ...existing,
              name: state.draft.name.trim(),
              code: optionalText(state.draft.code),
              category: optionalText(state.draft.category),
              unit: state.draft.unit.trim(),
              isActive: state.draft.isActive,
              updatedAt: timestamp,
            });
          } else {
            await insertProduct(transaction, {
              id: materialId,
              name: state.draft.name.trim(),
              code: optionalText(state.draft.code),
              category: optionalText(state.draft.category),
              unit: state.draft.unit.trim(),
              isActive: state.draft.isActive,
              createdAt: timestamp,
              updatedAt: timestamp,
            });
          }

          await writePriceChanges(transaction, priceChanges, today, timestamp);
        });

        dispatch({ type: 'submitSuccess' });
        return { status: 'saved' };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not save this product.';
        dispatch({ type: 'submitFailure', message });
        return { status: 'error', message };
      }
    },
    [currentPrices, database, existing, productId, state.draft]
  );

  return {
    state,
    currentPrices,
    isLoading,
    loadError,
    change,
    save,
  };
}
