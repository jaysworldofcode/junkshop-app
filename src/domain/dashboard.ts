import type { PaymentMethod, PaymentStatus } from '@/constants/payment';
import type { TransactionKind } from '@/constants/transaction';
import type { LocalDateKey } from '@/domain/localDate';

export type PeriodTotals = {
  purchaseCount: number;
  purchaseTotal: number;
  saleCount: number;
  saleTotal: number;
  realizedProfit: number;
  unsettledPurchases: number;
  unsettledSales: number;
};

export type TransactionEntry = {
  kind: TransactionKind;
  id: string;
  ticketNumber: string;
  personName: string;
  date: LocalDateKey;
  createdAt: string;
  totalAmount: number;
  /** Actual profit for a sale. Purchases have no realized profit. */
  profit: number | null;
  paymentStatus: PaymentStatus;
  materialNames: string[];
};

export type SaleDetailItem = {
  id: string;
  materialName: string;
  unit: string;
  quantity: number;
  unitSellPrice: number;
  saleTotal: number;
  allocatedPurchaseCost: number;
  actualProfit: number;
};

export type SaleDetail = {
  id: string;
  saleNumber: string;
  buyerName: string;
  saleDate: LocalDateKey;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  notes: string | null;
  items: SaleDetailItem[];
};

/** Newest first: by date, then by when the ticket was saved. */
export function mergeTransactions(...groups: TransactionEntry[][]): TransactionEntry[] {
  return groups
    .flat()
    .sort((a, b) => (a.date === b.date ? b.createdAt.localeCompare(a.createdAt) : b.date.localeCompare(a.date)));
}

export function sumSaleItems(items: SaleDetailItem[]): { cost: number; profit: number } {
  return items.reduce(
    (totals, item) => ({
      cost: totals.cost + item.allocatedPurchaseCost,
      profit: totals.profit + item.actualProfit,
    }),
    { cost: 0, profit: 0 }
  );
}
