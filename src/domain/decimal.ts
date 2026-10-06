const DECIMAL_INPUT_PATTERN = /^(\d+(\.\d*)?|\.\d+)$/;
const THOUSANDS_SEPARATOR = ',';

/**
 * Parses typed text such as "35.5" into an integer scaled by 10^fractionDigits
 * using string math, so 35.5 kg becomes exactly 35500 with no float rounding.
 */
export function parseScaledDecimal(text: string, fractionDigits: number): number | null {
  const cleaned = text.trim().replaceAll(THOUSANDS_SEPARATOR, '');
  if (!DECIMAL_INPUT_PATTERN.test(cleaned)) {
    return null;
  }

  const [wholePart, fractionPart = ''] = cleaned.split('.');
  if (fractionPart.length > fractionDigits) {
    return null;
  }

  const scaled = Number(`${wholePart || '0'}${fractionPart.padEnd(fractionDigits, '0')}`);
  return Number.isSafeInteger(scaled) ? scaled : null;
}
