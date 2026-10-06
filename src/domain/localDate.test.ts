import assert from 'node:assert/strict';
import { test } from 'node:test';

import { formatTypedDate, parseTypedDate } from './localDate';

test('reads typed dates month first or year first', () => {
  assert.equal(parseTypedDate('10/06/2026'), '2026-10-06');
  assert.equal(parseTypedDate('9/5/2026'), '2026-09-05');
  assert.equal(parseTypedDate(' 09-05-2026 '), '2026-09-05');
  assert.equal(parseTypedDate('2026-9-5'), '2026-09-05');
});

test('rejects text that is not a real calendar day', () => {
  assert.equal(parseTypedDate('02/30/2026'), null);
  assert.equal(parseTypedDate('13/01/2026'), null);
  assert.equal(parseTypedDate('10/06/26'), null);
  assert.equal(parseTypedDate('yesterday'), null);
});

test('formats a day the way it is typed', () => {
  assert.equal(formatTypedDate('2026-10-06'), '10/06/2026');
  assert.equal(parseTypedDate(formatTypedDate('2026-01-31')), '2026-01-31');
});
