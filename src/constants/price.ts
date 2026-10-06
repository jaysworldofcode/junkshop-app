export const PRICE_TYPES = ['buy', 'sell', 'supplier'] as const;
export type PriceType = (typeof PRICE_TYPES)[number];

export const PRICE_SOURCE_MANUAL = 'manual';

export const PRICE_TYPE_LABELS: Record<PriceType, string> = {
  buy: 'Buy price',
  sell: 'Sell price',
  supplier: 'Supplier price',
};

export const PRICE_TYPE_HINTS: Record<PriceType, string> = {
  buy: 'What you pay people who bring scrap. Used on the Buy screen.',
  sell: 'What walk-in buyers pay you. Used on the Sell screen.',
  supplier: 'What the supplier pays when you deliver. Tracked for price history only.',
};

export const TICKET_PRICE_DAY_LIMIT = 30;
