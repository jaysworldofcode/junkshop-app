import { compactDateKey, type LocalDateKey } from '@/domain/localDate';

/** The part before the sequence, such as P-20261006-. */
export function ticketNumberStem(prefix: string, ticketDate: LocalDateKey): string {
  return `${prefix}-${compactDateKey(ticketDate)}-`;
}

/** Display label such as P-20261006-001. The row UUID stays the real identity. */
export function formatTicketNumber(
  prefix: string,
  sequenceDigits: number,
  ticketDate: LocalDateKey,
  sequence: number
): string {
  return `${ticketNumberStem(prefix, ticketDate)}${String(sequence).padStart(sequenceDigits, '0')}`;
}

/**
 * The next sequence for a day. A ticket can be moved to another date and keep its number,
 * so counting the day's tickets alone could hand out a number that is already used.
 */
export function nextTicketSequence(highestUsed: number | null, ticketsOnDay: number): number {
  return Math.max(highestUsed ?? 0, ticketsOnDay) + 1;
}
