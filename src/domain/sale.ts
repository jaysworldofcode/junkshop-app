import type { PaymentMethod, PaymentStatus } from '@/constants/payment';
import { NOTES_MAX_LENGTH, PERSON_NAME_MAX_LENGTH } from '@/constants/purchase';
import { SALE_NUMBER_PREFIX, SALE_OTHER_COST_CENTAVOS, SALE_SEQUENCE_DIGITS } from '@/constants/sale';
import type { LocalDateKey } from '@/domain/localDate';
import { NO_PRICES, type ProductPrices } from '@/domain/materialPrice';
import { parsePesoInput } from '@/domain/money';
import { personNameOrUnknown } from '@/domain/purchase';
import { amountForQuantity, parseQuantityInput } from '@/domain/quantity';
import { optionalText } from '@/domain/text';
import { formatTicketNumber } from '@/domain/ticketNumber';

export type SaleLineDraft = {
  key: string;
  materialId: string | null;
  quantity: string;
  sellPrice: string;
};

export type SaleLineField = 'quantity' | 'sellPrice';

export type SaleDraft = {
  saleDate: LocalDateKey;
  buyerName: string;
  /** Set when the buyer was picked from People. Typing a different name clears it. */
  buyerId: string | null;
  lines: SaleLineDraft[];
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  notes: string;
};

export type SaleLineFigures = {
  quantity: number | null;
  unitSellPrice: number | null;
  unitCost: number | null;
  saleTotal: number | null;
  allocatedPurchaseCost: number | null;
  actualProfit: number | null;
};

export type SaleSummary = {
  totalAmount: number;
  allocatedPurchaseCost: number;
  actualProfit: number;
};

export type SaleLineErrors = Partial<Record<'materialId' | SaleLineField, string>>;

export type SaleErrors = {
  buyerName?: string;
  notes?: string;
  lines: Record<string, SaleLineErrors>;
};

export type SaleRecord = {
  id: string;
  buyerId: string | null;
  buyerName: string;
  saleDate: LocalDateKey;
  subtotal: number;
  otherCost: number;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SaleItemRecord = {
  id: string;
  saleId: string;
  materialId: string;
  quantity: number;
  unitSellPrice: number;
  saleTotal: number;
  allocatedPurchaseCost: number;
  actualProfit: number;
  createdAt: string;
  updatedAt: string;
};

export type NewSale = {
  sale: SaleRecord;
  items: SaleItemRecord[];
};

export type SavedSale = {
  id: string;
  saleNumber: string;
  buyerName: string;
  totalAmount: number;
  actualProfit: number;
  lineCount: number;
};

export function createEmptySaleLine(key: string): SaleLineDraft {
  return { key, materialId: null, quantity: '', sellPrice: '' };
}

/** The cost basis of a sale line is the product's current buy price. */
export function unitCostFor(materialId: string | null, pricesByMaterial: Map<string, ProductPrices>): number | null {
  if (!materialId) {
    return null;
  }

  return (pricesByMaterial.get(materialId) ?? NO_PRICES).buy?.price ?? null;
}

export function computeSaleLineFigures(line: SaleLineDraft, unitCost: number | null): SaleLineFigures {
  const quantity = parseQuantityInput(line.quantity);
  const unitSellPrice = parsePesoInput(line.sellPrice);

  const saleTotal = quantity !== null && unitSellPrice !== null ? amountForQuantity(quantity, unitSellPrice) : null;
  const allocatedPurchaseCost = quantity !== null && unitCost !== null ? amountForQuantity(quantity, unitCost) : null;
  const actualProfit = saleTotal !== null && allocatedPurchaseCost !== null ? saleTotal - allocatedPurchaseCost : null;

  return { quantity, unitSellPrice, unitCost, saleTotal, allocatedPurchaseCost, actualProfit };
}

export function summarizeSale(lineFigures: SaleLineFigures[]): SaleSummary {
  return lineFigures.reduce<SaleSummary>(
    (summary, figures) => ({
      totalAmount: summary.totalAmount + (figures.saleTotal ?? 0),
      allocatedPurchaseCost: summary.allocatedPurchaseCost + (figures.allocatedPurchaseCost ?? 0),
      actualProfit: summary.actualProfit + (figures.actualProfit ?? 0),
    }),
    { totalAmount: 0, allocatedPurchaseCost: 0, actualProfit: 0 }
  );
}

export function formatSaleNumber(saleDate: LocalDateKey, sequence: number): string {
  return formatTicketNumber(SALE_NUMBER_PREFIX, SALE_SEQUENCE_DIGITS, saleDate, sequence);
}

export function validateSaleDraft(draft: SaleDraft, pricesByMaterial: Map<string, ProductPrices>): SaleErrors {
  const errors: SaleErrors = { lines: {} };

  if (draft.buyerName.trim().length > PERSON_NAME_MAX_LENGTH) {
    errors.buyerName = `Buyer name must be ${PERSON_NAME_MAX_LENGTH} characters or fewer.`;
  }

  if (draft.notes.trim().length > NOTES_MAX_LENGTH) {
    errors.notes = `Notes must be ${NOTES_MAX_LENGTH} characters or fewer.`;
  }

  for (const line of draft.lines) {
    const lineErrors: SaleLineErrors = {};
    const quantity = parseQuantityInput(line.quantity);

    if (!line.materialId) {
      lineErrors.materialId = 'Pick a product.';
    } else if (unitCostFor(line.materialId, pricesByMaterial) === null) {
      lineErrors.materialId = 'This product has no buy price yet, so profit cannot be worked out. Set it on Products → Prices.';
    }

    if (line.quantity.trim().length === 0) {
      lineErrors.quantity = 'Enter the quantity sold.';
    } else if (quantity === null) {
      lineErrors.quantity = 'Use a number with up to 3 decimals, like 10.5.';
    } else if (quantity <= 0) {
      lineErrors.quantity = 'Quantity must be more than 0.';
    }

    if (line.sellPrice.trim().length === 0) {
      lineErrors.sellPrice = 'Enter the selling price.';
    } else if (parsePesoInput(line.sellPrice) === null) {
      lineErrors.sellPrice = 'Use a peso amount, like 470 or 470.50.';
    }

    if (Object.keys(lineErrors).length > 0) {
      errors.lines[line.key] = lineErrors;
    }
  }

  return errors;
}

export function hasSaleErrors(errors: SaleErrors): boolean {
  return Boolean(errors.buyerName || errors.notes || Object.keys(errors.lines).length > 0);
}

/** Expects a draft that already passed validateSaleDraft. */
export function buildNewSale(
  draft: SaleDraft,
  pricesByMaterial: Map<string, ProductPrices>,
  options: { createId: () => string; timestamp: string }
): NewSale {
  const saleId = options.createId();

  const items = draft.lines.map<SaleItemRecord>((line) => {
    const figures = computeSaleLineFigures(line, unitCostFor(line.materialId, pricesByMaterial));
    if (
      !line.materialId ||
      figures.quantity === null ||
      figures.unitSellPrice === null ||
      figures.saleTotal === null ||
      figures.allocatedPurchaseCost === null ||
      figures.actualProfit === null
    ) {
      throw new Error('Sale line is incomplete.');
    }

    return {
      id: options.createId(),
      saleId,
      materialId: line.materialId,
      quantity: figures.quantity,
      unitSellPrice: figures.unitSellPrice,
      saleTotal: figures.saleTotal,
      allocatedPurchaseCost: figures.allocatedPurchaseCost,
      actualProfit: figures.actualProfit,
      createdAt: options.timestamp,
      updatedAt: options.timestamp,
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.saleTotal, 0);

  return {
    sale: {
      id: saleId,
      buyerId: draft.buyerId,
      buyerName: personNameOrUnknown(draft.buyerName),
      saleDate: draft.saleDate,
      subtotal,
      otherCost: SALE_OTHER_COST_CENTAVOS,
      totalAmount: subtotal + SALE_OTHER_COST_CENTAVOS,
      paymentStatus: draft.paymentStatus,
      paymentMethod: draft.paymentMethod,
      notes: optionalText(draft.notes),
      createdAt: options.timestamp,
      updatedAt: options.timestamp,
    },
    items,
  };
}
