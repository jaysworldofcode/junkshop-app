export const DATE_RANGE_PRESETS = ['today', 'yesterday', 'thisWeek', 'thisMonth', 'custom'] as const;
export type DateRangePreset = (typeof DATE_RANGE_PRESETS)[number];

export const DEFAULT_DATE_RANGE_PRESET: DateRangePreset = 'today';

export const DATE_RANGE_PRESET_LABELS: Record<DateRangePreset, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  thisWeek: 'This week',
  thisMonth: 'This month',
  custom: 'Custom',
};

/** Weeks start on Monday. Date.getDay() numbers Sunday as 0. */
export const WEEK_START_DAY = 1;
export const DAYS_PER_WEEK = 7;
