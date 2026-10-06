import { hasBusinessData } from '@/backup/dataTransferRepository';
import { useFocusedQuery } from '@/db/useFocusedQuery';

export function useHasBusinessData() {
  return useFocusedQuery(hasBusinessData, 'Could not read the local data.');
}
