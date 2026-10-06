import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createEmptyProductDraft,
  hasFieldErrors,
  isSameActiveProduct,
  normalizeProductKey,
  optionalText,
  priceChangesFromDraft,
  toLikeSearch,
  validateProductDraft,
} from './product';
import { NO_PRICES } from './materialPrice';

test('normalizes product names for duplicate checks', () => {
  assert.equal(normalizeProductKey('  Copper '), 'copper');
});

test('warns only when another active product has the same name and unit', () => {
  const candidate = { name: 'Copper', unit: 'kg' };

  assert.equal(
    isSameActiveProduct(candidate, { name: 'copper', unit: 'KG', isActive: true }),
    true
  );
  assert.equal(
    isSameActiveProduct(candidate, { name: 'Copper', unit: 'kg', isActive: false }),
    false
  );
  assert.equal(
    isSameActiveProduct(candidate, { name: 'Aluminum', unit: 'kg', isActive: true }),
    false
  );
});

test('requires a name and unit', () => {
  const errors = validateProductDraft({
    ...createEmptyProductDraft(),
    name: '  ',
    unit: '',
  });

  assert.equal(errors.name, 'Name is required.');
  assert.equal(errors.unit, 'Unit is required.');
  assert.equal(hasFieldErrors(errors), true);
});

test('checks the supplier price like the buy and sell prices', () => {
  const errors = validateProductDraft({ ...createEmptyProductDraft(), name: 'Copper', supplierPrice: 'abc' });
  assert.ok(errors.supplierPrice);
  assert.equal(errors.buyPrice, undefined);
});

test('saves a changed supplier price as its own price record', () => {
  const draft = { ...createEmptyProductDraft(), name: 'Copper', buyPrice: '420', supplierPrice: '520' };
  const current = { ...NO_PRICES, buy: { price: 42_000, effectiveDate: '2026-10-01' } };

  assert.deepEqual(priceChangesFromDraft(draft, 'copper', current), [
    { materialId: 'copper', priceType: 'supplier', price: 52_000 },
  ]);
});

test('keeps blank optional fields as null', () => {
  assert.equal(optionalText('  '), null);
  assert.equal(optionalText('WIRE'), 'WIRE');
});

test('strips LIKE wildcards from search text', () => {
  assert.equal(toLikeSearch('  cop%per_ '), 'copper');
});
