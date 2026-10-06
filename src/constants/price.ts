export const PRICE_TYPES = ['buy', 'sell'] as const;
export type PriceType = (typeof PRICE_TYPES)[number];

export const PRICE_SOURCE_MANUAL = 'manual';
