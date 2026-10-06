import { useCallback, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';

import type { ProductPrices } from '@/domain/materialPrice';
import type { Product } from '@/domain/product';
import { getCurrentPrices } from '@/products/materialPriceRepository';
import { listProducts } from '@/products/productRepository';

export function useProducts(search: string): {
  products: Product[];
  pricesByMaterial: Map<string, ProductPrices>;
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
} {
  const database = useSQLiteContext();
  const [products, setProducts] = useState<Product[]>([]);
  const [pricesByMaterial, setPricesByMaterial] = useState<Map<string, ProductPrices>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [rows, prices] = await Promise.all([listProducts(database, search), getCurrentPrices(database)]);
      setProducts(rows);
      setPricesByMaterial(prices);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load products.');
    } finally {
      setIsLoading(false);
    }
  }, [database, search]);

  return {
    products,
    pricesByMaterial,
    isLoading,
    error,
    reload,
  };
}
