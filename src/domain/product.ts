import {
  DEFAULT_PRICING_MODE,
  DEFAULT_PRODUCT_UNIT,
  isPakyawMode,
  PAKYAW_UNIT,
  PRODUCT_CATEGORY_MAX_LENGTH,
  PRODUCT_CODE_MAX_LENGTH,
  PRODUCT_NAME_MAX_LENGTH,
  PRODUCT_UNIT_MAX_LENGTH,
  type PricingMode,
} from '@/constants/product';
import { PRICE_TYPES, type PriceType } from '@/constants/price';
import { isPriceChanged, type PriceChange, type ProductPrices } from '@/domain/materialPrice';
import { formatPesoInput, parsePesoInput } from '@/domain/money';

export type Product = {
  id: string;
  name: string;
  code: string | null;
  category: string | null;
  unit: string;
  pricingMode: PricingMode;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProductWithUsage = Product & {
  purchaseCount: number;
  saleCount: number;
};

export type ProductUsage = 'purchase' | 'sale';

export const MOST_USED_PRODUCT_LIMIT = 6;

export function usageCount(product: ProductWithUsage, usage: ProductUsage): number {
  return usage === 'sale' ? product.saleCount : product.purchaseCount;
}

function compareByName(a: Product, b: Product): number {
  return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
}

/** The most used products first, then every other product A to Z. A product appears in only one group. */
export function groupProductsByUsage(
  products: ProductWithUsage[],
  usage: ProductUsage,
  limit: number = MOST_USED_PRODUCT_LIMIT
): { mostUsed: ProductWithUsage[]; alphabetical: ProductWithUsage[] } {
  const mostUsed = products
    .filter((product) => usageCount(product, usage) > 0)
    .sort((a, b) => usageCount(b, usage) - usageCount(a, usage) || compareByName(a, b))
    .slice(0, limit);
  const mostUsedIds = new Set(mostUsed.map((product) => product.id));
  const alphabetical = products.filter((product) => !mostUsedIds.has(product.id)).sort(compareByName);

  return { mostUsed, alphabetical };
}

export type ProductDraft = {
  name: string;
  code: string;
  category: string;
  unit: string;
  pricingMode: PricingMode;
  isActive: boolean;
  buyPrice: string;
  sellPrice: string;
  supplierPrice: string;
};

type PriceDraftField = 'buyPrice' | 'sellPrice' | 'supplierPrice';

export type ProductFieldErrors = {
  name?: string;
  unit?: string;
  code?: string;
  category?: string;
} & Partial<Record<PriceDraftField, string>>;

export const PRICE_DRAFT_FIELDS: Record<PriceType, PriceDraftField> = {
  buy: 'buyPrice',
  sell: 'sellPrice',
  supplier: 'supplierPrice',
};

export function createEmptyProductDraft(): ProductDraft {
  return {
    name: '',
    code: '',
    category: '',
    unit: DEFAULT_PRODUCT_UNIT,
    pricingMode: DEFAULT_PRICING_MODE,
    isActive: true,
    buyPrice: '',
    sellPrice: '',
    supplierPrice: '',
  };
}

export function draftFromProduct(product: Product, prices: ProductPrices): ProductDraft {
  return {
    name: product.name,
    code: product.code ?? '',
    category: product.category ?? '',
    unit: product.unit,
    pricingMode: product.pricingMode,
    isActive: product.isActive,
    buyPrice: prices.buy ? formatPesoInput(prices.buy.price) : '',
    sellPrice: prices.sell ? formatPesoInput(prices.sell.price) : '',
    supplierPrice: prices.supplier ? formatPesoInput(prices.supplier.price) : '',
  };
}

/** Prices on the product form that differ from the current ones. Expects a validated draft. */
export function priceChangesFromDraft(
  draft: ProductDraft,
  materialId: string,
  current: ProductPrices
): PriceChange[] {
  if (isPakyawMode(draft.pricingMode)) {
    return [];
  }

  return PRICE_TYPES.flatMap((priceType) => {
    const price = parsePesoInput(draft[PRICE_DRAFT_FIELDS[priceType]]);
    return price !== null && isPriceChanged(current[priceType], price)
      ? [{ materialId, priceType, price }]
      : [];
  });
}

export function normalizeProductKey(value: string): string {
  return value.trim().toLowerCase();
}

export { optionalText } from '@/domain/text';

export function isSameActiveProduct(
  candidate: { name: string; unit: string },
  existing: { name: string; unit: string; isActive: boolean }
): boolean {
  if (!existing.isActive) {
    return false;
  }

  return (
    normalizeProductKey(candidate.name) === normalizeProductKey(existing.name) &&
    normalizeProductKey(candidate.unit) === normalizeProductKey(existing.unit)
  );
}

export function validateProductDraft(draft: ProductDraft): ProductFieldErrors {
  const fieldErrors: ProductFieldErrors = {};
  const name = draft.name.trim();
  const unit = isPakyawMode(draft.pricingMode) ? PAKYAW_UNIT : draft.unit.trim();

  if (name.length === 0) {
    fieldErrors.name = 'Name is required.';
  } else if (name.length > PRODUCT_NAME_MAX_LENGTH) {
    fieldErrors.name = `Name must be ${PRODUCT_NAME_MAX_LENGTH} characters or fewer.`;
  }

  if (unit.length === 0) {
    fieldErrors.unit = 'Unit is required.';
  } else if (unit.length > PRODUCT_UNIT_MAX_LENGTH) {
    fieldErrors.unit = `Unit must be ${PRODUCT_UNIT_MAX_LENGTH} characters or fewer.`;
  }

  if (draft.code.trim().length > PRODUCT_CODE_MAX_LENGTH) {
    fieldErrors.code = `Code must be ${PRODUCT_CODE_MAX_LENGTH} characters or fewer.`;
  }

  if (draft.category.trim().length > PRODUCT_CATEGORY_MAX_LENGTH) {
    fieldErrors.category = `Category must be ${PRODUCT_CATEGORY_MAX_LENGTH} characters or fewer.`;
  }

  if (!isPakyawMode(draft.pricingMode)) {
    for (const field of Object.values(PRICE_DRAFT_FIELDS)) {
      if (draft[field].trim().length > 0 && parsePesoInput(draft[field]) === null) {
        fieldErrors[field] = 'Use a peso amount, like 420 or 420.50.';
      }
    }
  }

  return fieldErrors;
}

export function hasFieldErrors(fieldErrors: ProductFieldErrors): boolean {
  return Object.keys(fieldErrors).length > 0;
}

export function toLikeSearch(search: string): string {
  return search.trim().replaceAll('\\', '').replaceAll('%', '').replaceAll('_', '');
}
