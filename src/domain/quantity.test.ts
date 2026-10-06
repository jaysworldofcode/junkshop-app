import assert from 'node:assert/strict';
import { test } from 'node:test';

import { formatQuantity, fromThousandths, toThousandths } from './quantity';

test('stores kilograms as thousandths', () => {
  assert.equal(toThousandths(35.5), 35500);
});

test('converts thousandths back to kilograms', () => {
  assert.equal(fromThousandths(35500), 35.5);
});

test('formats quantities without trailing zeros', () => {
  assert.equal(formatQuantity(35500), '35.5');
});
