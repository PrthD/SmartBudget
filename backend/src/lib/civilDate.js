/**
 * "Civil" (calendar) dates as `YYYY-MM-DD` strings.
 *
 * Budgeting cares about calendar days, not instants. Doing all date maths on
 * plain calendar dates avoids DST and server-timezone bugs entirely; time
 * zones only matter at the edges (reading "today" and converting stored
 * instants), which is handled by the Intl-based helpers at the bottom.
 */

const DAY_MS = 86_400_000;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

const pad = (value, length = 2) => String(value).padStart(length, '0');

export function parseCivil(date) {
  const match = ISO_DATE.exec(date);
  if (!match) throw new TypeError(`Invalid civil date: ${date}`);
  return { year: +match[1], month: +match[2], day: +match[3] };
}

export function formatCivil(year, month, day) {
  return `${pad(year, 4)}-${pad(month)}-${pad(day)}`;
}

export function isValidCivilDate(date) {
  if (typeof date !== 'string' || !ISO_DATE.test(date)) return false;
  const { year, month, day } = parseCivil(date);
  return (
    month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth(year, month)
  );
}

export function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Days since 1970-01-01. */
export function toDayNumber(date) {
  const { year, month, day } = parseCivil(date);
  return Date.UTC(year, month - 1, day) / DAY_MS;
}

export function fromDayNumber(dayNumber) {
  const d = new Date(dayNumber * DAY_MS);
  return formatCivil(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

export function addDays(date, days) {
  return fromDayNumber(toDayNumber(date) + days);
}

/** Adds months, clamping to the end of shorter months (Jan 31 + 1 → Feb 28). */
export function addMonths(date, months) {
  const { year, month, day } = parseCivil(date);
  const index = year * 12 + (month - 1) + months;
  const targetYear = Math.floor(index / 12);
  const targetMonth = (index % 12) + 1;
  return formatCivil(
    targetYear,
    targetMonth,
    Math.min(day, daysInMonth(targetYear, targetMonth))
  );
}

/** Whole calendar months from `a` to `b`, ignoring the day of month. */
export function monthsBetween(a, b) {
  const from = parseCivil(a);
  const to = parseCivil(b);
  return (to.year - from.year) * 12 + (to.month - from.month);
}

export function daysBetween(a, b) {
  return toDayNumber(b) - toDayNumber(a);
}

/** 0 = Sunday … 6 = Saturday. */
export function dayOfWeek(date) {
  return (toDayNumber(date) + 4) % 7; // 1970-01-01 was a Thursday.
}

export const minDate = (a, b) => (a < b ? a : b);
export const maxDate = (a, b) => (a > b ? a : b);

/* ------------------------------------------------------------------------ */
/* Time-zone edges                                                          */
/* ------------------------------------------------------------------------ */

const formatterCache = new Map();

function zonedParts(instant, timeZone) {
  let formatter = formatterCache.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    formatterCache.set(timeZone, formatter);
  }
  const parts = {};
  for (const { type, value } of formatter.formatToParts(instant)) {
    parts[type] = value;
  }
  return parts;
}

export function isValidTimeZone(timeZone) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** The calendar date of `instant` as seen in `timeZone`. */
export function instantToCivil(instant, timeZone) {
  const parts = zonedParts(new Date(instant), timeZone);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function todayIn(timeZone, now = new Date()) {
  return instantToCivil(now, timeZone);
}

function offsetMs(instantMs, timeZone) {
  const p = zonedParts(new Date(instantMs), timeZone);
  const asUtc = Date.UTC(
    +p.year,
    +p.month - 1,
    +p.day,
    +p.hour,
    +p.minute,
    +p.second
  );
  return asUtc - Math.floor(instantMs / 1000) * 1000;
}

/** Midnight of `date` in `timeZone`, as a JS Date (the storage format). */
export function civilToInstant(date, timeZone) {
  const { year, month, day } = parseCivil(date);
  const wallClock = Date.UTC(year, month - 1, day);
  // Two passes settle the offset even across DST transitions.
  let guess = wallClock - offsetMs(wallClock, timeZone);
  guess = wallClock - offsetMs(guess, timeZone);
  return new Date(guess);
}
