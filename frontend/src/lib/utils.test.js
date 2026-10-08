import { describe, expect, it } from 'vitest';
import { toCsv } from './csv';
import { formatMoney, formatPercent } from './format';
import { unusualDateHint } from './dates';
import {
  filterTransactions,
  periodBounds,
} from '@/features/transactions/filters';

describe('toCsv', () => {
  it('quotes special characters and neutralises formula injection', () => {
    const csv = toCsv(
      [
        { header: 'Name', value: (r) => r.name },
        { header: 'Amount', value: (r) => r.amount },
      ],
      [
        { name: 'Coffee, large', amount: 4.5 },
        { name: '=HYPERLINK("http://evil")', amount: -3 },
        { name: 'Say "hi"', amount: 0 },
      ]
    );
    expect(csv.split('\r\n')).toEqual([
      'Name,Amount',
      '"Coffee, large",4.5',
      `"'=HYPERLINK(""http://evil"")",-3`,
      '"Say ""hi""",0',
    ]);
  });
});

describe('formatters', () => {
  it('formats money in the given currency', () => {
    expect(formatMoney(1234.5, 'USD')).toMatch(/1,234\.50/);
    expect(formatMoney(-5, 'EUR')).toMatch(/5\.00/);
  });

  it('formats percentages and handles missing values', () => {
    expect(formatPercent(12.4)).toBe('12%');
    expect(formatPercent(null)).toBe('—');
    expect(formatPercent(5, { sign: true })).toBe('+5%');
  });
});

describe('transaction filters', () => {
  const items = [
    {
      id: 1,
      category: 'Groceries',
      description: 'Costco run',
      frequency: 'once',
      date: '2025-03-04',
      amount: 84.2,
    },
    {
      id: 2,
      category: 'Housing',
      description: 'Rent',
      frequency: 'monthly',
      date: '2025-01-01',
      amount: 1450,
    },
    {
      id: 3,
      category: 'Dining',
      description: '',
      frequency: 'once',
      date: '2025-02-10',
      amount: 23,
    },
  ];
  const base = { q: '', label: 'all', type: 'all', period: 'all' };

  it('matches every search term across fields, including amounts', () => {
    expect(
      filterTransactions(items, { ...base, q: 'costco' }, 'category').map(
        (i) => i.id
      )
    ).toEqual([1]);
    expect(
      filterTransactions(items, { ...base, q: '1450' }, 'category').map(
        (i) => i.id
      )
    ).toEqual([2]);
    expect(
      filterTransactions(items, { ...base, q: 'rent monthly' }, 'category').map(
        (i) => i.id
      )
    ).toEqual([2]);
  });

  it('filters by label and type', () => {
    expect(
      filterTransactions(items, { ...base, label: 'Dining' }, 'category').map(
        (i) => i.id
      )
    ).toEqual([3]);
    expect(
      filterTransactions(items, { ...base, type: 'recurring' }, 'category').map(
        (i) => i.id
      )
    ).toEqual([2]);
    expect(
      filterTransactions(items, { ...base, type: 'once' }, 'category')
    ).toHaveLength(2);
  });

  it('computes period bounds', () => {
    const today = new Date(2025, 2, 15);
    expect(periodBounds('this-month', today)).toEqual([
      '2025-03-01',
      '2025-03-31',
    ]);
    expect(periodBounds('last-month', today)).toEqual([
      '2025-02-01',
      '2025-02-28',
    ]);
    expect(periodBounds('all', today)).toBeNull();
  });
});

describe('unusualDateHint', () => {
  it('flags old dates (e.g. an old receipt or a typo in the year)', () => {
    expect(unusualDateHint('2018-01-01', '2026-10-08')).toMatch(
      /^That's 8 years ago\./
    );
    expect(unusualDateHint('2026-05-01', '2026-10-08')).toMatch(/months ago/);
  });
  it('flags future dates', () => {
    expect(unusualDateHint('2026-10-20', '2026-10-08')).toMatch(/future/);
  });
  it('stays quiet for ordinary dates', () => {
    expect(unusualDateHint('2026-10-08', '2026-10-08')).toBeNull();
    expect(unusualDateHint('2026-08-01', '2026-10-08')).toBeNull();
  });
});
