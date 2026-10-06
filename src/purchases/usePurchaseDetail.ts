import { useEffect, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';

import type { PurchaseDetail } from '@/domain/purchaseHistory';
import { getPurchaseDetail } from '@/purchases/purchaseRepository';

export function usePurchaseDetail(purchaseId: string): {
  purchase: PurchaseDetail | null;
  isLoading: boolean;
  error: string | null;
} {
  const database = useSQLiteContext();
  const [purchase, setPurchase] = useState<PurchaseDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const detail = await getPurchaseDetail(database, purchaseId);
        if (isCancelled) {
          return;
        }

        setPurchase(detail);
        if (!detail) {
          setError('This purchase could not be found.');
        }
      } catch (loadError) {
        if (!isCancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Could not open this purchase.');
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
  }, [database, purchaseId]);

  return { purchase, isLoading, error };
}
