import type { PriceType } from '@/constants/price';
import type { LocalDateKey } from '@/domain/localDate';

export type PriceChangeEntry = {
  id: string;
  priceType: PriceType;
  price: number;
  effectiveDate: LocalDateKey;
  /** The price of the same type that was current before this change. */
  previousPrice: number | null;
};

export type TicketPriceDay = {
  date: LocalDateKey;
  averageBuyPrice: number | null;
  quantityBought: number;
  averageSellPrice: number | null;
  quantitySold: number;
};

/** Expects entries sorted newest first; links each change to the older one of the same type. */
export function linkPreviousPrices(entries: Omit<PriceChangeEntry, 'previousPrice'>[]): PriceChangeEntry[] {
  return entries.map((entry, index) => {
    const older = entries.slice(index + 1).find((candidate) => candidate.priceType === entry.priceType);
    return { ...entry, previousPrice: older?.price ?? null };
  });
}
