import type { Delivery } from '@tax-inspection/shared';

/**
 * Minutes since midnight for a delivery `time` string such as `"9:30 AM"` or
 * `"01:05 PM"` (hour is free-typed, so may be 1 or 2 digits). Falls back to 0
 * when the value can't be parsed so sorting stays stable.
 */
function timeToMinutes(time: string): number {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i.exec(time.trim());
  if (!match) return 0;

  const rawHour = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3]?.toUpperCase();

  let hour = rawHour;
  if (meridiem === 'AM') hour = rawHour % 12;
  else if (meridiem === 'PM') hour = (rawHour % 12) + 12;

  return hour * 60 + minutes;
}

/**
 * Order deliveries newest-first by their reported `date` then `time` (not by
 * when the record was created). `date` is `yyyy-mm-dd` (lexically sortable);
 * `time` is parsed to minutes since the string form isn't chronological.
 * `createdAt` breaks exact ties for a deterministic order.
 */
export function compareDeliveriesByDateTimeDesc(a: Delivery, b: Delivery): number {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1;

  const byTime = timeToMinutes(b.time) - timeToMinutes(a.time);
  if (byTime !== 0) return byTime;

  return b.createdAt.localeCompare(a.createdAt);
}
