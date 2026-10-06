export const UNKNOWN_PERSON_NAME = 'Unknown';
export const PERSON_NAME_MAX_LENGTH = 80;
export const NOTES_MAX_LENGTH = 500;

export const PURCHASE_NUMBER_PREFIX = 'P';
export const PURCHASE_SEQUENCE_DIGITS = 3;
export const MAX_DATE_DAYS_AHEAD = 0;

export const PURCHASE_ITEM_STATUSES = ['unrealized', 'partial', 'sold', 'cancelled'] as const;
export type PurchaseItemStatus = (typeof PURCHASE_ITEM_STATUSES)[number];
export const NEW_PURCHASE_ITEM_STATUS: PurchaseItemStatus = 'unrealized';
export const UNSOLD_PURCHASE_ITEM_STATUSES: readonly PurchaseItemStatus[] = ['unrealized', 'partial'];

export const PURCHASE_ITEM_STATUS_LABELS: Record<PurchaseItemStatus, string> = {
  unrealized: 'Unrealized',
  partial: 'Partially sold',
  sold: 'Sold',
  cancelled: 'Cancelled',
};

export const PURCHASE_OTHER_COST_CENTAVOS = 0;
