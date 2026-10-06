import AsyncStorage from '@react-native-async-storage/async-storage';

import { PRINTER_SETTINGS_KEY } from '@/constants/storage';
import type { ShopDetails } from '@/domain/receipt';

export type PrinterSettings = ShopDetails & {
  printer: { name: string; address: string } | null;
  autoPrint: boolean;
};

export const DEFAULT_PRINTER_SETTINGS: PrinterSettings = {
  printer: null,
  autoPrint: true,
  shopName: '',
  shopPhone: '',
  shopAddress: '',
};

export async function loadPrinterSettings(): Promise<PrinterSettings> {
  try {
    const stored = await AsyncStorage.getItem(PRINTER_SETTINGS_KEY);
    return stored ? { ...DEFAULT_PRINTER_SETTINGS, ...(JSON.parse(stored) as Partial<PrinterSettings>) } : DEFAULT_PRINTER_SETTINGS;
  } catch {
    return DEFAULT_PRINTER_SETTINGS;
  }
}

export async function savePrinterSettings(settings: PrinterSettings): Promise<void> {
  await AsyncStorage.setItem(PRINTER_SETTINGS_KEY, JSON.stringify(settings));
}
