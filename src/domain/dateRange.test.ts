import assert from 'node:assert/strict';
import { test } from 'node:test';

import { changeRangeEnd, formatRangeLabel, rangeForPreset, startOfMonth, startOfWeek } from './dateRange';

const TODAY = '2026-10-06';
const CUSTOM = { from: '2026-09-01', to: '2026-09-15' };

test('weeks start on Monday', () => {
  assert.equal(startOfWeek('2026-10-06'), '2026-10-05');
  assert.equal(startOfWeek('2026-10-05'), '2026-10-05');
  assert.equal(startOfWeek('2026-10-11'), '2026-10-05');
});

test('months start on the 1st', () => {
  assert.equal(startOfMonth('2026-10-06'), '2026-10-01');
});

test('each preset maps to an inclusive range', () => {
  assert.deepEqual(rangeForPreset('today', TODAY, CUSTOM), { from: TODAY, to: TODAY });
  assert.deepEqual(rangeForPreset('yesterday', TODAY, CUSTOM), { from: '2026-10-05', to: '2026-10-05' });
  assert.deepEqual(rangeForPreset('thisWeek', TODAY, CUSTOM), { from: '2026-10-05', to: TODAY });
  assert.deepEqual(rangeForPreset('thisMonth', TODAY, CUSTOM), { from: '2026-10-01', to: TODAY });
  assert.deepEqual(rangeForPreset('custom', TODAY, CUSTOM), CUSTOM);
});

test('moving one end past the other drags the other end along', () => {
  assert.deepEqual(changeRangeEnd(CUSTOM, 'from', '2026-09-20'), { from: '2026-09-20', to: '2026-09-20' });
  assert.deepEqual(changeRangeEnd(CUSTOM, 'to', '2026-08-30'), { from: '2026-08-30', to: '2026-08-30' });
  assert.deepEqual(changeRangeEnd(CUSTOM, 'to', '2026-09-10'), { from: '2026-09-01', to: '2026-09-10' });
});

test('labels a single day with Today and a range with both ends', () => {
  assert.match(formatRangeLabel({ from: TODAY, to: TODAY }, TODAY), /^Today · /);
  assert.match(formatRangeLabel(CUSTOM, TODAY), / – /);
});
