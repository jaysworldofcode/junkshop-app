import assert from 'node:assert/strict';
import { test } from 'node:test';

import { breakDownProfit, mergeTransactions, sumSaleItems, type TransactionEntry } from './dashboard';

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
    { id: '1', materialName: 'Copper', unit: 'kg', quantity: 10_000, unitSellPrice: 47_000, saleTotal: 470_000, allocatedPurchaseCost: 420_000, actualProfit: 50_000 },
    { id: '2', materialName: 'Aluminum', unit: 'kg', quantity: 5_000, unitSellPrice: 7_000, saleTotal: 35_000, allocatedPurchaseCost: 30_000, actualProfit: 5_000 },
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
