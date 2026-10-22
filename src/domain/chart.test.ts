import assert from 'node:assert/strict';
import { test } from 'node:test';

import { formatCompactPeso, formatTrendAxisLabel, labelInterval, niceAxis } from './chart';

test('the y-axis tops out at a round amount just above the highest point', () => {
  assert.deepEqual(niceAxis(0, 112_800_000, 4), { min: 0, max: 120_000_000, step: 30_000_000 });
  assert.deepEqual(niceAxis(0, 950_000, 4), { min: 0, max: 1_000_000, step: 250_000 });
});

test('an empty period still gets a small readable axis', () => {
  assert.deepEqual(niceAxis(0, 0, 4), { min: 0, max: 40_000, step: 10_000 });
});

test('the y-axis goes below zero when a day lost money', () => {
  const axis = niceAxis(-200_000, 900_000, 4);
  assert.ok(axis.min <= -200_000);
  assert.ok(axis.max >= 900_000);
  assert.equal(Math.abs(axis.min % axis.step), 0);
  assert.equal(axis.max - axis.min, axis.step * 4);
});

test('shortens peso amounts for the axis', () => {
  assert.equal(formatCompactPeso(50_000), '₱500');
  assert.equal(formatCompactPeso(150_000), '₱1.5K');
  assert.equal(formatCompactPeso(1_200_000), '₱12K');
  assert.equal(formatCompactPeso(120_000_000), '₱1.2M');
  assert.equal(formatCompactPeso(0), '₱0');
});

test('labels days with the weekday, weeks with the start day, and months with the year', () => {
  assert.match(formatTrendAxisLabel('2026-10-09', 'day'), /^Oct\s+9 \(Fri\)$/);
  assert.match(formatTrendAxisLabel('2026-10-12', 'week'), /^Oct\s+12$/);
  assert.match(formatTrendAxisLabel('2026-10-01', 'month'), /Oct\s+2026/);
});

test('skips date labels when points are too close together', () => {
  assert.equal(labelInterval(60, 56), 1);
  assert.equal(labelInterval(20, 56), 3);
});
