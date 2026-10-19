export const TRANSACTION_KINDS = ['sale', 'purchase'] as const;
export type TransactionKind = (typeof TRANSACTION_KINDS)[number];

export const TICKET_STATUSES = ['active', 'cancelled'] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

/** Cancelled tickets stay saved and can be restored, but no total, report, or list counts them. */
export function parseTicketStatus(value: string | null | undefined): TicketStatus {
  return value === 'cancelled' ? 'cancelled' : 'active';
}

export const TRANSACTION_FILTERS = ['all', ...TRANSACTION_KINDS, 'cancelled'] as const;
export type TransactionFilter = (typeof TRANSACTION_FILTERS)[number];

export const DEFAULT_TRANSACTION_FILTER: TransactionFilter = 'sale';

export const TRANSACTION_FILTER_LABELS: Record<TransactionFilter, string> = {
  all: 'All',
  sale: 'Sales',
  purchase: 'Purchases',
  cancelled: 'Cancelled',
};

export const TRANSACTION_KIND_LABELS: Record<TransactionKind, string> = {
  sale: 'Sold',
  purchase: 'Bought',
};
