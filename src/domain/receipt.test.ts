import assert from 'node:assert/strict';
import { test } from 'node:test';

import { RECEIPT_LINE_WIDTH } from '../constants/printing';
import { encodeReceipt } from './escpos';
import { buildReceiptLines, columns, printerText, shopHeaderLines, wrap, type ReceiptTicket, type ShopDetails } from './receipt';

const SHOP: ShopDetails = {
  shopName: 'My Junkshop',
  shopPhone: '0917 123 4567',
  shopAddress: '123 Rizal Street, Barangay San Jose, Quezon City',
};

const TICKET: ReceiptTicket = {
  title: 'BUY RECEIPT',
  number: 'P-20261006-001',
  date: '2026-10-06',
  partyLabel: 'Seller',
  partyName: 'Señor Juan dela Cruz',
  items: [
    { name: 'Copper', quantity: 12_500, unit: 'kg', unitPrice: 42_000, total: 525_000 },
    { name: 'Aluminum cans and assorted scrap pieces', quantity: 3_000, unit: 'kg', unitPrice: 8_000, total: 24_000 },
  ],
  subtotal: null,
  total: 549_000,
  paymentStatus: 'paid',
  paymentMethod: 'cash',
  notes: null,
};

test('keeps every receipt line within the paper width', () => {
  const lines = buildReceiptLines(TICKET, SHOP, new Date(2026, 9, 6, 18, 36));
  for (const line of lines) {
    const width = line.large ? RECEIPT_LINE_WIDTH / 2 : RECEIPT_LINE_WIDTH;
    assert.ok(line.text.length <= width, `"${line.text}" is ${line.text.length} characters`);
  }
});

test('prints amounts with the totals on the right', () => {
  const text = buildReceiptLines(TICKET, SHOP, new Date(2026, 9, 6, 18, 36)).map((line) => line.text);
  assert.ok(text.includes(' 12.5 kg x P420.00     P5,250.00'));
  assert.ok(text.some((line) => line.startsWith('TOTAL') && line.endsWith('P5,490.00')));
  assert.ok(text.includes('Printed 10/06/2026 6:36 PM'));
});

test('prints the shop name, address, and phone centered at the top', () => {
  const header = shopHeaderLines(SHOP);
  assert.equal(header[0].text, 'My Junkshop');
  assert.equal(header[0].large, true);
  assert.ok(header.every((line) => line.align === 'center'));
  assert.ok(header.some((line) => line.text === 'Tel: 0917 123 4567'));
  assert.ok(header.filter((line) => !line.large).length >= 2, 'the long address wraps');
});

test('leaves out blank shop details and falls back to a default name', () => {
  const header = shopHeaderLines({ shopName: ' ', shopPhone: '', shopAddress: '' });
  assert.deepEqual(
    header.map((line) => line.text),
    ['JUNKSHOP']
  );
});

test('turns characters the printer cannot show into plain ones', () => {
  assert.equal(printerText('Señor ₱5 · ok'), 'Senor P5 - ok');
  assert.equal(printerText('漢'), '?');
});

test('moves the right column down when both sides do not fit', () => {
  const lines = columns('A very long description that fills the line', 'P1.00', 20);
  assert.equal(lines.at(-1)?.text, '               P1.00');
  assert.ok(lines.every((line) => line.text.length <= 20));
});

test('wraps long words and sentences', () => {
  assert.deepEqual(
    wrap('abcdefghij klm', 5).map((line) => line.text),
    ['abcde', 'fghij', 'klm']
  );
});

test('encodes plain ASCII between ESC/POS commands', () => {
  const bytes = encodeReceipt([{ text: 'Hi', bold: true }]);
  assert.deepEqual([...bytes.slice(0, 2)], [0x1b, 0x40]);
  assert.ok(bytes.every((byte) => byte <= 0x7f));
  const hi = [...bytes].indexOf(0x48);
  assert.deepEqual([...bytes.slice(hi, hi + 3)], [0x48, 0x69, 0x0a]);
});
