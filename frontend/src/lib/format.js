import {
  format as formatDateFns,
  parseISO,
  formatDistanceToNowStrict,
} from 'date-fns';

const cache = new Map();
const locale = typeof navigator !== 'undefined' ? navigator.language : 'en-CA';

function numberFormat(key, options) {
  if (!cache.has(key)) cache.set(key, new Intl.NumberFormat(locale, options));
  return cache.get(key);
}

export function formatMoney(
  value,
  currency = 'CAD',
  { compact = false, sign = false } = {}
) {
  const formatter = numberFormat(`money:${currency}:${compact}:${sign}`, {
    style: 'currency',
    currency,
    // One currency per user, so "$" reads better than "CA$".
    currencyDisplay: 'narrowSymbol',
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: compact ? 1 : 2,
    signDisplay: sign ? 'exceptZero' : 'auto',
  });
  return formatter.format(value ?? 0);
}

export function formatPercent(value, { sign = false, digits = 0 } = {}) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return numberFormat(`pct:${sign}:${digits}`, {
    style: 'percent',
    maximumFractionDigits: digits,
    signDisplay: sign ? 'exceptZero' : 'auto',
  }).format(value / 100);
}

/** `YYYY-MM-DD` → "Oct 6, 2025" (or a custom date-fns pattern). */
export function formatDate(civil, pattern = 'MMM d, yyyy') {
  if (!civil) return '—';
  return formatDateFns(parseISO(civil), pattern);
}

export function formatRelative(isoInstant) {
  return formatDistanceToNowStrict(new Date(isoInstant), { addSuffix: true });
}

export const FREQUENCY_LABELS = {
  once: 'One-time',
  weekly: 'Weekly',
  biweekly: 'Every 2 weeks',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

export const INTERVAL_LABELS = {
  weekly: 'Weekly',
  biweekly: 'Bi-weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

export const capitalize = (value) =>
  value.charAt(0).toUpperCase() + value.slice(1);
