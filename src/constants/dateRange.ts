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

export const TYPED_DATE_PLACEHOLDER = 'MM/DD/YYYY';
export const TYPED_DATE_MAX_LENGTH = 10;
export const DATE_PICKER_BACKDROP_COLOR = 'rgba(0, 0, 0, 0.4)';

/** Weeks start on Monday. Date.getDay() numbers Sunday as 0. */
export const WEEK_START_DAY = 1;
export const DAYS_PER_WEEK = 7;
