export const PRICE_TYPES = ['buy', 'sell'] as const;
export type PriceType = (typeof PRICE_TYPES)[number];

export const PRICE_SOURCE_MANUAL = 'manual';

export const PRICE_TYPE_LABELS: Record<PriceType, string> = {
  buy: 'Buy price',
  sell: 'Sell price',
};

export const TICKET_PRICE_DAY_LIMIT = 30;
