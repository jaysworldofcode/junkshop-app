const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const DATE_LABEL_LOCALE = 'en-PH';

/** A calendar day on the shop phone, stored as ISO-8601 "YYYY-MM-DD". */
export type LocalDateKey = string;

export function toLocalDateKey(date: Date): LocalDateKey {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayLocalDateKey(): LocalDateKey {
  return toLocalDateKey(new Date());
}

export function isLocalDateKey(value: unknown): value is LocalDateKey {
  return typeof value === 'string' && DATE_KEY_PATTERN.test(value);
}

export function parseLocalDateKey(dateKey: LocalDateKey): Date {
  const match = DATE_KEY_PATTERN.exec(dateKey);
  if (!match) {
    throw new Error(`Invalid date: ${dateKey}`);
  }

  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function addDays(dateKey: LocalDateKey, days: number): LocalDateKey {
  const date = parseLocalDateKey(dateKey);
  date.setDate(date.getDate() + days);
  return toLocalDateKey(date);
}

export function relativeDayName(dateKey: LocalDateKey, today: LocalDateKey): 'Today' | 'Yesterday' | null {
  if (dateKey === today) {
    return 'Today';
  }

  return dateKey === addDays(today, -1) ? 'Yesterday' : null;
}

export function compactDateKey(dateKey: LocalDateKey): string {
  return dateKey.replaceAll('-', '');
}

export function formatDateLabel(dateKey: LocalDateKey): string {
  return new Intl.DateTimeFormat(DATE_LABEL_LOCALE, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parseLocalDateKey(dateKey));
}
