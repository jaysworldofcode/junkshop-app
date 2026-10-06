import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import type { PriceType } from '@/constants/price';
import { runInTransaction } from '@/db/runInTransaction';
import { todayLocalDateKey } from '@/domain/localDate';
import {
  buildPriceChanges,
  NO_PRICES,
  type PriceInputErrors,
  type PriceInputs,
  type ProductPrices,
} from '@/domain/materialPrice';
import { formatPesoInput } from '@/domain/money';
import type { ProductWithUsage } from '@/domain/product';
import { nowIso } from '@/domain/timestamps';
import { getCurrentPrices, writePriceChanges } from '@/products/materialPriceRepository';
import { listActiveProductsByUsage } from '@/products/productRepository';

function inputsFromPrices(prices: ProductPrices): PriceInputs {
  return {
    buy: prices.buy ? formatPesoInput(prices.buy.price) : '',
    sell: prices.sell ? formatPesoInput(prices.sell.price) : '',
  };
}

export function useCurrentPrices(): {
  products: ProductWithUsage[];
  currentPrices: Map<string, ProductPrices>;
  inputs: Record<string, PriceInputs>;
  errors: Record<string, PriceInputErrors>;
  isLoading: boolean;
  isSaving: boolean;
  loadError: string | null;
  saveError: string | null;
  savedCount: number | null;
  changeInput: (materialId: string, priceType: PriceType, value: string) => void;
  dismissSaved: () => void;
  save: () => Promise<void>;
} {
  const database = useSQLiteContext();
  const [products, setProducts] = useState<ProductWithUsage[]>([]);
  const [currentPrices, setCurrentPrices] = useState<Map<string, ProductPrices>>(new Map());
  const [inputs, setInputs] = useState<Record<string, PriceInputs>>({});
  const [errors, setErrors] = useState<Record<string, PriceInputErrors>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState<number | null>(null);

  const load = useCallback(async () => {
    const [rows, prices] = await Promise.all([listActiveProductsByUsage(database), getCurrentPrices(database)]);
    setProducts(rows);
    setCurrentPrices(prices);
    setInputs(Object.fromEntries(rows.map((row) => [row.id, inputsFromPrices(prices.get(row.id) ?? NO_PRICES)])));
    setErrors({});
  }, [database]);

  useFocusEffect(
    useCallback(() => {
      setLoadError(null);
      setSavedCount(null);
      load()
        .catch((error: unknown) => setLoadError(error instanceof Error ? error.message : 'Could not load prices.'))
        .finally(() => setIsLoading(false));
    }, [load])
  );

  const changeInput = useCallback((materialId: string, priceType: PriceType, value: string) => {
    setInputs((previous) => ({ ...previous, [materialId]: { ...previous[materialId], [priceType]: value } }));
    setErrors((previous) =>
      previous[materialId]?.[priceType]
        ? { ...previous, [materialId]: { ...previous[materialId], [priceType]: undefined } }
        : previous
    );
    setSavedCount(null);
  }, []);

  const save = useCallback(async () => {
    const today = todayLocalDateKey();
    const { changes, errors: inputErrors } = buildPriceChanges(inputs, currentPrices);

    if (Object.keys(inputErrors).length > 0) {
      setErrors(inputErrors);
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      await runInTransaction(database, (transaction) => writePriceChanges(transaction, changes, today, nowIso()));
      await load();
      setSavedCount(changes.length);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Could not save prices. Nothing was saved.');
    } finally {
      setIsSaving(false);
    }
  }, [currentPrices, database, inputs, load]);

  return {
    products,
    currentPrices,
    inputs,
    errors,
    isLoading,
    isSaving,
    loadError,
    saveError,
    savedCount,
    changeInput,
    dismissSaved: () => setSavedCount(null),
    save,
  };
}
