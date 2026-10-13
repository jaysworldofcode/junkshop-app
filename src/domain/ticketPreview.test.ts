import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildPreviewLines } from './ticketPreview';

test('shows quantity and price for weighed lines, and only the amount for pakyaw', () => {
  const lines = buildPreviewLines([
    { key: 'a', name: 'Solid', unit: 'kg', pricingMode: 'per_unit', quantity: 2_000, unitPrice: 1_000, total: 2_000 },
    { key: 'b', name: 'Scrap', unit: 'pc', pricingMode: 'pakyaw', quantity: 1_000, unitPrice: 100_000, total: 100_000 },
  ]);

  assert.equal(lines.length, 2);
  assert.match(lines[0].detail ?? '', /^2 kg × ₱\s?10\.00$/);
  assert.equal(lines[1].detail, null);
  assert.equal(lines[1].total, 100_000);
});

test('leaves out lines without a total', () => {
  const lines = buildPreviewLines([
    { key: 'a', name: 'Solid', unit: 'kg', pricingMode: 'per_unit', quantity: null, unitPrice: null, total: null },
  ]);
  assert.deepEqual(lines, []);
});
