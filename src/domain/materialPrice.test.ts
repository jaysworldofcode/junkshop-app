import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildPriceChanges,
  isPriceChanged,
  priceDifference,
  priceSinceLabel,
  type ProductPrices,
} from './materialPrice';
import { formatPesoInput } from './money';

const COPPER_PRICES: ProductPrices = {
  buy: { price: 42_000, effectiveDate: '2026-10-01' },
  sell: { price: 47_000, effectiveDate: '2026-10-01' },
  supplier: { price: 52_000, effectiveDate: '2026-10-01' },
};

test('an old price stays current and is not saved again when unchanged', () => {
  assert.equal(isPriceChanged(COPPER_PRICES.buy, 42_000), false);
  assert.equal(isPriceChanged(COPPER_PRICES.buy, 43_000), true);
  assert.equal(isPriceChanged(null, 42_000), true);
});

test('saves only the prices that were changed', () => {
  const { changes, errors } = buildPriceChanges(
    {
      copper: { buy: '420', sell: '480', supplier: '530' },
      aluminum: { buy: '', sell: '', supplier: '' },
    },
    new Map([['copper', COPPER_PRICES]])
  );

  assert.deepEqual(errors, {});
  assert.deepEqual(changes, [
    { materialId: 'copper', priceType: 'sell', price: 48_000 },
    { materialId: 'copper', priceType: 'supplier', price: 53_000 },
  ]);
});

test('reports a typed price that is not a peso amount', () => {
  const { changes, errors } = buildPriceChanges({ copper: { buy: 'abc', sell: '', supplier: '' } }, new Map());

  assert.equal(changes.length, 0);
  assert.ok(errors.copper.buy);
});

test('compares an entered price with the current price', () => {
  assert.equal(priceDifference(42_500, COPPER_PRICES.buy), 500);
  assert.equal(priceDifference(41_000, COPPER_PRICES.buy), -1_000);
  assert.equal(priceDifference(null, COPPER_PRICES.buy), null);
  assert.equal(priceDifference(42_000, null), null);
});

test('labels how long a price has been in effect', () => {
  assert.equal(priceSinceLabel(null, '2026-10-06'), 'Not set yet');
  assert.equal(priceSinceLabel({ price: 1, effectiveDate: '2026-10-06' }, '2026-10-06'), 'Changed today');
  assert.match(priceSinceLabel(COPPER_PRICES.buy, '2026-10-06'), /^Since /);
});

test('turns centavos back into typed text', () => {
  assert.equal(formatPesoInput(42_000), '420');
  assert.equal(formatPesoInput(42_050), '420.50');
  assert.equal(formatPesoInput(5), '0.05');
});
