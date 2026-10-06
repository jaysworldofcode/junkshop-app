import { PRICE_TYPES, type PriceType } from '@/constants/price';
import { formatDateLabel, type LocalDateKey } from '@/domain/localDate';
import { parsePesoInput } from '@/domain/money';

export type PriceInputs = Record<PriceType, string>;
export type PriceInputErrors = Partial<Record<PriceType, string>>;

/** The price in effect for a material. It stays current until the shop changes it. */
export type CurrentPrice = {
  price: number;
  effectiveDate: LocalDateKey;
};

export type ProductPrices = Record<PriceType, CurrentPrice | null>;

export const NO_PRICES: ProductPrices = { buy: null, sell: null, supplier: null };

export type PriceChange = {
  materialId: string;
  priceType: PriceType;
  price: number;
};

export function isPriceChanged(current: CurrentPrice | null, price: number): boolean {
  return current === null || current.price !== price;
}

/** Checks every typed price. Blank and unchanged prices are skipped; only real changes are returned. */
export function buildPriceChanges(
  inputsByMaterial: Record<string, PriceInputs>,
  currentByMaterial: Map<string, ProductPrices>
): { changes: PriceChange[]; errors: Record<string, PriceInputErrors> } {
  const changes: PriceChange[] = [];
  const errors: Record<string, PriceInputErrors> = {};

  for (const [materialId, inputs] of Object.entries(inputsByMaterial)) {
    const current = currentByMaterial.get(materialId) ?? NO_PRICES;

    for (const priceType of PRICE_TYPES) {
      const text = inputs[priceType];
      if (text.trim().length === 0) {
        continue;
      }

      const price = parsePesoInput(text);
      if (price === null) {
        errors[materialId] = { ...errors[materialId], [priceType]: 'Use a peso amount, like 420.50.' };
      } else if (isPriceChanged(current[priceType], price)) {
        changes.push({ materialId, priceType, price });
      }
    }
  }

  return { changes, errors };
}

export function priceSinceLabel(current: CurrentPrice | null, today: LocalDateKey): string {
  if (current === null) {
    return 'Not set yet';
  }

  return current.effectiveDate === today ? 'Changed today' : `Since ${formatDateLabel(current.effectiveDate)}`;
}

export function priceDifference(entered: number | null, reference: CurrentPrice | null): number | null {
  if (entered === null || reference === null) {
    return null;
  }

  return entered - reference.price;
}
