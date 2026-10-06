import { QUANTITY_FRACTION_DIGITS, QUANTITY_LOCALE, QUANTITY_SCALE } from '@/constants/quantity';
import { parseScaledDecimal } from '@/domain/decimal';

export function parseQuantityInput(text: string): number | null {
  return parseScaledDecimal(text, QUANTITY_FRACTION_DIGITS);
}

export function toThousandths(quantity: number): number {
  return Math.round(quantity * QUANTITY_SCALE);
}

export function fromThousandths(thousandths: number): number {
  return thousandths / QUANTITY_SCALE;
}

export function formatQuantity(thousandths: number): string {
  return new Intl.NumberFormat(QUANTITY_LOCALE, {
    minimumFractionDigits: 0,
    maximumFractionDigits: QUANTITY_FRACTION_DIGITS,
  }).format(fromThousandths(thousandths));
}

export function amountForQuantity(quantityThousandths: number, unitPriceCentavos: number): number {
  return Math.round((quantityThousandths * unitPriceCentavos) / QUANTITY_SCALE);
}
