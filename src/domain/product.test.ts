import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createEmptyProductDraft,
  hasFieldErrors,
  isSameActiveProduct,
  normalizeProductKey,
  optionalText,
  toLikeSearch,
  validateProductDraft,
} from './product';

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

test('keeps blank optional fields as null', () => {
  assert.equal(optionalText('  '), null);
  assert.equal(optionalText('WIRE'), 'WIRE');
});

test('strips LIKE wildcards from search text', () => {
  assert.equal(toLikeSearch('  cop%per_ '), 'copper');
});
