import { PermissionsAndroid, Platform } from 'react-native';
import type { SQLiteDatabase } from 'expo-sqlite';

import { BluetoothPrinter, type PairedDevice } from '../../modules/bluetooth-printer';
import { getSaleDetail } from '@/dashboard/dashboardRepository';
import { encodeReceipt } from '@/domain/escpos';
import { RECEIPT_LINE_WIDTH, RECEIPT_RULE_CHARACTER } from '@/constants/printing';
import {
  buildReceiptLines,
  shopHeaderLines,
  ticketFromPurchase,
  ticketFromSale,
  type ReceiptLine,
  type ReceiptTicket,
} from '@/domain/receipt';
import { loadPrinterSettings } from '@/printing/printerSettings';
import { getPurchaseDetail } from '@/purchases/purchaseRepository';

export type ReceiptKind = 'purchase' | 'sale';

export class PrintError extends Error {}

/** False in Expo Go, on iOS, and on the web. */
export const isPrintingSupported = BluetoothPrinter !== null;

export async function listPairedDevices(): Promise<PairedDevice[]> {
  const printer = requirePrinterModule();
  await ensureBluetoothPermission();
  try {
    return await printer.getPairedDevices();
  } catch (error) {
    throw toPrintError(error);
  }
}

export async function printReceipt(database: SQLiteDatabase, kind: ReceiptKind, id: string): Promise<void> {
  const ticket = await loadTicket(database, kind, id);
  const settings = await loadPrinterSettings();
  await sendLines(buildReceiptLines(ticket, settings, new Date()));
}

/** Prints the receipt header too, so the shop details can be checked on paper. */
export async function printTestPage(): Promise<void> {
  const settings = await loadPrinterSettings();
  await sendLines([
    ...shopHeaderLines(settings),
    { text: RECEIPT_RULE_CHARACTER.repeat(RECEIPT_LINE_WIDTH) },
    { text: 'PRINTER TEST', align: 'center', bold: true },
    { text: 'The printer is working.', align: 'center' },
    { text: new Date().toLocaleString('en-PH'), align: 'center' },
  ]);
}

async function sendLines(lines: ReceiptLine[]): Promise<void> {
  const printer = requirePrinterModule();
  const { printer: selected } = await loadPrinterSettings();
  if (!selected) {
    throw new PrintError('Choose a printer first in Home > Printer.');
  }

  await ensureBluetoothPermission();
  try {
    await printer.printAsync(selected.address, encodeReceipt(lines));
  } catch (error) {
    throw toPrintError(error);
  }
}

async function loadTicket(database: SQLiteDatabase, kind: ReceiptKind, id: string): Promise<ReceiptTicket> {
  if (kind === 'purchase') {
    const purchase = await getPurchaseDetail(database, id);
    if (purchase) {
      return ticketFromPurchase(purchase);
    }
  } else {
    const sale = await getSaleDetail(database, id);
    if (sale) {
      return ticketFromSale(sale);
    }
  }
  throw new PrintError('This ticket could not be found.');
}

function requirePrinterModule(): NonNullable<typeof BluetoothPrinter> {
  if (!BluetoothPrinter) {
    throw new PrintError('Printing works only in the installed Android app, not in Expo Go.');
  }
  return BluetoothPrinter;
}

/** Android 12 and newer ask for Nearby devices. SCAN is needed to cancel discovery before connecting. */
async function ensureBluetoothPermission(): Promise<void> {
  if (Platform.OS !== 'android' || Number(Platform.Version) < 31) {
    return;
  }
  const permissions = [
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
  ];
  const result = await PermissionsAndroid.requestMultiple(permissions);
  if (result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] !== PermissionsAndroid.RESULTS.GRANTED) {
    throw new PrintError('Allow Nearby devices for Junkshop in Android settings to use the printer.');
  }
}

const NATIVE_ERROR_MESSAGES: Record<string, string> = {
  ERR_BLUETOOTH_UNAVAILABLE: 'This phone has no Bluetooth.',
  ERR_BLUETOOTH_OFF: 'Bluetooth is off. Turn it on, then try again.',
  ERR_BLUETOOTH_PERMISSION: 'Allow Nearby devices for Junkshop in Android settings to use the printer.',
  ERR_PRINTER_NOT_PAIRED: 'The printer is no longer paired. Pair it in Bluetooth settings, then choose it again.',
  ERR_PRINTER_CONNECT:
    'Could not reach the printer. Close other printer apps, keep it on and nearby, then try again.',
};

function toPrintError(error: unknown): PrintError {
  const code = nativeErrorCode(error);
  const message = code ? NATIVE_ERROR_MESSAGES[code] : undefined;
  if (!message) {
    console.warn('Printing failed', error);
  }
  return new PrintError(message ?? NATIVE_ERROR_MESSAGES.ERR_PRINTER_CONNECT);
}

function nativeErrorCode(error: unknown): string {
  if (typeof error !== 'object' || error === null) {
    return '';
  }
  const record = error as { code?: unknown; message?: unknown };
  const haystack = `${record.code ?? ''} ${record.message ?? ''}`;
  return Object.keys(NATIVE_ERROR_MESSAGES).find((code) => haystack.includes(code)) ?? '';
}
