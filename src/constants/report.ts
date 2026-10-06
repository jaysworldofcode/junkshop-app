export const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const TREND_GRANULARITIES = ['day', 'week', 'month'] as const;
export type TrendGranularity = (typeof TREND_GRANULARITIES)[number];

export const TREND_GRANULARITY_LABELS: Record<TrendGranularity, string> = {
  day: 'By day',
  week: 'By week',
  month: 'By month',
};

/** Ranges up to this many days are charted per day; longer ones per week, then per month. */
export const TREND_DAILY_MAX_DAYS = 31;
export const TREND_WEEKLY_MAX_DAYS = 182;

export const REPORT_DEFAULT_PRESET = 'thisMonth' as const;
export const REPORT_TOP_PEOPLE_LIMIT = 5;
export const TREND_BAR_HEIGHT = 8;
/** Keeps a non-zero value visible as a sliver next to a much larger one. */
export const TREND_BAR_MIN_PERCENT = 2;
export const PERCENT_FRACTION_DIGITS = 1;
export const PERCENT_SCALE = 100;

export const INSIGHT_TONES = ['good', 'warning', 'info'] as const;
export type InsightTone = (typeof INSIGHT_TONES)[number];
