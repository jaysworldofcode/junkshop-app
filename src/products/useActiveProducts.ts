import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import type { ProductPrices } from '@/domain/materialPrice';
import type { ProductWithUsage } from '@/domain/product';
import { getCurrentPrices } from '@/products/materialPriceRepository';
import { listActiveProductsByUsage } from '@/products/productRepository';

/** Active products for the counter, most often bought first, with their current prices. */
export function useActiveProducts(): {
  products: ProductWithUsage[];
  pricesByMaterial: Map<string, ProductPrices>;
  isLoading: boolean;
  error: string | null;
} {
  const database = useSQLiteContext();
  const [products, setProducts] = useState<ProductWithUsage[]>([]);
  const [pricesByMaterial, setPricesByMaterial] = useState<Map<string, ProductPrices>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isCancelled = false;

      async function load() {
        setError(null);

        try {
          const [rows, prices] = await Promise.all([listActiveProductsByUsage(database), getCurrentPrices(database)]);
          if (!isCancelled) {
            setProducts(rows);
            setPricesByMaterial(prices);
          }
        } catch (loadError) {
          if (!isCancelled) {
            setError(loadError instanceof Error ? loadError.message : 'Could not load products.');
          }
        } finally {
          if (!isCancelled) {
            setIsLoading(false);
          }
        }
      }

      void load();

      return () => {
        isCancelled = true;
      };
    }, [database])
  );

  return { products, pricesByMaterial, isLoading, error };
}
