import assert from 'node:assert/strict';
import { test } from 'node:test';

import { formatTicketNumber, nextTicketSequence, ticketNumberStem } from './ticketNumber';

test('formats a ticket number from its date and sequence', () => {
  assert.equal(ticketNumberStem('P', '2026-10-06'), 'P-20261006-');
  assert.equal(formatTicketNumber('P', 3, '2026-10-06', 7), 'P-20261006-007');
});

test('a ticket moved off a day does not free its number for a new ticket', () => {
  // The day had 001 to 003; 003 was moved to another date, so only two tickets remain on it.
  assert.equal(nextTicketSequence(3, 2), 4);
});

test('a ticket moved onto a day still leaves room after the day count', () => {
  // The day has 001 and 002 plus one ticket moved in from another date.
  assert.equal(nextTicketSequence(2, 3), 4);
  assert.equal(nextTicketSequence(null, 0), 1);
});
