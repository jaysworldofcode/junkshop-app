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
export const TREND_CHART_HEIGHT = 200;
export const TREND_CHART_Y_TICKS = 4;
export const TREND_CHART_Y_AXIS_WIDTH = 52;
/** Fits a two-line date label, like "Oct 9" over "(Fri)". */
export const TREND_CHART_X_AXIS_HEIGHT = 44;
/** Points closer than this make the chart scroll sideways instead of squeezing the dates together. */
export const TREND_CHART_MIN_POINT_SPACING = 44;
/** Room one date label needs, so labels are skipped when points are packed tighter. */
export const TREND_CHART_LABEL_WIDTH = 56;
export const TREND_CHART_LINE_WIDTH = 3;
export const TREND_CHART_DOT_SIZE = 8;
export const PERCENT_FRACTION_DIGITS = 1;
export const PERCENT_SCALE = 100;

export const INSIGHT_TONES = ['good', 'warning', 'info'] as const;
export type InsightTone = (typeof INSIGHT_TONES)[number];
