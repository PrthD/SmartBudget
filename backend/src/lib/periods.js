import {
  addDays,
  addMonths,
  dayOfWeek,
  daysInMonth,
  formatCivil,
  parseCivil,
  toDayNumber,
  fromDayNumber,
} from './civilDate.js';

export const INTERVALS = ['weekly', 'biweekly', 'monthly', 'yearly'];

// Biweekly periods are fixed two-week blocks anchored on a Sunday, so every
// day belongs to exactly one block (v1 started a new block every week).
const BIWEEKLY_EPOCH = toDayNumber('1970-01-04');

/**
 * The period of the given interval that contains `date`.
 * @returns {{ start: string, end: string }} inclusive civil dates
 */
export function periodRange(interval, date) {
  switch (interval) {
    case 'weekly': {
      const start = addDays(date, -dayOfWeek(date));
      return { start, end: addDays(start, 6) };
    }
    case 'biweekly': {
      const offset = toDayNumber(date) - BIWEEKLY_EPOCH;
      const start = fromDayNumber(
        BIWEEKLY_EPOCH + Math.floor(offset / 14) * 14
      );
      return { start, end: addDays(start, 13) };
    }
    case 'monthly': {
      const { year, month } = parseCivil(date);
      return {
        start: formatCivil(year, month, 1),
        end: formatCivil(year, month, daysInMonth(year, month)),
      };
    }
    case 'yearly': {
      const { year } = parseCivil(date);
      return { start: formatCivil(year, 1, 1), end: formatCivil(year, 12, 31) };
    }
    default:
      throw new Error(`Unknown interval: ${interval}`);
  }
}

/** The period `steps` periods away from the one containing `date`. */
export function shiftPeriod(interval, date, steps) {
  const { start } = periodRange(interval, date);
  switch (interval) {
    case 'weekly':
      return periodRange(interval, addDays(start, steps * 7));
    case 'biweekly':
      return periodRange(interval, addDays(start, steps * 14));
    case 'monthly':
      return periodRange(interval, addMonths(start, steps));
    case 'yearly':
      return periodRange(interval, addMonths(start, steps * 12));
    default:
      throw new Error(`Unknown interval: ${interval}`);
  }
}

export function periodLength(range) {
  return toDayNumber(range.end) - toDayNumber(range.start) + 1;
}
