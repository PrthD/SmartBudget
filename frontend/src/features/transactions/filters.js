import {
  endOfMonth,
  endOfYear,
  format,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
} from 'date-fns';

export const PERIOD_OPTIONS = [
  { value: 'all', label: 'All time' },
  { value: 'this-month', label: 'This month' },
  { value: 'last-month', label: 'Last month' },
  { value: 'last-90', label: 'Last 90 days' },
  { value: 'this-year', label: 'This year' },
];

const civil = (date) => format(date, 'yyyy-MM-dd');

/** [start, end] civil dates for a period filter, relative to `today`. */
export function periodBounds(period, today = new Date()) {
  switch (period) {
    case 'this-month':
      return [civil(startOfMonth(today)), civil(endOfMonth(today))];
    case 'last-month': {
      const last = subMonths(today, 1);
      return [civil(startOfMonth(last)), civil(endOfMonth(last))];
    }
    case 'last-90':
      return [civil(subDays(today, 89)), civil(today)];
    case 'this-year':
      return [civil(startOfYear(today)), civil(endOfYear(today))];
    default:
      return null;
  }
}

/**
 * Applies text/label/type/period filters. Text search matches label,
 * description, frequency, date and amount ("45" matches 45.00 and 145.20).
 */
export function filterTransactions(
  items,
  { q, label, type, period },
  labelField
) {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  const bounds = periodBounds(period);

  return items.filter((item) => {
    if (label !== 'all' && item[labelField] !== label) return false;
    if (type === 'recurring' && item.frequency === 'once') return false;
    if (type === 'once' && item.frequency !== 'once') return false;
    if (bounds && (item.date < bounds[0] || item.date > bounds[1]))
      return false;
    if (!terms.length) return true;
    const haystack = [
      item[labelField],
      item.description,
      item.frequency,
      item.date,
      item.amount.toFixed(2),
    ]
      .join(' ')
      .toLowerCase();
    return terms.every((term) => haystack.includes(term));
  });
}
