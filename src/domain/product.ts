import {
  DEFAULT_PRODUCT_UNIT,
  PRODUCT_CATEGORY_MAX_LENGTH,
  PRODUCT_CODE_MAX_LENGTH,
  PRODUCT_NAME_MAX_LENGTH,
  PRODUCT_UNIT_MAX_LENGTH,
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
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProductWithUsage = Product & {
  purchaseCount: number;
};

export type ProductDraft = {
  name: string;
  code: string;
  category: string;
  unit: string;
  isActive: boolean;
  buyPrice: string;
  sellPrice: string;
};

export type ProductFieldErrors = {
  name?: string;
  unit?: string;
  code?: string;
  category?: string;
  buyPrice?: string;
  sellPrice?: string;
};

const PRICE_DRAFT_FIELDS: Record<PriceType, 'buyPrice' | 'sellPrice'> = {
  buy: 'buyPrice',
  sell: 'sellPrice',
};

export function createEmptyProductDraft(): ProductDraft {
  return {
    name: '',
    code: '',
    category: '',
    unit: DEFAULT_PRODUCT_UNIT,
    isActive: true,
    buyPrice: '',
    sellPrice: '',
  };
}

export function draftFromProduct(product: Product, prices: ProductPrices): ProductDraft {
  return {
    name: product.name,
    code: product.code ?? '',
    category: product.category ?? '',
    unit: product.unit,
    isActive: product.isActive,
    buyPrice: prices.buy ? formatPesoInput(prices.buy.price) : '',
    sellPrice: prices.sell ? formatPesoInput(prices.sell.price) : '',
  };
}

/** Prices on the product form that differ from the current ones. Expects a validated draft. */
export function priceChangesFromDraft(
  draft: ProductDraft,
  materialId: string,
  current: ProductPrices
): PriceChange[] {
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
  const unit = draft.unit.trim();

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

  if (draft.buyPrice.trim().length > 0 && parsePesoInput(draft.buyPrice) === null) {
    fieldErrors.buyPrice = 'Use a peso amount, like 420 or 420.50.';
  }

  if (draft.sellPrice.trim().length > 0 && parsePesoInput(draft.sellPrice) === null) {
    fieldErrors.sellPrice = 'Use a peso amount, like 470 or 470.50.';
  }

  return fieldErrors;
}

export function hasFieldErrors(fieldErrors: ProductFieldErrors): boolean {
  return Object.keys(fieldErrors).length > 0;
}

export function toLikeSearch(search: string): string {
  return search.trim().replaceAll('\\', '').replaceAll('%', '').replaceAll('_', '');
}
