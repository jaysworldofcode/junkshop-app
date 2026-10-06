import type { BadgeTone } from '@/components/StatusBadge';
import { PAYMENT_STATUS_LABELS, type PaymentStatus } from '@/constants/payment';
import { PURCHASE_ITEM_STATUS_LABELS, type PurchaseItemStatus } from '@/constants/purchase';

const PAYMENT_STATUS_TONES: Record<PaymentStatus, BadgeTone> = {
  paid: 'success',
  partial: 'warning',
  unpaid: 'danger',
};

const ITEM_STATUS_TONES: Record<PurchaseItemStatus, BadgeTone> = {
  unrealized: 'warning',
  partial: 'warning',
  sold: 'success',
  cancelled: 'neutral',
};

export function paymentBadge(status: PaymentStatus): { label: string; tone: BadgeTone } {
  return { label: PAYMENT_STATUS_LABELS[status], tone: PAYMENT_STATUS_TONES[status] };
}

export function itemStatusBadge(status: PurchaseItemStatus): { label: string; tone: BadgeTone } {
  return { label: PURCHASE_ITEM_STATUS_LABELS[status], tone: ITEM_STATUS_TONES[status] };
}
