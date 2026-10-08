import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  canSaveAsContact,
  createEmptyPersonDraft,
  findPersonByName,
  hasPersonErrors,
  matchesPersonSearch,
  personFitsRole,
  personValuesFromDraft,
  rankTopSellers,
  validatePersonDraft,
  type SellerPurchase,
  type Person,
} from './person';

function makePerson(id: string, name: string, personType: Person['personType']): Person {
  return {
    id,
    name,
    phone: '0917 123 4567',
    address: null,
    personType,
    notes: null,
    createdAt: '2026-10-07T08:00:00.000Z',
    updatedAt: '2026-10-07T08:00:00.000Z',
  };
}

function purchase(overrides: Partial<SellerPurchase>): SellerPurchase {
  return { sellerId: null, personName: null, sellerName: null, totalAmount: 0, ...overrides };
}

test('an empty draft needs a name and a type', () => {
  const errors = validatePersonDraft(createEmptyPersonDraft());
  assert.ok(errors.name);
  assert.ok(errors.personType);
  assert.equal(hasPersonErrors(errors), true);
});

test('Unknown cannot be saved as a person', () => {
  const errors = validatePersonDraft({ ...createEmptyPersonDraft('buyer'), name: ' unknown ' });
  assert.ok(errors.name);
});

test('a valid draft is trimmed and blank fields become null', () => {
  const draft = { ...createEmptyPersonDraft('seller'), name: '  Pedro   Santos ', phone: ' ', notes: '' };
  assert.equal(hasPersonErrors(validatePersonDraft(draft)), false);
  const values = personValuesFromDraft(draft);
  assert.equal(values.name, 'Pedro Santos');
  assert.equal(values.phone, null);
  assert.equal(values.notes, null);
  assert.equal(values.personType, 'seller');
});

test('pickers offer sellers on Buy and buyers on Sell, and both on either', () => {
  assert.equal(personFitsRole(makePerson('1', 'Pedro', 'seller'), 'seller'), true);
  assert.equal(personFitsRole(makePerson('1', 'Pedro', 'seller'), 'buyer'), false);
  assert.equal(personFitsRole(makePerson('2', 'Maria', 'both'), 'buyer'), true);
  assert.equal(personFitsRole(makePerson('3', 'ABC Recycling', 'destination'), 'seller'), false);
});

test('search matches name or phone, ignoring case and extra spaces', () => {
  const pedro = makePerson('1', 'Pedro Santos', 'seller');
  assert.equal(matchesPersonSearch(pedro, '  pedro  '), true);
  assert.equal(matchesPersonSearch(pedro, '0917 123'), true);
  assert.equal(matchesPersonSearch(pedro, 'maria'), false);
});

test('a typed name links to a saved person with the same name, preferring one that fits the ticket', () => {
  const people = [makePerson('1', 'Juan', 'seller'), makePerson('2', 'juan', 'buyer')];
  assert.equal(findPersonByName(people, ' JUAN ', 'buyer')?.id, '2');
  assert.equal(findPersonByName(people, 'Juan', 'seller')?.id, '1');
  assert.equal(findPersonByName(people, 'Pedro', 'seller'), null);
});

test('blank and Unknown names are not offered as contacts', () => {
  assert.equal(canSaveAsContact(''), false);
  assert.equal(canSaveAsContact('Unknown'), false);
  assert.equal(canSaveAsContact('Juan'), true);
});

test('ranks sellers by how much the shop paid them and keeps only the limit', () => {
  const ranked = rankTopSellers(
    [
      purchase({ sellerId: 'p1', personName: 'Pedro', sellerName: 'Pedro', totalAmount: 470_000 }),
      purchase({ sellerId: 'p1', personName: 'Pedro', sellerName: 'Pedro', totalAmount: 100_000 }),
      purchase({ sellerName: 'Maria', totalAmount: 900_000 }),
      purchase({ sellerName: 'Ben', totalAmount: 20_000 }),
    ],
    2
  );

  assert.deepEqual(
    ranked.map((seller) => [seller.name, seller.purchaseCount, seller.purchaseTotal]),
    [
      ['Maria', 1, 900_000],
      ['Pedro', 2, 570_000],
    ]
  );
});

test('leaves out blank and Unknown sellers, and joins typed names that differ only in case', () => {
  const ranked = rankTopSellers(
    [
      purchase({ sellerName: 'Unknown', totalAmount: 1_000_000 }),
      purchase({ sellerName: '  ', totalAmount: 1_000_000 }),
      purchase({ sellerName: 'Maria', totalAmount: 10_000 }),
      purchase({ sellerName: 'maria ', totalAmount: 5_000 }),
    ],
    10
  );

  assert.equal(ranked.length, 1);
  assert.equal(ranked[0].purchaseCount, 2);
  assert.equal(ranked[0].purchaseTotal, 15_000);
});

test('leaves out a saved seller whose name is Unknown', () => {
  const ranked = rankTopSellers(
    [purchase({ sellerId: 'p1', personName: 'unknown', sellerName: 'Unknown', totalAmount: 50_000 })],
    10
  );
  assert.equal(ranked.length, 0);
});

test('a saved seller shows their current name after a rename', () => {
  const [seller] = rankTopSellers(
    [purchase({ sellerId: 'p1', personName: 'Pedro Santos', sellerName: 'Pedro', totalAmount: 10_000 })],
    10
  );
  assert.equal(seller.name, 'Pedro Santos');
  assert.equal(seller.personId, 'p1');
});
