export const PAYMENT_STATUSES = ['paid', 'partial', 'unpaid'] as const;
export const PAYMENT_METHODS = ['cash', 'gcash', 'bank', 'other'] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const UNSETTLED_PAYMENT_STATUSES: readonly PaymentStatus[] = ['unpaid', 'partial'];

export const DEFAULT_PAYMENT_STATUS: PaymentStatus = 'paid';
export const DEFAULT_PAYMENT_METHOD: PaymentMethod = 'cash';

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  paid: 'Paid',
  partial: 'Partial',
  unpaid: 'Unpaid',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash',
  gcash: 'GCash',
  bank: 'Bank transfer',
  other: 'Other',
};
