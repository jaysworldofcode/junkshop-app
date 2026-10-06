import { useCallback, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';

import { isPrintingSupported, PrintError, printReceipt, type ReceiptKind } from '@/printing/printService';
import { loadPrinterSettings } from '@/printing/printerSettings';

export type PrintStatus =
  | { state: 'idle' }
  | { state: 'printing' }
  | { state: 'printed' }
  | { state: 'failed'; message: string };

export function useReceiptPrinter(kind: ReceiptKind) {
  const database = useSQLiteContext();
  const [status, setStatus] = useState<PrintStatus>({ state: 'idle' });
  const [lastId, setLastId] = useState<string | null>(null);

  const print = useCallback(
    async (id: string) => {
      setLastId(id);
      setStatus({ state: 'printing' });
      try {
        await printReceipt(database, kind, id);
        setStatus({ state: 'printed' });
      } catch (error) {
        setStatus({
          state: 'failed',
          message: error instanceof PrintError ? error.message : 'Could not print the receipt.',
        });
      }
    },
    [database, kind]
  );

  /** Prints right after saving when a printer is chosen and automatic printing is on. */
  const printAfterSave = useCallback(
    async (id: string) => {
      setStatus({ state: 'idle' });
      setLastId(id);
      if (!isPrintingSupported) {
        return;
      }
      const settings = await loadPrinterSettings();
      if (settings.printer && settings.autoPrint) {
        await print(id);
      }
    },
    [print]
  );

  const printLast = useCallback(() => (lastId ? print(lastId) : Promise.resolve()), [lastId, print]);

  return { status, print, printAfterSave, printLast, isSupported: isPrintingSupported };
}
