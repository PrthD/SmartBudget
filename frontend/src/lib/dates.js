import {
  differenceInCalendarDays,
  format,
  formatDistanceStrict,
  parseISO,
} from 'date-fns';

/** Today's calendar date in a time zone, as `YYYY-MM-DD`. */
export function todayIn(timeZone) {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  } catch {
    return format(new Date(), 'yyyy-MM-dd');
  }
}

/** JS Date (from a date picker) → `YYYY-MM-DD` using its local calendar day. */
export const toCivil = (date) => format(date, 'yyyy-MM-dd');

/** `YYYY-MM-DD` → JS Date at local midnight (for date pickers). */
export const fromCivil = (civil) => (civil ? parseISO(civil) : undefined);

export const browserTimeZone = () =>
  Intl.DateTimeFormat().resolvedOptions().timeZone;

export function supportedTimeZones() {
  try {
    return Intl.supportedValuesOf('timeZone');
  } catch {
    return [browserTimeZone()];
  }
}

const STALE_AFTER_DAYS = 90;

/**
 * A heads-up for dates that are easy to get wrong (an old receipt, a typo in
 * the year). Returns null for ordinary dates.
 */
export function unusualDateHint(date, today) {
  if (!date || !today) return null;
  const diff = differenceInCalendarDays(parseISO(date), parseISO(today));
  if (diff < -STALE_AFTER_DAYS) {
    const distance = formatDistanceStrict(parseISO(date), parseISO(today), {
      roundingMethod: 'floor',
    });
    return `That's ${distance} ago. Double-check the date before saving.`;
  }
  if (diff > 0) {
    return "That's in the future, so it won't count toward totals until then.";
  }
  return null;
}
