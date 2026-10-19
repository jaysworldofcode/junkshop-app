import type { PaymentMethod, PaymentStatus } from '@/constants/payment';
import type { PricingMode } from '@/constants/product';
import type { TicketStatus, TransactionFilter, TransactionKind } from '@/constants/transaction';
import type { LocalDateKey } from '@/domain/localDate';

export type PeriodTotals = {
  purchaseCount: number;
  purchaseTotal: number;
  saleCount: number;
  saleTotal: number;
  /** Sell price minus buy price on sale lines. */
  realizedProfit: number;
  /** Supplier price minus buy price on purchase lines. */
  buyProfit: number;
  buyItemsWithoutSupplierPrice: number;
  totalProfit: number;
  expenseCount: number;
  expenseTotal: number;
  profitAfterExpenses: number;
  /** Realized profit minus expenses. */
  netProfit: number;
  unsettledPurchases: number;
  unsettledSales: number;
};

export type ProfitBreakdown = Pick<PeriodTotals, 'totalProfit' | 'profitAfterExpenses' | 'netProfit'>;

export function breakDownProfit(realizedProfit: number, buyProfit: number, expenseTotal: number): ProfitBreakdown {
  const totalProfit = realizedProfit + buyProfit;
  return {
    totalProfit,
    profitAfterExpenses: totalProfit - expenseTotal,
    netProfit: realizedProfit - expenseTotal,
  };
}

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
  status: TicketStatus;
  materialNames: string[];
};

export type SaleDetailItem = {
  id: string;
  materialName: string;
  unit: string;
  pricingMode: PricingMode;
  quantity: number;
  unitSellPrice: number;
  saleTotal: number;
  allocatedPurchaseCost: number;
  actualProfit: number;
};

export type SaleDetail = {
  id: string;
  saleNumber: string;
  buyerId: string | null;
  buyerName: string;
  status: TicketStatus;
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

/** Cancelled tickets stay out of Sales, Purchases, and All. The Cancelled chip is the only way to see them. */
export function matchesTransactionFilter(transaction: TransactionEntry, filter: TransactionFilter): boolean {
  if (filter === 'cancelled') {
    return transaction.status === 'cancelled';
  }
  if (transaction.status === 'cancelled') {
    return false;
  }
  return filter === 'all' || transaction.kind === filter;
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
