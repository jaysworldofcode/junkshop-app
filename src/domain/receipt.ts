import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS, type PaymentMethod, type PaymentStatus } from '@/constants/payment';
import { DEFAULT_SHOP_NAME, RECEIPT_FOOTER, RECEIPT_LINE_WIDTH, RECEIPT_RULE_CHARACTER } from '@/constants/printing';
import type { SaleDetail } from '@/domain/dashboard';
import { formatDateLabel, type LocalDateKey } from '@/domain/localDate';
import { formatPeso } from '@/domain/money';
import type { PurchaseDetail } from '@/domain/purchaseHistory';
import { formatQuantity } from '@/domain/quantity';

export type ReceiptLine = {
  text: string;
  align?: 'left' | 'center';
  bold?: boolean;
  large?: boolean;
};

export type ShopDetails = {
  shopName: string;
  shopPhone: string;
  shopAddress: string;
};

export type ReceiptTicket = {
  title: string;
  number: string;
  date: LocalDateKey;
  partyLabel: string;
  partyName: string;
  items: { name: string; quantity: number; unit: string; unitPrice: number; total: number }[];
  subtotal: number | null;
  total: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  notes: string | null;
};

export function ticketFromPurchase(purchase: PurchaseDetail): ReceiptTicket {
  return {
    title: 'BUY RECEIPT',
    number: purchase.purchaseNumber,
    date: purchase.purchaseDate,
    partyLabel: 'Seller',
    partyName: purchase.sellerName,
    items: purchase.items.map((item) => ({
      name: item.materialName,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitBuyPrice,
      total: item.purchaseTotal,
    })),
    subtotal: purchase.subtotal === purchase.totalAmount ? null : purchase.subtotal,
    total: purchase.totalAmount,
    paymentStatus: purchase.paymentStatus,
    paymentMethod: purchase.paymentMethod,
    notes: purchase.notes,
  };
}

export function ticketFromSale(sale: SaleDetail): ReceiptTicket {
  return {
    title: 'SALE RECEIPT',
    number: sale.saleNumber,
    date: sale.saleDate,
    partyLabel: 'Buyer',
    partyName: sale.buyerName,
    items: sale.items.map((item) => ({
      name: item.materialName,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitSellPrice,
      total: item.saleTotal,
    })),
    subtotal: null,
    total: sale.totalAmount,
    paymentStatus: sale.paymentStatus,
    paymentMethod: sale.paymentMethod,
    notes: sale.notes,
  };
}

/** Lays a ticket out for 58 mm paper. Every line fits RECEIPT_LINE_WIDTH characters. */
export function buildReceiptLines(ticket: ReceiptTicket, shop: ShopDetails, printedAt: Date): ReceiptLine[] {
  const rule: ReceiptLine = { text: RECEIPT_RULE_CHARACTER.repeat(RECEIPT_LINE_WIDTH) };
  const lines: ReceiptLine[] = [
    ...shopHeaderLines(shop),
    rule,
    { text: ticket.title, align: 'center', bold: true },
    rule,
    ...wrap(`No: ${ticket.number}`),
    ...wrap(`Date: ${formatDateLabel(ticket.date)}`),
    ...wrap(`${ticket.partyLabel}: ${ticket.partyName}`),
    rule,
  ];

  for (const item of ticket.items) {
    lines.push(...wrap(item.name).map((line) => ({ ...line, bold: true })));
    const rate = `${formatQuantity(item.quantity)} ${item.unit} x ${receiptPeso(item.unitPrice)}`;
    lines.push(...columns(` ${rate}`, receiptPeso(item.total)));
  }

  lines.push(rule);
  if (ticket.subtotal !== null) {
    lines.push(...columns('Subtotal', receiptPeso(ticket.subtotal)));
    lines.push(...columns('Other cost', receiptPeso(ticket.total - ticket.subtotal)));
  }
  lines.push(...columns('TOTAL', receiptPeso(ticket.total)).map((line) => ({ ...line, bold: true })));

  const payment = [
    ticket.paymentMethod ? PAYMENT_METHOD_LABELS[ticket.paymentMethod] : null,
    PAYMENT_STATUS_LABELS[ticket.paymentStatus],
  ]
    .filter(Boolean)
    .join(' - ');
  lines.push(...wrap(`Payment: ${payment}`));
  if (ticket.notes) {
    lines.push(...wrap(`Notes: ${ticket.notes}`));
  }

  lines.push(rule, { text: RECEIPT_FOOTER, align: 'center' }, { text: `Printed ${formatPrintedAt(printedAt)}`, align: 'center' });
  return lines;
}

/** The shop name is printed double size, so it wraps at half the line width. */
export function shopHeaderLines({ shopName, shopPhone, shopAddress }: ShopDetails): ReceiptLine[] {
  const center = (line: ReceiptLine): ReceiptLine => ({ ...line, align: 'center' });
  const name = wrap(shopName.trim() || DEFAULT_SHOP_NAME, RECEIPT_LINE_WIDTH / 2).map((line) => ({
    ...center(line),
    bold: true,
    large: true,
  }));
  const address = shopAddress.trim() ? wrap(shopAddress.trim()).map(center) : [];
  const phone = shopPhone.trim() ? wrap(`Tel: ${shopPhone.trim()}`).map(center) : [];
  return [...name, ...address, ...phone];
}

/** The printer's built-in character set has no peso sign or accents. */
export function printerText(text: string): string {
  return text
    .replaceAll('₱', 'P')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u2013\u2014\u00b7]/g, '-')
    .replace(/[^\x20-\x7e]/g, '?');
}

export function receiptPeso(centavos: number): string {
  return printerText(formatPeso(centavos)).replace(/\s/g, '');
}

/** Left and right text on one line, or on two lines when they do not fit together. */
export function columns(left: string, right: string, width = RECEIPT_LINE_WIDTH): ReceiptLine[] {
  const safeLeft = printerText(left);
  const safeRight = printerText(right);
  const gap = width - safeLeft.length - safeRight.length;
  if (gap >= 1) {
    return [{ text: `${safeLeft}${' '.repeat(gap)}${safeRight}` }];
  }
  return [...wrap(safeLeft, width), { text: safeRight.padStart(width) }];
}

export function wrap(text: string, width = RECEIPT_LINE_WIDTH): ReceiptLine[] {
  const words = printerText(text).split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    for (const piece of chunk(word, width)) {
      if (current.length === 0) {
        current = piece;
      } else if (current.length + 1 + piece.length <= width) {
        current = `${current} ${piece}`;
      } else {
        lines.push(current);
        current = piece;
      }
    }
  }
  lines.push(current);
  return lines.map((line) => ({ text: line }));
}

function chunk(word: string, width: number): string[] {
  const pieces: string[] = [];
  for (let index = 0; index < word.length; index += width) {
    pieces.push(word.slice(index, index + width));
  }
  return pieces.length > 0 ? pieces : [''];
}

function formatPrintedAt(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  const hours = date.getHours() % 12 || 12;
  return `${pad(date.getMonth() + 1)}/${pad(date.getDate())}/${date.getFullYear()} ${hours}:${pad(date.getMinutes())} ${date.getHours() < 12 ? 'AM' : 'PM'}`;
}
