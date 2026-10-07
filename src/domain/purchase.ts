import type { PaymentMethod, PaymentStatus } from '@/constants/payment';
import {
  NEW_PURCHASE_ITEM_STATUS,
  NOTES_MAX_LENGTH,
  PERSON_NAME_MAX_LENGTH,
  PURCHASE_NUMBER_PREFIX,
  PURCHASE_OTHER_COST_CENTAVOS,
  PURCHASE_SEQUENCE_DIGITS,
  UNKNOWN_PERSON_NAME,
  type PurchaseItemStatus,
} from '@/constants/purchase';
import type { LocalDateKey } from '@/domain/localDate';
import { parsePesoInput } from '@/domain/money';
import { amountForQuantity, parseQuantityInput } from '@/domain/quantity';
import { optionalText } from '@/domain/text';
import { formatTicketNumber } from '@/domain/ticketNumber';

export type PurchaseLineDraft = {
  key: string;
  materialId: string | null;
  quantity: string;
  buyPrice: string;
  supplierPrice: string;
  plannedBuyer: string;
};

export type PurchaseLineField = Exclude<keyof PurchaseLineDraft, 'key'>;

export type PurchaseDraft = {
  purchaseDate: LocalDateKey;
  sellerName: string;
  /** Set when the seller was picked from People. Typing a different name clears it. */
  sellerId: string | null;
  lines: PurchaseLineDraft[];
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  notes: string;
};

export type PurchaseLineFigures = {
  quantity: number | null;
  unitBuyPrice: number | null;
  purchaseTotal: number | null;
  supplierPrice: number | null;
  expectedSellTotal: number | null;
  expectedProfit: number | null;
};

export type PurchaseSummary = {
  totalAmount: number;
  expectedSellTotal: number;
  expectedProfit: number;
};

export type PurchaseLineErrors = Partial<Record<PurchaseLineField, string>>;

export type PurchaseErrors = {
  sellerName?: string;
  notes?: string;
  lines: Record<string, PurchaseLineErrors>;
};

export type PurchaseRecord = {
  id: string;
  sellerId: string | null;
  sellerName: string;
  purchaseDate: LocalDateKey;
  subtotal: number;
  otherCost: number;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PurchaseItemRecord = {
  id: string;
  purchaseId: string;
  materialId: string;
  quantity: number;
  unitBuyPrice: number;
  purchaseTotal: number;
  supplierPrice: number | null;
  plannedSellQuantity: number;
  expectedSellTotal: number | null;
  expectedProfit: number | null;
  supplierName: string | null;
  status: PurchaseItemStatus;
  createdAt: string;
  updatedAt: string;
};

export type NewPurchase = {
  purchase: PurchaseRecord;
  items: PurchaseItemRecord[];
};

export type SavedPurchase = {
  id: string;
  purchaseNumber: string;
  sellerName: string;
  totalAmount: number;
  lineCount: number;
};

export function createEmptyPurchaseLine(key: string): PurchaseLineDraft {
  return {
    key,
    materialId: null,
    quantity: '',
    buyPrice: '',
    supplierPrice: '',
    plannedBuyer: '',
  };
}

export function computeLineFigures(line: PurchaseLineDraft): PurchaseLineFigures {
  const quantity = parseQuantityInput(line.quantity);
  const unitBuyPrice = parsePesoInput(line.buyPrice);
  const supplierPrice = parsePesoInput(line.supplierPrice);

  const purchaseTotal = quantity !== null && unitBuyPrice !== null ? amountForQuantity(quantity, unitBuyPrice) : null;
  // Walk-in sell price is not used here. Bought scrap usually goes to the supplier.
  const expectedSellTotal =
    quantity !== null && supplierPrice !== null ? amountForQuantity(quantity, supplierPrice) : null;
  const expectedProfit =
    expectedSellTotal !== null && purchaseTotal !== null ? expectedSellTotal - purchaseTotal : null;

  return { quantity, unitBuyPrice, purchaseTotal, supplierPrice, expectedSellTotal, expectedProfit };
}

export function summarizePurchase(lineFigures: PurchaseLineFigures[]): PurchaseSummary {
  return lineFigures.reduce<PurchaseSummary>(
    (summary, figures) => ({
      totalAmount: summary.totalAmount + (figures.purchaseTotal ?? 0),
      expectedSellTotal: summary.expectedSellTotal + (figures.expectedSellTotal ?? 0),
      expectedProfit: summary.expectedProfit + (figures.expectedProfit ?? 0),
    }),
    { totalAmount: 0, expectedSellTotal: 0, expectedProfit: 0 }
  );
}

export function personNameOrUnknown(name: string): string {
  return optionalText(name) ?? UNKNOWN_PERSON_NAME;
}

export function formatPurchaseNumber(purchaseDate: LocalDateKey, sequence: number): string {
  return formatTicketNumber(PURCHASE_NUMBER_PREFIX, PURCHASE_SEQUENCE_DIGITS, purchaseDate, sequence);
}

export function validatePurchaseDraft(draft: PurchaseDraft): PurchaseErrors {
  const errors: PurchaseErrors = { lines: {} };

  if (draft.sellerName.trim().length > PERSON_NAME_MAX_LENGTH) {
    errors.sellerName = `Seller name must be ${PERSON_NAME_MAX_LENGTH} characters or fewer.`;
  }

  if (draft.notes.trim().length > NOTES_MAX_LENGTH) {
    errors.notes = `Notes must be ${NOTES_MAX_LENGTH} characters or fewer.`;
  }

  for (const line of draft.lines) {
    const lineErrors = validatePurchaseLine(line);
    if (Object.keys(lineErrors).length > 0) {
      errors.lines[line.key] = lineErrors;
    }
  }

  return errors;
}

export function hasPurchaseErrors(errors: PurchaseErrors): boolean {
  return Boolean(errors.sellerName || errors.notes || Object.keys(errors.lines).length > 0);
}

function validatePurchaseLine(line: PurchaseLineDraft): PurchaseLineErrors {
  const lineErrors: PurchaseLineErrors = {};
  const quantity = parseQuantityInput(line.quantity);

  if (!line.materialId) {
    lineErrors.materialId = 'Pick a product.';
  }

  if (line.quantity.trim().length === 0) {
    lineErrors.quantity = 'Enter the quantity.';
  } else if (quantity === null) {
    lineErrors.quantity = 'Use a number with up to 3 decimals, like 35.5.';
  } else if (quantity <= 0) {
    lineErrors.quantity = 'Quantity must be more than 0.';
  }

  if (line.buyPrice.trim().length === 0) {
    lineErrors.buyPrice = 'Enter the buy price.';
  } else if (parsePesoInput(line.buyPrice) === null) {
    lineErrors.buyPrice = 'Use a peso amount, like 420 or 420.50.';
  }

  if (line.supplierPrice.trim().length > 0 && parsePesoInput(line.supplierPrice) === null) {
    lineErrors.supplierPrice = 'Use a peso amount, like 470 or 470.50.';
  }

  if (line.plannedBuyer.trim().length > PERSON_NAME_MAX_LENGTH) {
    lineErrors.plannedBuyer = `Planned buyer must be ${PERSON_NAME_MAX_LENGTH} characters or fewer.`;
  }

  return lineErrors;
}

/** Expects a draft that already passed validatePurchaseDraft. */
export function buildNewPurchase(
  draft: PurchaseDraft,
  options: { createId: () => string; timestamp: string }
): NewPurchase {
  const purchaseId = options.createId();

  const items = draft.lines.map<PurchaseItemRecord>((line) => {
    const figures = computeLineFigures(line);
    if (!line.materialId || figures.quantity === null || figures.unitBuyPrice === null || figures.purchaseTotal === null) {
      throw new Error('Purchase line is incomplete.');
    }

    return {
      id: options.createId(),
      purchaseId,
      materialId: line.materialId,
      quantity: figures.quantity,
      unitBuyPrice: figures.unitBuyPrice,
      purchaseTotal: figures.purchaseTotal,
      supplierPrice: figures.supplierPrice,
      plannedSellQuantity: figures.quantity,
      expectedSellTotal: figures.expectedSellTotal,
      expectedProfit: figures.expectedProfit,
      supplierName: optionalText(line.plannedBuyer),
      status: NEW_PURCHASE_ITEM_STATUS,
      createdAt: options.timestamp,
      updatedAt: options.timestamp,
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.purchaseTotal, 0);

  return {
    purchase: {
      id: purchaseId,
      sellerId: draft.sellerId,
      sellerName: personNameOrUnknown(draft.sellerName),
      purchaseDate: draft.purchaseDate,
      subtotal,
      otherCost: PURCHASE_OTHER_COST_CENTAVOS,
      totalAmount: subtotal + PURCHASE_OTHER_COST_CENTAVOS,
      paymentStatus: draft.paymentStatus,
      paymentMethod: draft.paymentMethod,
      notes: optionalText(draft.notes),
      createdAt: options.timestamp,
      updatedAt: options.timestamp,
    },
    items,
  };
}
