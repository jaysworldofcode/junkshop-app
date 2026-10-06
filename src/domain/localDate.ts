const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TYPED_ISO_DATE_PATTERN = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
const TYPED_MONTH_FIRST_DATE_PATTERN = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/;
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

/** Formats a day the way the cashier types it: MM/DD/YYYY. */
export function formatTypedDate(dateKey: LocalDateKey): string {
  const [year, month, day] = dateKey.split('-');
  return `${month}/${day}/${year}`;
}

/** Reads MM/DD/YYYY (also with - or .) or YYYY-MM-DD. Null when it is not a real calendar day. */
export function parseTypedDate(text: string): LocalDateKey | null {
  const trimmed = text.trim();
  const iso = TYPED_ISO_DATE_PATTERN.exec(trimmed);
  const monthFirst = TYPED_MONTH_FIRST_DATE_PATTERN.exec(trimmed);
  const parts = iso
    ? { year: Number(iso[1]), month: Number(iso[2]), day: Number(iso[3]) }
    : monthFirst
      ? { year: Number(monthFirst[3]), month: Number(monthFirst[1]), day: Number(monthFirst[2]) }
      : null;

  if (!parts) {
    return null;
  }

  const date = new Date(parts.year, parts.month - 1, parts.day);
  const isRealDay =
    date.getFullYear() === parts.year && date.getMonth() === parts.month - 1 && date.getDate() === parts.day;
  return isRealDay ? toLocalDateKey(date) : null;
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

/** "Oct 6, 2026, 6:36 PM" from an ISO timestamp, in the phone's time zone. */
export function formatTimestampLabel(isoTimestamp: string): string {
  return new Intl.DateTimeFormat(DATE_LABEL_LOCALE, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(isoTimestamp));
}
