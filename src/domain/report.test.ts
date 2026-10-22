import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildTrend } from './report';

test('each day in the trend adds sale profit and buy profit, like Total profit on Home', () => {
  const trend = buildTrend(
    { from: '2026-10-12', to: '2026-10-13' },
    [
      { date: '2026-10-12', sales: 500_000, purchases: 300_000, profit: 80_000, buyProfit: 40_000, expenses: 10_000 },
      { date: '2026-10-13', sales: 0, purchases: 200_000, profit: 0, buyProfit: 25_000, expenses: 0 },
    ],
    'day'
  );

  assert.deepEqual(
    trend.map((bucket) => [bucket.key, bucket.sales, bucket.purchases, bucket.profit]),
    [
      ['2026-10-12', 500_000, 300_000, 120_000],
      ['2026-10-13', 0, 200_000, 25_000],
    ]
  );
});
