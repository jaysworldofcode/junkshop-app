import assert from 'node:assert/strict';
import { test } from 'node:test';

import { DEFAULT_PRODUCT_UNIT } from '../constants/product';
import { createProductFormState, productFormReducer } from './productFormReducer';

test('starts a new product as active kilograms', () => {
  const state = createProductFormState();
  assert.equal(state.draft.unit, DEFAULT_PRODUCT_UNIT);
  assert.equal(state.draft.isActive, true);
});

test('clears a field error when the cashier edits that field', () => {
  const withError = productFormReducer(createProductFormState(), {
    type: 'setFieldErrors',
    fieldErrors: { name: 'Name is required.' },
  });
  const edited = productFormReducer(withError, {
    type: 'change',
    field: 'name',
    value: 'Copper',
  });

  assert.equal(edited.draft.name, 'Copper');
  assert.equal(edited.fieldErrors.name, undefined);
});
