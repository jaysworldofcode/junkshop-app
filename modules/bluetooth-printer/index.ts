import { requireOptionalNativeModule } from 'expo';

export type PairedDevice = {
  name: string;
  address: string;
};

type BluetoothPrinterModule = {
  isEnabled(): boolean;
  getPairedDevices(): Promise<PairedDevice[]>;
  printAsync(address: string, data: Uint8Array): Promise<void>;
};

/** Null in Expo Go, on iOS, and on the web: the module only exists in an Android build of this app. */
export const BluetoothPrinter = requireOptionalNativeModule<BluetoothPrinterModule>('BluetoothPrinter');
