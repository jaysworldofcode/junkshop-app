import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import type { PurchaseDetail } from '@/domain/purchaseHistory';
import { getPurchaseDetail } from '@/purchases/purchaseRepository';

export function usePurchaseDetail(purchaseId: string): {
  purchase: PurchaseDetail | null;
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
} {
  const database = useSQLiteContext();
  const [loadedId, setLoadedId] = useState(purchaseId);
  const [purchase, setPurchase] = useState<PurchaseDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (loadedId !== purchaseId) {
    setLoadedId(purchaseId);
    setPurchase(null);
    setIsLoading(true);
    setError(null);
  }

  const reload = useCallback(async () => {
    setError(null);
    try {
      const detail = await getPurchaseDetail(database, purchaseId);
      setPurchase(detail);
      if (!detail) {
        setError('This purchase could not be found.');
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not open this purchase.');
    } finally {
      setIsLoading(false);
    }
  }, [database, purchaseId]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload])
  );

  return { purchase, isLoading: isLoading && !purchase, error, reload };
}
