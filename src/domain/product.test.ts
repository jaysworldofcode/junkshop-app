import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createEmptyProductDraft,
  groupProductsByUsage,
  hasFieldErrors,
  isSameActiveProduct,
  normalizeProductKey,
  optionalText,
  priceChangesFromDraft,
  toLikeSearch,
  validateProductDraft,
  type ProductWithUsage,
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

test('a pakyaw product skips the price list', () => {
  const draft = {
    ...createEmptyProductDraft(),
    name: 'Broken refrigerator',
    pricingMode: 'pakyaw' as const,
    buyPrice: 'not-a-price',
  };
  assert.equal(hasFieldErrors(validateProductDraft(draft)), false);
  assert.deepEqual(priceChangesFromDraft(draft, 'fridge', NO_PRICES), []);
});

function usedProduct(name: string, purchaseCount: number, saleCount = 0): ProductWithUsage {
  return {
    id: name,
    name,
    code: null,
    category: null,
    unit: 'kg',
    pricingMode: 'per_unit',
    isActive: true,
    createdAt: '',
    updatedAt: '',
    purchaseCount,
    saleCount,
  };
}

test('lists the six most used products first, then the rest A to Z without repeats', () => {
  const products = ['Zinc', 'Copper', 'Brass', 'Tin', 'Steel', 'Lead', 'Iron', 'aluminum', 'Bottles'].map(
    (name, index) => usedProduct(name, name === 'Bottles' ? 0 : index + 1)
  );

  const { mostUsed, alphabetical } = groupProductsByUsage(products, 'purchase');

  assert.deepEqual(
    mostUsed.map((product) => product.name),
    ['aluminum', 'Iron', 'Lead', 'Steel', 'Tin', 'Brass']
  );
  assert.deepEqual(
    alphabetical.map((product) => product.name),
    ['Bottles', 'Copper', 'Zinc']
  );
});

test('ranks the sell picker by sales, and leaves never-used products out of the top list', () => {
  const products = [usedProduct('Copper', 9, 1), usedProduct('Brass', 0, 4), usedProduct('Tin', 3, 0)];

  const { mostUsed, alphabetical } = groupProductsByUsage(products, 'sale');

  assert.deepEqual(mostUsed.map((product) => product.name), ['Brass', 'Copper']);
  assert.deepEqual(alphabetical.map((product) => product.name), ['Tin']);
});
