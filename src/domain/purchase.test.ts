import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildNewPurchase,
  computeLineFigures,
  createEmptyPurchaseLine,
  formatPurchaseNumber,
  hasPurchaseErrors,
  personNameOrUnknown,
  summarizePurchase,
  validatePurchaseDraft,
  type PurchaseDraft,
} from './purchase';

const COPPER_ID = 'material-copper';

function copperTicket(): PurchaseDraft {
  return {
    purchaseDate: '2026-10-06',
    sellerName: 'Pedro',
    lines: [
      {
        ...createEmptyPurchaseLine('line-1'),
        materialId: COPPER_ID,
        quantity: '35.5',
        buyPrice: '420',
        supplierPrice: '470',
        plannedBuyer: 'ABC Recycling',
      },
    ],
    paymentStatus: 'paid',
    paymentMethod: 'cash',
    notes: '',
  };
}

test('matches the spec acceptance example for the copper ticket', () => {
  const figures = computeLineFigures(copperTicket().lines[0]);

  assert.equal(figures.quantity, 35_500);
  assert.equal(figures.unitBuyPrice, 42_000);
  assert.equal(figures.purchaseTotal, 1_491_000);
  assert.equal(figures.supplierPrice, 47_000);
  assert.equal(figures.expectedSellTotal, 1_668_500);
  assert.equal(figures.expectedProfit, 177_500);
});

test('expected profit uses supplier price, not a walk-in sell price', () => {
  const line = {
    ...createEmptyPurchaseLine('line-1'),
    quantity: '10',
    buyPrice: '100',
    supplierPrice: '150',
  };
  const figures = computeLineFigures(line);

  assert.equal(figures.purchaseTotal, 100_000);
  assert.equal(figures.expectedSellTotal, 150_000);
  assert.equal(figures.expectedProfit, 50_000);
});

test('leaves expected profit blank when there is no supplier price', () => {
  const line = { ...createEmptyPurchaseLine('line-1'), quantity: '10', buyPrice: '100' };
  const figures = computeLineFigures(line);

  assert.equal(figures.expectedSellTotal, null);
  assert.equal(figures.expectedProfit, null);
});

test('builds an unrealized purchase whose header totals equal the sum of its lines', () => {
  let nextId = 0;
  const { purchase, items } = buildNewPurchase(copperTicket(), {
    createId: () => `id-${++nextId}`,
    timestamp: '2026-10-06T08:00:00.000Z',
  });

  assert.equal(purchase.sellerName, 'Pedro');
  assert.equal(purchase.subtotal, 1_491_000);
  assert.equal(purchase.totalAmount, 1_491_000);
  assert.equal(purchase.otherCost, 0);
  assert.equal(items.length, 1);
  assert.equal(items[0].purchaseId, purchase.id);
  assert.equal(items[0].status, 'unrealized');
  assert.equal(items[0].plannedSellQuantity, 35_500);
  assert.equal(items[0].supplierName, 'ABC Recycling');
});

test('sums several lines into one ticket summary', () => {
  const draft = copperTicket();
  draft.lines.push({
    ...createEmptyPurchaseLine('line-2'),
    materialId: 'material-aluminum',
    quantity: '10',
    buyPrice: '60',
  });

  const summary = summarizePurchase(draft.lines.map(computeLineFigures));
  assert.equal(summary.totalAmount, 1_491_000 + 60_000);
  assert.equal(summary.expectedSellTotal, 1_668_500);
});

test('stores a blank seller as Unknown', () => {
  assert.equal(personNameOrUnknown('   '), 'Unknown');
  assert.equal(personNameOrUnknown(' Pedro '), 'Pedro');
});

test('formats the display purchase number', () => {
  assert.equal(formatPurchaseNumber('2026-10-06', 1), 'P-20261006-001');
  assert.equal(formatPurchaseNumber('2026-10-06', 42), 'P-20261006-042');
});

test('rejects a line without a product, quantity, or buy price', () => {
  const draft = copperTicket();
  draft.lines[0] = createEmptyPurchaseLine('line-1');

  const errors = validatePurchaseDraft(draft);
  assert.equal(hasPurchaseErrors(errors), true);
  assert.ok(errors.lines['line-1'].materialId);
  assert.ok(errors.lines['line-1'].quantity);
  assert.ok(errors.lines['line-1'].buyPrice);
});

test('rejects zero quantity and too many decimals', () => {
  const draft = copperTicket();
  draft.lines[0].quantity = '0';
  draft.lines[0].buyPrice = '420.555';

  const errors = validatePurchaseDraft(draft);
  assert.ok(errors.lines['line-1'].quantity);
  assert.ok(errors.lines['line-1'].buyPrice);
});

test('accepts the copper ticket as valid', () => {
  assert.equal(hasPurchaseErrors(validatePurchaseDraft(copperTicket())), false);
});
