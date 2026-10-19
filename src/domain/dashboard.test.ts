import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  breakDownProfit,
  matchesTransactionFilter,
  mergeTransactions,
  sumSaleItems,
  type TransactionEntry,
} from './dashboard';

function entry(kind: TransactionEntry['kind'], id: string, date: string, createdAt: string): TransactionEntry {
  return {
    kind,
    id,
    ticketNumber: id,
    personName: 'Juan',
    date,
    createdAt,
    totalAmount: 0,
    profit: kind === 'sale' ? 0 : null,
    paymentStatus: 'paid',
    status: 'active',
    materialNames: [],
  };
}

test('lists sales and purchases together, newest first', () => {
  const merged = mergeTransactions(
    [entry('sale', 's1', '2026-10-06', '2026-10-06T09:00:00.000Z'), entry('sale', 's0', '2026-10-05', '2026-10-05T15:00:00.000Z')],
    [entry('purchase', 'p1', '2026-10-06', '2026-10-06T11:00:00.000Z')]
  );

  assert.deepEqual(
    merged.map((transaction) => transaction.id),
    ['p1', 's1', 's0']
  );
});

test('sums the cost and profit of a sale', () => {
  const totals = sumSaleItems([
    { id: '1', materialName: 'Copper', unit: 'kg', pricingMode: 'per_unit', quantity: 10_000, unitSellPrice: 47_000, saleTotal: 470_000, allocatedPurchaseCost: 420_000, actualProfit: 50_000 },
    { id: '2', materialName: 'Aluminum', unit: 'kg', pricingMode: 'per_unit', quantity: 5_000, unitSellPrice: 7_000, saleTotal: 35_000, allocatedPurchaseCost: 30_000, actualProfit: 5_000 },
  ]);

  assert.deepEqual(totals, { cost: 450_000, profit: 55_000 });
});

test('adds sale and buy profit, then takes off expenses', () => {
  assert.deepEqual(breakDownProfit(120_000, 115_000, 30_000), {
    totalProfit: 235_000,
    profitAfterExpenses: 205_000,
    netProfit: 90_000,
  });
});

test('profit after expenses can go below zero', () => {
  assert.equal(breakDownProfit(0, 10_000, 25_000).profitAfterExpenses, -15_000);
});

test('Sales, Purchases, and All hide cancelled tickets; the Cancelled chip shows only those', () => {
  const sale = entry('sale', 's1', '2026-10-06', '2026-10-06T09:00:00.000Z');
  const cancelledSale = { ...sale, id: 's2', status: 'cancelled' as const };
  const purchase = entry('purchase', 'p1', '2026-10-06', '2026-10-06T11:00:00.000Z');

  assert.equal(matchesTransactionFilter(sale, 'sale'), true);
  assert.equal(matchesTransactionFilter(sale, 'all'), true);
  assert.equal(matchesTransactionFilter(sale, 'cancelled'), false);
  assert.equal(matchesTransactionFilter(cancelledSale, 'sale'), false);
  assert.equal(matchesTransactionFilter(cancelledSale, 'all'), false);
  assert.equal(matchesTransactionFilter(cancelledSale, 'cancelled'), true);
  assert.equal(matchesTransactionFilter(purchase, 'sale'), false);
  assert.equal(matchesTransactionFilter(purchase, 'purchase'), true);
});
