import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createEmptyExpenseDraft,
  expenseValuesFromDraft,
  groupExpensesByDay,
  hasExpenseErrors,
  validateExpenseDraft,
  type Expense,
} from './expense';

const DAY = '2026-10-06';

function makeExpense(id: string, expenseDate: string, amount: number): Expense {
  return {
    id,
    expenseDate,
    category: 'wages',
    title: 'Helper wages',
    amount,
    paymentMethod: 'cash',
    notes: null,
    createdAt: `${expenseDate}T08:00:00.000Z`,
    updatedAt: `${expenseDate}T08:00:00.000Z`,
  };
}

test('an empty draft needs a title, a category and an amount', () => {
  const errors = validateExpenseDraft(createEmptyExpenseDraft(DAY));
  assert.ok(errors.title);
  assert.ok(errors.category);
  assert.ok(errors.amount);
  assert.equal(hasExpenseErrors(errors), true);
});

test('rejects zero and malformed amounts', () => {
  const draft = { ...createEmptyExpenseDraft(DAY), category: 'food' as const, title: 'Lunch' };
  assert.ok(validateExpenseDraft({ ...draft, amount: '0' }).amount);
  assert.ok(validateExpenseDraft({ ...draft, amount: 'abc' }).amount);
});

test('a title of only spaces is rejected', () => {
  const draft = { ...createEmptyExpenseDraft(DAY), category: 'food' as const, amount: '100', title: '   ' };
  assert.ok(validateExpenseDraft(draft).title);
});

test('a valid draft becomes centavo values with a trimmed title and blank notes as null', () => {
  const draft = {
    ...createEmptyExpenseDraft(DAY),
    category: 'transport' as const,
    amount: '250.50',
    title: '  Diesel for the truck ',
    notes: ' ',
  };
  assert.equal(hasExpenseErrors(validateExpenseDraft(draft)), false);
  const values = expenseValuesFromDraft(draft);
  assert.equal(values.amount, 25050);
  assert.equal(values.title, 'Diesel for the truck');
  assert.equal(values.notes, null);
  assert.equal(values.category, 'transport');
});

test('groups expenses by day with day totals', () => {
  const sections = groupExpensesByDay([
    makeExpense('a', DAY, 500000),
    makeExpense('b', DAY, 15000),
    makeExpense('c', '2026-10-05', 2000),
  ]);
  assert.equal(sections.length, 2);
  assert.equal(sections[0].dayTotal, 515000);
  assert.equal(sections[0].data.length, 2);
  assert.equal(sections[1].expenseDate, '2026-10-05');
});
