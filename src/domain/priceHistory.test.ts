import assert from 'node:assert/strict';
import { test } from 'node:test';

import { linkPreviousPrices } from './priceHistory';
import { unitPriceFor } from './quantity';

test('links each change to the older price of the same type', () => {
  const linked = linkPreviousPrices([
    { id: '3', priceType: 'buy', price: 45000, effectiveDate: '2026-10-06' },
    { id: '2', priceType: 'sell', price: 47000, effectiveDate: '2026-10-01' },
    { id: '1', priceType: 'buy', price: 42000, effectiveDate: '2026-09-20' },
  ]);
  assert.equal(linked[0].previousPrice, 42000);
  assert.equal(linked[1].previousPrice, null);
  assert.equal(linked[2].previousPrice, null);
});

test('unit price is weighted by quantity', () => {
  // ₱4,700 for 10.000 kg is ₱470/kg.
  assert.equal(unitPriceFor(470000, 10000), 47000);
  assert.equal(unitPriceFor(100, 0), null);
});
