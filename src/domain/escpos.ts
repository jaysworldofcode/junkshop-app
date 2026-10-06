import { RECEIPT_FEED_LINES } from '@/constants/printing';
import { printerText, type ReceiptLine } from '@/domain/receipt';

const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

const INITIALIZE = [ESC, 0x40];
const ALIGN_LEFT = [ESC, 0x61, 0];
const ALIGN_CENTER = [ESC, 0x61, 1];
const BOLD_ON = [ESC, 0x45, 1];
const BOLD_OFF = [ESC, 0x45, 0];
const SIZE_NORMAL = [GS, 0x21, 0x00];
const SIZE_DOUBLE = [GS, 0x21, 0x11];

/** ESC/POS commands understood by GOOJPRT and most other 58 mm thermal printers. */
export function encodeReceipt(lines: ReceiptLine[]): Uint8Array {
  const bytes: number[] = [...INITIALIZE];

  for (const line of lines) {
    bytes.push(...(line.align === 'center' ? ALIGN_CENTER : ALIGN_LEFT));
    bytes.push(...(line.bold ? BOLD_ON : BOLD_OFF));
    bytes.push(...(line.large ? SIZE_DOUBLE : SIZE_NORMAL));
    for (const character of printerText(line.text)) {
      bytes.push(character.charCodeAt(0));
    }
    bytes.push(LF);
  }

  bytes.push(...ALIGN_LEFT, ...BOLD_OFF, ...SIZE_NORMAL, ESC, 0x64, RECEIPT_FEED_LINES);
  return Uint8Array.from(bytes);
}
