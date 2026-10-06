import { DAYS_PER_WEEK, WEEK_START_DAY, type DateRangePreset } from '@/constants/dateRange';
import { addDays, formatDateLabel, parseLocalDateKey, relativeDayName, toLocalDateKey, type LocalDateKey } from '@/domain/localDate';

/** Both ends are included. */
export type DateRange = {
  from: LocalDateKey;
  to: LocalDateKey;
};

export function startOfWeek(dateKey: LocalDateKey): LocalDateKey {
  const daysSinceStart = (parseLocalDateKey(dateKey).getDay() - WEEK_START_DAY + DAYS_PER_WEEK) % DAYS_PER_WEEK;
  return addDays(dateKey, -daysSinceStart);
}

export function startOfMonth(dateKey: LocalDateKey): LocalDateKey {
  const date = parseLocalDateKey(dateKey);
  date.setDate(1);
  return toLocalDateKey(date);
}

/** The custom range is passed through unchanged; every other preset ends today or yesterday. */
export function rangeForPreset(preset: DateRangePreset, today: LocalDateKey, custom: DateRange): DateRange {
  switch (preset) {
    case 'today':
      return { from: today, to: today };
    case 'yesterday': {
      const yesterday = addDays(today, -1);
      return { from: yesterday, to: yesterday };
    }
    case 'thisWeek':
      return { from: startOfWeek(today), to: today };
    case 'thisMonth':
      return { from: startOfMonth(today), to: today };
    case 'custom':
      return custom;
  }
}

/** Keeps from ≤ to by moving the other end when one end passes it. */
export function changeRangeEnd(range: DateRange, end: keyof DateRange, value: LocalDateKey): DateRange {
  if (end === 'from') {
    return { from: value, to: value > range.to ? value : range.to };
  }

  return { from: value < range.from ? value : range.from, to: value };
}

export function formatRangeLabel(range: DateRange, today: LocalDateKey): string {
  if (range.from === range.to) {
    const dayName = relativeDayName(range.from, today);
    return dayName ? `${dayName} · ${formatDateLabel(range.from)}` : formatDateLabel(range.from);
  }

  return `${formatDateLabel(range.from)} – ${formatDateLabel(range.to)}`;
}
