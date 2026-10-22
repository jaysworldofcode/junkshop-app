import { CENTAVOS_PER_PESO } from '@/constants/money';
import type { TrendGranularity } from '@/constants/report';
import { parseLocalDateKey, type LocalDateKey } from '@/domain/localDate';

const AXIS_LABEL_LOCALE = 'en-PH';
const NICE_STEPS = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
const MIN_STEP_CENTAVOS = 100 * CENTAVOS_PER_PESO;

function niceStep(rough: number): number {
  if (rough <= MIN_STEP_CENTAVOS) {
    return MIN_STEP_CENTAVOS;
  }
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  return (NICE_STEPS.find((nice) => nice * magnitude >= rough) ?? 10) * magnitude;
}

/**
 * A y-axis that always includes zero and lands on round peso amounts, like 0 / 250 / 500 / 750 / 1,000.
 * It goes below zero only when a value does, such as a day sold below cost.
 */
export function niceAxis(lowCentavos: number, highCentavos: number, ticks: number): { min: number; max: number; step: number } {
  const low = Math.min(lowCentavos, 0);
  const high = Math.max(highCentavos, 0);
  let step = niceStep((high - low) / ticks);

  for (;;) {
    const min = Math.floor(low / step) * step;
    const max = min + step * ticks;
    if (max >= high) {
      return { min, max, step };
    }
    step = niceStep(step + 1);
  }
}

function trimDecimal(value: number): string {
  return value.toFixed(1).replace(/\.0$/, '');
}

/** Short peso amounts for a chart axis: ₱500, ₱1.5K, ₱12K, ₱1.2M. */
export function formatCompactPeso(centavos: number): string {
  const pesos = Math.round(centavos / CENTAVOS_PER_PESO);
  const sign = pesos < 0 ? '-' : '';
  const size = Math.abs(pesos);

  if (size >= 1_000_000) {
    return `${sign}₱${trimDecimal(size / 1_000_000)}M`;
  }
  if (size >= 1_000) {
    return `${sign}₱${size >= 10_000 ? Math.round(size / 1_000) : trimDecimal(size / 1_000)}K`;
  }
  return `${sign}₱${size}`;
}

/** "Oct 9 (Fri)" for a day, "Oct 13" for a week, "Oct 2026" for a month. */
export function formatTrendAxisLabel(key: LocalDateKey, granularity: TrendGranularity): string {
  const date = parseLocalDateKey(key);
  if (granularity === 'month') {
    return new Intl.DateTimeFormat(AXIS_LABEL_LOCALE, { month: 'short', year: 'numeric' }).format(date);
  }

  const monthDay = new Intl.DateTimeFormat(AXIS_LABEL_LOCALE, { month: 'short', day: 'numeric' }).format(date);
  if (granularity === 'week') {
    return monthDay;
  }
  const weekday = new Intl.DateTimeFormat(AXIS_LABEL_LOCALE, { weekday: 'short' }).format(date);
  return `${monthDay} (${weekday})`;
}

/** Show every nth date label so neighbouring labels do not overlap. */
export function labelInterval(pointSpacing: number, labelWidth: number): number {
  return pointSpacing >= labelWidth ? 1 : Math.ceil(labelWidth / Math.max(pointSpacing, 1));
}
