import { useCallback, useEffect, useState } from 'react';

import type { PairedDevice } from '../../modules/bluetooth-printer';
import { isPrintingSupported, listPairedDevices, PrintError, printTestPage } from '@/printing/printService';
import {
  DEFAULT_PRINTER_SETTINGS,
  loadPrinterSettings,
  savePrinterSettings,
  type PrinterSettings,
} from '@/printing/printerSettings';

type Busy = 'devices' | 'test' | null;

export function usePrinterSetup() {
  const [settings, setSettings] = useState<PrinterSettings>(DEFAULT_PRINTER_SETTINGS);
  const [devices, setDevices] = useState<PairedDevice[] | null>(null);
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    loadPrinterSettings().then((loaded) => {
      if (!isCancelled) {
        setSettings(loaded);
      }
    });
    return () => {
      isCancelled = true;
    };
  }, []);

  const update = useCallback((changes: Partial<PrinterSettings>) => {
    setSettings((current) => {
      const next = { ...current, ...changes };
      void savePrinterSettings(next);
      return next;
    });
  }, []);

  const run = useCallback(async (kind: Exclude<Busy, null>, task: () => Promise<void>) => {
    setBusy(kind);
    setError(null);
    setNotice(null);
    try {
      await task();
    } catch (taskError) {
      setError(taskError instanceof PrintError ? taskError.message : 'Something went wrong with the printer.');
    } finally {
      setBusy(null);
    }
  }, []);

  const findPrinters = useCallback(
    () =>
      run('devices', async () => {
        setDevices(await listPairedDevices());
      }),
    [run]
  );

  const choosePrinter = useCallback(
    (device: PairedDevice) => {
      update({ printer: device });
      setDevices(null);
      setNotice(`${device.name} is ready. Print a test page to check it.`);
    },
    [update]
  );

  const testPrint = useCallback(
    () =>
      run('test', async () => {
        await printTestPage();
        setNotice('Test page sent to the printer.');
      }),
    [run]
  );

  return {
    isSupported: isPrintingSupported,
    settings,
    devices,
    busy,
    error,
    notice,
    dismissNotice: () => setNotice(null),
    findPrinters,
    choosePrinter,
    forgetPrinter: () => update({ printer: null }),
    setAutoPrint: (autoPrint: boolean) => update({ autoPrint }),
    setShopName: (shopName: string) => update({ shopName }),
    setShopPhone: (shopPhone: string) => update({ shopPhone }),
    setShopAddress: (shopAddress: string) => update({ shopAddress }),
    testPrint,
  };
}
