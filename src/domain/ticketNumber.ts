import { compactDateKey, type LocalDateKey } from '@/domain/localDate';

/** Display label such as P-20261006-001. The row UUID stays the real identity. */
export function formatTicketNumber(
  prefix: string,
  sequenceDigits: number,
  ticketDate: LocalDateKey,
  sequence: number
): string {
  return `${prefix}-${compactDateKey(ticketDate)}-${String(sequence).padStart(sequenceDigits, '0')}`;
}
