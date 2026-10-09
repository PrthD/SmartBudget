/**
 * Pure analytics over transaction "entries". No I/O here — everything is
 * unit-testable with plain objects.
 *
 * An entry is { id, kind, label, amount, schedule } where schedule is
 * { anchor, frequency, skipped } (see lib/recurrence.js).
 */
import {
  addDays,
  addMonths,
  daysBetween,
  minDate,
  parseCivil,
  formatCivil,
} from '../../lib/civilDate.js';
import { occurrencesInRange } from '../../lib/recurrence.js';
import { periodLength, periodRange, shiftPeriod } from '../../lib/periods.js';
import { round2 } from '../../lib/money.js';

/** Total of all entries within [from, to], overall and per label. */
export function totalsInRange(entries, { start, end }) {
  const byLabel = new Map();
  let total = 0;
  for (const entry of entries) {
    const count = occurrencesInRange(entry.schedule, start, end).length;
    if (!count) continue;
    const value = count * entry.amount;
    total += value;
    byLabel.set(entry.label, (byLabel.get(entry.label) ?? 0) + value);
  }
  return {
    total: round2(total),
    byLabel: [...byLabel.entries()]
      .map(([name, amount]) => ({ name, amount: round2(amount) }))
      .sort((a, b) => b.amount - a.amount),
  };
}

/** How far through a period `today` is (1 for past periods, 0 for future). */
export function elapsedFraction(range, today) {
  if (today < range.start) return 0;
  if (today >= range.end) return 1;
  return (daysBetween(range.start, today) + 1) / periodLength(range);
}

/** The part of a period that has already happened (null if it's all future). */
export function toDateRange(range, today) {
  if (today < range.start) return null;
  return { start: range.start, end: minDate(range.end, today) };
}

/** The part of a period still to come (null if it's all past). */
export function remainingRange(range, today) {
  if (today >= range.end) return null;
  return {
    start: today < range.start ? range.start : addDays(today, 1),
    end: range.end,
  };
}

const EMPTY = { total: 0, byLabel: [] };
const totalsOrEmpty = (entries, range) =>
  range ? totalsInRange(entries, range) : EMPTY;

/**
 * End-of-period projection: what has happened, plus what is already
 * scheduled, plus one-off spending extrapolated at its current pace. Fixed
 * costs (rent on the 1st) are therefore not multiplied up.
 */
export function projectPeriod(entries, range, today, interval) {
  const done = toDateRange(range, today);
  const actual = totalsOrEmpty(entries, done).total;
  const scheduled = totalsOrEmpty(entries, remainingRange(range, today)).total;
  const elapsed = elapsedFraction(range, today);
  return {
    actual,
    scheduled,
    projected: round2(
      actual +
        scheduled +
        expectedOneOffs(entries, range, today, interval, elapsed)
    ),
  };
}

const HISTORY_PERIODS = 3;

/**
 * One-off spending still expected before the period ends. Based on what is
 * typical for the last few periods, so a single big purchase early on (a new
 * phone on the 8th) isn't extrapolated as if it were a daily habit. Without
 * any history, falls back to the current period's pace.
 */
function expectedOneOffs(entries, range, today, interval, elapsed) {
  if (elapsed <= 0 || elapsed >= 1) return 0;
  const oneOffs = entries.filter(
    (entry) => entry.schedule.frequency === 'once'
  );
  const history = interval
    ? Array.from(
        { length: HISTORY_PERIODS },
        (_, i) =>
          totalsInRange(oneOffs, shiftPeriod(interval, range.start, -(i + 1)))
            .total
      )
    : [];
  if (history.some((total) => total > 0)) {
    const typical =
      history.reduce((sum, total) => sum + total, 0) / history.length;
    return typical * (1 - elapsed);
  }
  const soFar = totalsOrEmpty(oneOffs, toDateRange(range, today)).total;
  return (soFar * (1 - elapsed)) / elapsed;
}

/**
 * Progress of a target (budget or income goal) over its own interval.
 * `amounts` is { name: targetAmount }. "Actual" counts only what has
 * happened by `today`.
 */
export function targetProgress({ interval, amounts }, entries, refDate, today) {
  const range = periodRange(interval, refDate);
  const { total: actual, byLabel } = totalsOrEmpty(
    entries,
    toDateRange(range, today)
  );
  const { scheduled, projected } = projectPeriod(
    entries,
    range,
    today,
    interval
  );
  const actualByName = new Map(byLabel.map((item) => [item.name, item.amount]));

  const names = new Set([...Object.keys(amounts), ...actualByName.keys()]);
  const items = [...names]
    .map((name) => ({
      name,
      target: round2(amounts[name] ?? 0),
      actual: actualByName.get(name) ?? 0,
    }))
    .sort((a, b) => b.target - a.target || b.actual - a.actual);

  const target = round2(Object.values(amounts).reduce((acc, v) => acc + v, 0));
  const elapsed = elapsedFraction(range, today);
  return {
    interval,
    range,
    target,
    actual,
    percent: target > 0 ? round2((actual / target) * 100) : 0,
    elapsed: round2(elapsed),
    scheduled,
    projected,
    items,
  };
}

/**
 * Monthly income/expense/net for the `months` months ending at `refDate`,
 * counting only what has happened by `today`.
 */
export function monthlyTrend(
  incomeEntries,
  expenseEntries,
  refDate,
  today,
  months = 12
) {
  const { year, month } = parseCivil(refDate);
  const lastMonthStart = formatCivil(year, month, 1);
  const series = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    const range = toDateRange(
      periodRange('monthly', addMonths(lastMonthStart, -i)),
      today
    );
    if (!range) continue;
    const income = totalsInRange(incomeEntries, range).total;
    const expense = totalsInRange(expenseEntries, range).total;
    series.push({
      month: range.start.slice(0, 7),
      income,
      expense,
      net: round2(income - expense),
    });
  }
  return series;
}

/** Scheduled items in the next `days` days (after today). */
export function upcoming(entries, today, { days = 30, limit = 8 } = {}) {
  const range = { start: addDays(today, 1), end: addDays(today, days) };
  const items = [];
  for (const entry of entries) {
    for (const date of occurrencesInRange(
      entry.schedule,
      range.start,
      range.end
    )) {
      items.push({
        id: entry.id,
        kind: entry.kind,
        label: entry.label,
        amount: entry.amount,
        date,
      });
    }
  }
  return items
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    .slice(0, limit);
}

/**
 * Period totals (actual to date) plus what is still scheduled, and the
 * preceding period for comparison. While the current period is in progress
 * the previous one is cut at the same point (Oct 1–6 vs Sep 1–6), so
 * "vs last period" compares like with like.
 */
export function periodSummary(
  incomeEntries,
  expenseEntries,
  interval,
  refDate,
  today
) {
  const currentRange = periodRange(interval, refDate);
  const previousRange = shiftPeriod(interval, refDate, -1);
  const inProgress = currentRange.start <= today && today < currentRange.end;
  const previousAsOf = inProgress
    ? minDate(
        addDays(previousRange.start, daysBetween(currentRange.start, today)),
        previousRange.end
      )
    : today;

  const summarise = (range, asOf) => {
    const done = toDateRange(range, asOf);
    const income = totalsOrEmpty(incomeEntries, done);
    const expense = totalsOrEmpty(expenseEntries, done);
    const upcomingRange = remainingRange(range, asOf);
    const net = round2(income.total - expense.total);
    return {
      range,
      asOf: done ? done.end : null,
      income: income.total,
      expense: expense.total,
      net,
      savingsRate: income.total > 0 ? round2((net / income.total) * 100) : null,
      scheduled: {
        income: totalsOrEmpty(incomeEntries, upcomingRange).total,
        expense: totalsOrEmpty(expenseEntries, upcomingRange).total,
      },
      byCategory: expense.byLabel,
      bySource: income.byLabel,
    };
  };
  return {
    current: summarise(currentRange, today),
    previous: summarise(previousRange, previousAsOf),
    comparison: inProgress ? 'to-date' : 'full',
  };
}

/**
 * Suggested target per label: the average per-interval amount over the last
 * three months, rounded up to a friendly number.
 */
export function suggestTargets(entries, interval, today) {
  const end = addDays(periodRange('monthly', today).start, -1);
  const start = addMonths(addDays(end, 1), -3);
  const { byLabel } = totalsInRange(entries, {
    start,
    end: minDate(end, today),
  });
  const perMonth = {
    weekly: 12 / 52,
    biweekly: 24 / 52,
    monthly: 1,
    yearly: 12,
  };
  const roundUp = (value) => {
    const step = value >= 1000 ? 50 : value >= 100 ? 10 : 5;
    return Math.ceil(value / step) * step;
  };
  return Object.fromEntries(
    byLabel
      .map(({ name, amount }) => [
        name,
        roundUp((amount / 3) * perMonth[interval]),
      ])
      .filter(([, amount]) => amount > 0)
  );
}
