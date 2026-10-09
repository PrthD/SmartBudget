import { addDays, addMonths, daysBetween, monthsBetween } from './civilDate.js';

export const FREQUENCIES = ['once', 'weekly', 'biweekly', 'monthly', 'yearly'];

const DAY_STEPS = { weekly: 7, biweekly: 14 };
const MONTH_STEPS = { monthly: 1, yearly: 12 };

/** How far ahead "next occurrence" searches before giving up. */
const LOOKAHEAD_YEARS = 5;

/**
 * The n-th occurrence of a recurring schedule. Always computed from the
 * anchor (never cumulatively), so month-end dates don't drift:
 * Jan 31 → Feb 28 → Mar 31 → Apr 30.
 */
export function occurrenceAt(anchor, frequency, index) {
  if (DAY_STEPS[frequency])
    return addDays(anchor, index * DAY_STEPS[frequency]);
  if (MONTH_STEPS[frequency]) {
    return addMonths(anchor, index * MONTH_STEPS[frequency]);
  }
  if (frequency === 'once') return anchor;
  throw new Error(`Unknown frequency: ${frequency}`);
}

/** Index of the first occurrence that may fall on/after `date`. */
function firstIndexOnOrAfter(anchor, frequency, date) {
  if (date <= anchor) return 0;
  if (DAY_STEPS[frequency]) {
    return Math.ceil(daysBetween(anchor, date) / DAY_STEPS[frequency]);
  }
  // Month clamping means the estimate can be one step early, never late.
  return Math.max(
    0,
    Math.floor(monthsBetween(anchor, date) / MONTH_STEPS[frequency])
  );
}

/**
 * Occurrence dates of a schedule within [from, to] (inclusive), excluding
 * skipped dates.
 *
 * @param {{ anchor: string, frequency: string, skipped?: Set<string> }} schedule
 * @param {string} from
 * @param {string} to
 * @returns {string[]}
 */
export function occurrencesInRange({ anchor, frequency, skipped }, from, to) {
  if (to < anchor || from > to) return [];
  if (frequency === 'once') {
    return anchor >= from && anchor <= to ? [anchor] : [];
  }

  const dates = [];
  for (let i = firstIndexOnOrAfter(anchor, frequency, from); ; i += 1) {
    const date = occurrenceAt(anchor, frequency, i);
    if (date > to) break;
    if (date >= from && !skipped?.has(date)) dates.push(date);
  }
  return dates;
}

/**
 * The first non-skipped occurrence strictly after `today`, or null for
 * one-off items / schedules with nothing in the look-ahead window.
 */
export function nextOccurrence({ anchor, frequency, skipped }, today) {
  if (frequency === 'once') return null;
  const horizon = addMonths(today, LOOKAHEAD_YEARS * 12);
  const start = addDays(today, 1);
  for (let i = firstIndexOnOrAfter(anchor, frequency, start); ; i += 1) {
    const date = occurrenceAt(anchor, frequency, i);
    if (date > horizon) return null;
    if (date >= start && !skipped?.has(date)) return date;
  }
}

export function isOccurrence({ anchor, frequency }, date) {
  if (date < anchor) return false;
  const index = firstIndexOnOrAfter(anchor, frequency, date);
  return occurrenceAt(anchor, frequency, index) === date;
}
