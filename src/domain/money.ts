import {
  CENTAVOS_PER_PESO,
  PESO_CURRENCY_CODE,
  PESO_FRACTION_DIGITS,
  PESO_LOCALE,
} from '@/constants/money';
import { parseScaledDecimal } from '@/domain/decimal';

export function parsePesoInput(text: string): number | null {
  return parseScaledDecimal(text, PESO_FRACTION_DIGITS);
}

/** Turns stored centavos back into text a cashier would type, e.g. 42000 -> "420", 42050 -> "420.50". */
export function formatPesoInput(centavos: number): string {
  const pesos = Math.trunc(centavos / CENTAVOS_PER_PESO);
  const remainder = Math.abs(centavos % CENTAVOS_PER_PESO);
  return remainder === 0 ? String(pesos) : `${pesos}.${String(remainder).padStart(PESO_FRACTION_DIGITS, '0')}`;
}

export function pesosToCentavos(pesos: number): number {
  return Math.round(pesos * CENTAVOS_PER_PESO);
}

export function centavosToPesos(centavos: number): number {
  return centavos / CENTAVOS_PER_PESO;
}

export function formatPeso(centavos: number): string {
  return new Intl.NumberFormat(PESO_LOCALE, {
    style: 'currency',
    currency: PESO_CURRENCY_CODE,
    minimumFractionDigits: PESO_FRACTION_DIGITS,
    maximumFractionDigits: PESO_FRACTION_DIGITS,
  }).format(centavosToPesos(centavos));
}
