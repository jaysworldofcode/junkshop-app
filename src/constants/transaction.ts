export const TRANSACTION_KINDS = ['sale', 'purchase'] as const;
export type TransactionKind = (typeof TRANSACTION_KINDS)[number];

export const TRANSACTION_FILTERS = ['all', ...TRANSACTION_KINDS] as const;
export type TransactionFilter = (typeof TRANSACTION_FILTERS)[number];

export const DEFAULT_TRANSACTION_FILTER: TransactionFilter = 'sale';

export const TRANSACTION_FILTER_LABELS: Record<TransactionFilter, string> = {
  all: 'All',
  sale: 'Sales',
  purchase: 'Purchases',
};

export const TRANSACTION_KIND_LABELS: Record<TransactionKind, string> = {
  sale: 'Sold',
  purchase: 'Bought',
};
