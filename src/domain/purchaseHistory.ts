import type { PaymentMethod, PaymentStatus } from '@/constants/payment';
import type { PurchaseItemStatus } from '@/constants/purchase';
import type { LocalDateKey } from '@/domain/localDate';

export type PurchaseListEntry = {
  id: string;
  purchaseNumber: string;
  sellerName: string;
  purchaseDate: LocalDateKey;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  lineCount: number;
  unsoldLineCount: number;
  materialNames: string[];
};

export type PurchaseDetailItem = {
  id: string;
  materialName: string;
  unit: string;
  quantity: number;
  unitBuyPrice: number;
  purchaseTotal: number;
  supplierPrice: number | null;
  expectedSellTotal: number | null;
  expectedProfit: number | null;
  plannedBuyer: string | null;
  status: PurchaseItemStatus;
};

export type PurchaseDetail = {
  id: string;
  purchaseNumber: string;
  sellerName: string;
  purchaseDate: LocalDateKey;
  subtotal: number;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  notes: string | null;
  createdAt: string;
  items: PurchaseDetailItem[];
};

export type PurchaseDaySection = {
  purchaseDate: LocalDateKey;
  dayTotal: number;
  data: PurchaseListEntry[];
};

/** Expects entries already sorted newest first. */
export function groupPurchasesByDay(entries: PurchaseListEntry[]): PurchaseDaySection[] {
  const sections: PurchaseDaySection[] = [];

  for (const entry of entries) {
    const current = sections.at(-1);
    if (current && current.purchaseDate === entry.purchaseDate) {
      current.data.push(entry);
      current.dayTotal += entry.totalAmount;
    } else {
      sections.push({ purchaseDate: entry.purchaseDate, dayTotal: entry.totalAmount, data: [entry] });
    }
  }

  return sections;
}

export function sumExpected(items: PurchaseDetailItem[]): { expectedSellTotal: number; expectedProfit: number } {
  return items.reduce(
    (totals, item) => ({
      expectedSellTotal: totals.expectedSellTotal + (item.expectedSellTotal ?? 0),
      expectedProfit: totals.expectedProfit + (item.expectedProfit ?? 0),
    }),
    { expectedSellTotal: 0, expectedProfit: 0 }
  );
}
