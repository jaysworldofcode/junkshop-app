import { useCallback } from 'react';
import type { SQLiteDatabase } from 'expo-sqlite';

import { useFocusedQuery } from '@/db/useFocusedQuery';
import { listPriceChanges, listTicketPrices } from '@/products/priceHistoryRepository';
import { getProductPrices } from '@/products/materialPriceRepository';
import { getProduct } from '@/products/productRepository';

export function usePriceHistory(materialId: string) {
  const query = useCallback(
    async (database: SQLiteDatabase) => {
      const [product, current, changes, ticketDays] = await Promise.all([
        getProduct(database, materialId),
        getProductPrices(database, materialId),
        listPriceChanges(database, materialId),
        listTicketPrices(database, materialId),
      ]);
      return { product, current, changes, ticketDays };
    },
    [materialId]
  );

  return useFocusedQuery(query, 'Could not load the price history.');
}
