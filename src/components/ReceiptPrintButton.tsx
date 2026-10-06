import { PrintStatusNotice } from '@/components/PrintStatusNotice';
import type { ReceiptKind } from '@/printing/printService';
import { useReceiptPrinter } from '@/printing/useReceiptPrinter';

type ReceiptPrintButtonProps = {
  kind: ReceiptKind;
  id: string;
};

/** Hidden where printing is not available, such as Expo Go. */
export function ReceiptPrintButton({ kind, id }: ReceiptPrintButtonProps) {
  const { status, print, isSupported } = useReceiptPrinter(kind);

  if (!isSupported) {
    return null;
  }

  return <PrintStatusNotice status={status} onPrint={() => void print(id)} />;
}
