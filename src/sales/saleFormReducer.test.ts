import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createSaleFormState, saleFormReducer } from './saleFormReducer';

test('picking a product fills its current sell price and clears those errors', () => {
  let state = createSaleFormState('2026-10-06');
  const key = state.draft.lines[0].key;
  state = saleFormReducer(state, {
    type: 'setErrors',
    errors: {
      lines: {
        [key]: { materialId: 'Pick a product.', sellPrice: 'Enter the selling price.', quantity: 'Enter the quantity sold.' },
      },
    },
  });

  state = saleFormReducer(state, { type: 'selectProduct', key, materialId: 'material-copper', sellPrice: '470' });

  assert.equal(state.draft.lines[0].materialId, 'material-copper');
  assert.equal(state.draft.lines[0].sellPrice, '470');
  assert.deepEqual(state.errors.lines[key], { quantity: 'Enter the quantity sold.' });
});

test('a saved sale starts a fresh ticket on the same date', () => {
  let state = createSaleFormState('2026-10-05');
  state = saleFormReducer(state, { type: 'changeHeader', field: 'buyerName', value: 'ABC Recycling' });
  state = saleFormReducer(state, {
    type: 'submitSuccess',
    saved: { id: 'sale-1', saleNumber: 'S-20261005-001', buyerName: 'ABC Recycling', totalAmount: 470_000, actualProfit: 50_000, lineCount: 1 },
  });

  assert.equal(state.draft.saleDate, '2026-10-05');
  assert.equal(state.draft.buyerName, '');
  assert.equal(state.draft.lines.length, 1);
  assert.equal(state.lastSaved?.saleNumber, 'S-20261005-001');
});
