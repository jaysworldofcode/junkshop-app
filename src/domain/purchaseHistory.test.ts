import assert from 'node:assert/strict';
import { test } from 'node:test';

import { groupPurchasesByDay, sumExpected, type PurchaseDetailItem, type PurchaseListEntry } from './purchaseHistory';

function entry(id: string, purchaseDate: string, totalAmount: number): PurchaseListEntry {
  return {
    id,
    purchaseNumber: id,
    sellerName: 'Pedro',
    purchaseDate,
    totalAmount,
    paymentStatus: 'paid',
    lineCount: 1,
    unsoldLineCount: 1,
    materialNames: ['Copper'],
  };
}

test('groups newest-first purchases into one section per day with a day total', () => {
  const sections = groupPurchasesByDay([
    entry('b', '2026-10-06', 415_500),
    entry('a', '2026-10-06', 1_491_000),
    entry('c', '2026-10-05', 60_000),
  ]);

  assert.equal(sections.length, 2);
  assert.equal(sections[0].purchaseDate, '2026-10-06');
  assert.equal(sections[0].dayTotal, 1_906_500);
  assert.deepEqual(
    sections[0].data.map((item) => item.id),
    ['b', 'a']
  );
  assert.equal(sections[1].dayTotal, 60_000);
});

test('sums expected figures and treats a missing supplier price as zero', () => {
  const base: PurchaseDetailItem = {
    id: '1',
    materialName: 'Copper',
    unit: 'kg',
    quantity: 35_500,
    unitBuyPrice: 42_000,
    purchaseTotal: 1_491_000,
    supplierPrice: 47_000,
    expectedSellTotal: 1_668_500,
    expectedProfit: 177_500,
    plannedBuyer: null,
    status: 'unrealized',
  };

  const totals = sumExpected([base, { ...base, id: '2', expectedSellTotal: null, expectedProfit: null }]);
  assert.deepEqual(totals, { expectedSellTotal: 1_668_500, expectedProfit: 177_500 });
});
