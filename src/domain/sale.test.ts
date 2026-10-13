import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { ProductPrices } from './materialPrice';
import {
  buildNewSale,
  computeSaleLineFigures,
  createEmptySaleLine,
  formatSaleNumber,
  hasSaleErrors,
  unitCostFor,
  validateSaleDraft,
  type SaleDraft,
} from './sale';

const COPPER_ID = 'material-copper';

function copperPrices(): Map<string, ProductPrices> {
  return new Map([
    [
      COPPER_ID,
      {
        buy: { price: 42_000, effectiveDate: '2026-10-06' },
        sell: { price: 47_000, effectiveDate: '2026-10-06' },
      },
    ],
  ]);
}

function copperSale(quantity: string): SaleDraft {
  return {
    saleDate: '2026-10-06',
    buyerName: 'Juan',
    buyerId: null,
    lines: [{ ...createEmptySaleLine('line-1'), materialId: COPPER_ID, quantity, sellPrice: '470' }],
    paymentStatus: 'paid',
    paymentMethod: 'cash',
    notes: '',
  };
}

test('selling 10 kg of copper at ₱470 uses the ₱420 current buy price as the cost', () => {
  const line = copperSale('10').lines[0];
  const figures = computeSaleLineFigures(line, unitCostFor(line.materialId, copperPrices()));

  assert.equal(figures.quantity, 10_000);
  assert.equal(figures.unitCost, 42_000);
  assert.equal(figures.saleTotal, 470_000);
  assert.equal(figures.allocatedPurchaseCost, 420_000);
  assert.equal(figures.actualProfit, 50_000);
});

test('there is no stock limit on the quantity sold', () => {
  assert.equal(hasSaleErrors(validateSaleDraft(copperSale('1000'), copperPrices())), false);
});

test('requires a buy price on the product so profit can be worked out', () => {
  const errors = validateSaleDraft(copperSale('10'), new Map());
  assert.match(errors.lines['line-1'].materialId ?? '', /no buy price/);
});

test('requires a product, quantity, and selling price', () => {
  const draft = copperSale('10');
  draft.lines[0] = createEmptySaleLine('line-1');

  const errors = validateSaleDraft(draft, copperPrices());
  assert.ok(errors.lines['line-1'].materialId);
  assert.ok(errors.lines['line-1'].quantity);
  assert.ok(errors.lines['line-1'].sellPrice);
});

test('builds a sale that stores the cost used at the time of the sale', () => {
  let nextId = 0;
  const { sale, items } = buildNewSale(copperSale('10'), copperPrices(), {
    createId: () => `id-${++nextId}`,
    timestamp: '2026-10-06T10:00:00.000Z',
  });

  assert.equal(sale.totalAmount, 470_000);
  assert.equal(sale.otherCost, 0);
  assert.equal(items[0].saleId, sale.id);
  assert.equal(items[0].materialId, COPPER_ID);
  assert.equal(items[0].allocatedPurchaseCost, 420_000);
  assert.equal(items[0].actualProfit, 50_000);
});

test('a pakyaw sale with a buy price deducts that amount from profit', () => {
  const line = { ...createEmptySaleLine('line-1'), materialId: 'fridge', pricingMode: 'pakyaw' as const, sellPrice: '350', buyPrice: '200' };
  const figures = computeSaleLineFigures(line, null);

  assert.equal(figures.saleTotal, 35_000);
  assert.equal(figures.allocatedPurchaseCost, 20_000);
  assert.equal(figures.actualProfit, 15_000);
});

test('a pakyaw sale with no buy price treats the whole amount as profit', () => {
  const line = { ...createEmptySaleLine('line-1'), materialId: 'fridge', pricingMode: 'pakyaw' as const, sellPrice: '350' };
  const figures = computeSaleLineFigures(line, null);

  assert.equal(figures.allocatedPurchaseCost, 0);
  assert.equal(figures.actualProfit, 35_000);
  assert.equal(hasSaleErrors(validateSaleDraft({ ...copperSale('10'), lines: [line] }, new Map())), false);
});

test('a pakyaw sale does not need a catalog buy price', () => {
  const draft = {
    ...copperSale('10'),
    lines: [{ ...createEmptySaleLine('line-1'), materialId: 'fridge', pricingMode: 'pakyaw' as const, sellPrice: '350' }],
  };
  assert.equal(hasSaleErrors(validateSaleDraft(draft, new Map())), false);
});

test('stores a blank buyer as Unknown and formats the sale number', () => {
  const draft = copperSale('10');
  draft.buyerName = '  ';

  const { sale } = buildNewSale(draft, copperPrices(), { createId: () => 'id', timestamp: '2026-10-06T10:00:00.000Z' });
  assert.equal(sale.buyerName, 'Unknown');
  assert.equal(formatSaleNumber('2026-10-06', 1), 'S-20261006-001');
});
