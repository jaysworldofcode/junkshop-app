import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createPurchaseFormState, purchaseFormReducer } from './purchaseFormReducer';

const TODAY = '2026-10-06';

test('starts with one empty line, paid in cash, dated today', () => {
  const state = createPurchaseFormState(TODAY);

  assert.equal(state.draft.purchaseDate, TODAY);
  assert.equal(state.draft.lines.length, 1);
  assert.equal(state.draft.paymentStatus, 'paid');
  assert.equal(state.draft.paymentMethod, 'cash');
});

test('adds lines with unique keys and never removes the last line', () => {
  let state = createPurchaseFormState(TODAY);
  state = purchaseFormReducer(state, { type: 'addLine' });

  const [first, second] = state.draft.lines;
  assert.notEqual(first.key, second.key);

  state = purchaseFormReducer(state, { type: 'removeLine', key: second.key });
  state = purchaseFormReducer(state, { type: 'removeLine', key: first.key });
  assert.equal(state.draft.lines.length, 1);
});

test('clears only the edited line error', () => {
  let state = createPurchaseFormState(TODAY);
  const key = state.draft.lines[0].key;
  state = purchaseFormReducer(state, {
    type: 'setErrors',
    errors: { lines: { [key]: { quantity: 'Enter the quantity.', buyPrice: 'Enter the buy price.' } } },
  });

  state = purchaseFormReducer(state, { type: 'changeLine', key, field: 'quantity', value: '35.5' });

  assert.equal(state.draft.lines[0].quantity, '35.5');
  assert.equal(state.errors.lines[key].quantity, undefined);
  assert.equal(state.errors.lines[key].buyPrice, 'Enter the buy price.');
});

test('picking a product fills in its current prices and clears price errors', () => {
  let state = createPurchaseFormState(TODAY);
  const key = state.draft.lines[0].key;
  state = purchaseFormReducer(state, {
    type: 'setErrors',
    errors: { lines: { [key]: { materialId: 'Pick a product.', buyPrice: 'Enter the buy price.', quantity: 'Enter the quantity.' } } },
  });

  state = purchaseFormReducer(state, {
    type: 'selectProduct',
    key,
    materialId: 'copper',
    buyPrice: '420',
    supplierPrice: '470',
  });

  const [line] = state.draft.lines;
  assert.equal(line.materialId, 'copper');
  assert.equal(line.buyPrice, '420');
  assert.equal(line.supplierPrice, '470');
  assert.equal(state.errors.lines[key].materialId, undefined);
  assert.equal(state.errors.lines[key].buyPrice, undefined);
  assert.equal(state.errors.lines[key].quantity, 'Enter the quantity.');
});

test('resets to a fresh ticket on the same date after saving', () => {
  let state = createPurchaseFormState('2026-10-05');
  const oldKey = state.draft.lines[0].key;
  state = purchaseFormReducer(state, { type: 'changeHeader', field: 'sellerName', value: 'Pedro' });
  state = purchaseFormReducer(state, {
    type: 'submitSuccess',
    saved: { id: 'p1', purchaseNumber: 'P-20261005-001', sellerName: 'Pedro', totalAmount: 1_491_000, lineCount: 1 },
  });

  assert.equal(state.draft.purchaseDate, '2026-10-05');
  assert.equal(state.draft.sellerName, '');
  assert.equal(state.draft.lines.length, 1);
  assert.notEqual(state.draft.lines[0].key, oldKey);
  assert.equal(state.lastSaved?.purchaseNumber, 'P-20261005-001');
});
