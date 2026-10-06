import assert from 'node:assert/strict';
import { test } from 'node:test';

import { parseScaledDecimal } from './decimal';

test('parses typed decimals into exact scaled integers', () => {
  assert.equal(parseScaledDecimal('35.5', 3), 35_500);
  assert.equal(parseScaledDecimal('420', 2), 42_000);
  assert.equal(parseScaledDecimal('0.1', 2), 10);
  assert.equal(parseScaledDecimal('.5', 3), 500);
  assert.equal(parseScaledDecimal('1,250.75', 2), 125_075);
});

test('rejects text that is not a plain positive decimal', () => {
  assert.equal(parseScaledDecimal('', 2), null);
  assert.equal(parseScaledDecimal('abc', 2), null);
  assert.equal(parseScaledDecimal('-5', 2), null);
  assert.equal(parseScaledDecimal('1.2.3', 2), null);
  assert.equal(parseScaledDecimal('1.234', 2), null);
});
