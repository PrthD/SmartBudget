import {
  addDays,
  dayOfWeek,
  formatCivil,
  isValidCivilDate,
  parseCivil,
} from '../../lib/civilDate.js';

/**
 * Rule-based parser for "Smart Add". Used when AI is disabled, unconfigured
 * or out of quota, so the feature always does something useful.
 * e.g. "Costco groceries 84.20 yesterday", "salary 3200 monthly".
 */

const INCOME_WORDS =
  /\b(salary|paycheck|payroll|wage|wages|income|bonus|freelance|invoice|dividend|interest|refund|received|got paid|earned)\b/i;

const FREQUENCY_PATTERNS = [
  ['biweekly', /\b(bi-?weekly|every (two|2) weeks|fortnightly)\b/i],
  ['weekly', /\b(weekly|every week|each week)\b/i],
  ['monthly', /\b(monthly|every month|each month|per month|\/mo)\b/i],
  ['yearly', /\b(yearly|annually|annual|every year|per year|\/yr)\b/i],
];

const CATEGORY_KEYWORDS = {
  Groceries:
    /\b(grocer(y|ies)|costco|walmart|safeway|superstore|supermarket|sobeys|no ?frills|trader joe'?s|whole foods)\b/i,
  Transportation:
    /\b(uber|lyft|taxi|gas|fuel|petrol|bus|transit|train|parking|car wash)\b/i,
  Entertainment:
    /\b(movie|cinema|netflix|spotify|disney|concert|game|steam|tickets?)\b/i,
  Utilities:
    /\b(electric(ity)?|hydro|water bill|internet|wifi|phone bill|utility|utilities)\b/i,
  Dining:
    /\b(restaurant|coffee|starbucks|tim hortons|lunch|dinner|breakfast|takeout|pizza|cafe)\b/i,
  Housing: /\b(rent|mortgage|condo fees?)\b/i,
  Health: /\b(pharmacy|doctor|dentist|gym|medicine|prescription)\b/i,
  Shopping: /\b(amazon|clothes|clothing|shoes|mall)\b/i,
};

const SOURCE_KEYWORDS = {
  Salary: /\b(salary|paycheck|payroll|wages?)\b/i,
  Freelance: /\b(freelance|invoice|client|contract)\b/i,
  Investments: /\b(dividend|interest|stocks?)\b/i,
};

const MONTHS = [
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
];
const WEEKDAYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

const MONTH_NAMES = MONTHS.join('|');
const DATE_PHRASES = [
  /\b\d{4}-\d{2}-\d{2}\b/g,
  new RegExp(`\\b(${MONTH_NAMES})[a-z]*\\.? \\d{1,2}(st|nd|rd|th)?\\b`, 'gi'),
  new RegExp(`\\b\\d{1,2}(st|nd|rd|th)? (${MONTH_NAMES})[a-z]*\\b`, 'gi'),
  /\b\d{1,2}(st|nd|rd|th)\b/gi,
];

function parseAmount(text) {
  const withoutDates = DATE_PHRASES.reduce(
    (acc, pattern) => acc.replace(pattern, ' '),
    text
  );
  const candidates = [
    ...withoutDates.matchAll(
      /(\$\s*)?(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d{1,2}))?/g
    ),
  ].map((m) => ({
    value: Number(`${m[2].replace(/,/g, '')}.${m[3] ?? '0'}`),
    // "$12" or "12.50" is much more likely the amount than a bare "3".
    explicit: Boolean(m[1] || m[3]),
  }));
  const best =
    candidates.find((c) => c.explicit && c.value > 0) ??
    candidates.find((c) => c.value > 0);
  return best?.value ?? null;
}

function parseDate(text, today) {
  const lower = text.toLowerCase();
  const iso = /\b(\d{4}-\d{2}-\d{2})\b/.exec(lower);
  if (iso && isValidCivilDate(iso[1])) return iso[1];
  if (/\byesterday\b/.test(lower)) return addDays(today, -1);
  if (/\btomorrow\b/.test(lower)) return addDays(today, 1);

  const weekday = new RegExp(`\\b(last )?(${WEEKDAYS.join('|')})\\b`).exec(
    lower
  );
  if (weekday) {
    const diff = (dayOfWeek(today) - WEEKDAYS.indexOf(weekday[2]) + 7) % 7 || 7;
    return addDays(today, -diff);
  }

  const monthFirst = new RegExp(
    `\\b(${MONTHS.join('|')})[a-z]*\\.? (\\d{1,2})\\b`
  ).exec(lower);
  const dayFirst = new RegExp(
    `\\b(\\d{1,2})(?:st|nd|rd|th)? (${MONTHS.join('|')})[a-z]*\\b`
  ).exec(lower);
  const parts = monthFirst
    ? { month: MONTHS.indexOf(monthFirst[1]) + 1, day: +monthFirst[2] }
    : dayFirst
      ? { month: MONTHS.indexOf(dayFirst[2]) + 1, day: +dayFirst[1] }
      : null;
  if (parts) {
    let { year } = parseCivil(today);
    let date = formatCivil(year, parts.month, parts.day);
    if (date > today) date = formatCivil((year -= 1), parts.month, parts.day);
    if (isValidCivilDate(date)) return date;
  }
  return today;
}

function pickLabel(text, knownLabels, keywords, fallback) {
  const lower = text.toLowerCase();
  const known = knownLabels.find((name) => lower.includes(name.toLowerCase()));
  if (known) return { label: known, isNew: false };
  for (const [name, pattern] of Object.entries(keywords)) {
    if (pattern.test(text)) {
      const existing = knownLabels.find(
        (l) => l.toLowerCase() === name.toLowerCase()
      );
      return { label: existing ?? name, isNew: !existing };
    }
  }
  return { label: fallback, isNew: !knownLabels.includes(fallback) };
}

/**
 * The note without the parts that became structured fields
 * ("Netflix 16.99 monthly" → "Netflix"). Falls back to the original text.
 */
function cleanDescription(text) {
  const cleaned = [
    ...DATE_PHRASES,
    /\b(yesterday|today|tomorrow)\b/gi,
    new RegExp(`\\b(last )?(${WEEKDAYS.join('|')})\\b`, 'gi'),
    ...FREQUENCY_PATTERNS.map(
      ([, pattern]) => new RegExp(pattern.source, 'gi')
    ),
    /\$?\s*\d[\d,]*(\.\d{1,2})?/g,
    /\bgot paid\b/gi,
  ]
    .reduce((acc, pattern) => acc.replace(pattern, ' '), text)
    .replace(/\s+/g, ' ')
    // Dangling connectives left behind ("Costco at", "for").
    .replace(/(^|\s)(on|at|for|of)\s*$/i, '')
    .replace(/^[\s,.-]+|[\s,.-]+$/g, '')
    .trim();
  return (cleaned || text.trim()).slice(0, 120);
}

/**
 * @param {string} text
 * @param {{ today: string, categories: string[], sources: string[] }} context
 */
export function heuristicParse(text, { today, categories, sources }) {
  const kind = INCOME_WORDS.test(text) ? 'income' : 'expense';
  const frequency =
    FREQUENCY_PATTERNS.find(([, pattern]) => pattern.test(text))?.[0] ?? 'once';
  const { label, isNew } =
    kind === 'income'
      ? pickLabel(text, sources, SOURCE_KEYWORDS, 'Other income')
      : pickLabel(text, categories, CATEGORY_KEYWORDS, 'Other');

  return {
    kind,
    label,
    isNewLabel: isNew,
    amount: parseAmount(text),
    date: parseDate(text, today),
    frequency,
    description: cleanDescription(text),
    confidence: 'low',
  };
}
