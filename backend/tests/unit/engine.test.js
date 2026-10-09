import { describe, expect, it } from 'vitest';
import {
  monthlyTrend,
  periodSummary,
  projectPeriod,
  suggestTargets,
  targetProgress,
  totalsInRange,
  upcoming,
} from '../../src/modules/analytics/engine.js';
import { heuristicParse } from '../../src/modules/ai/heuristicParse.js';
import { ruleBasedInsights } from '../../src/modules/ai/rules.js';

const entry = (
  label,
  amount,
  anchor,
  frequency = 'once',
  kind = 'expense'
) => ({
  id: `${label}-${anchor}`,
  kind,
  label,
  amount,
  schedule: { anchor, frequency, skipped: new Set() },
});

const expenses = [
  entry('Housing', 1500, '2025-01-01', 'monthly'),
  entry('Groceries', 100, '2025-03-03'),
  entry('Groceries', 50.1, '2025-03-10'),
  entry('Dining', 0.2, '2025-03-11'),
  entry('Dining', 0.1, '2025-03-12'),
];
const incomes = [entry('Salary', 2000, '2025-01-03', 'biweekly', 'income')];

describe('analytics engine', () => {
  it('totals occurrences per label without float artefacts', () => {
    const { total, byLabel } = totalsInRange(expenses, {
      start: '2025-03-01',
      end: '2025-03-31',
    });
    expect(total).toBe(1650.4);
    expect(byLabel[0]).toEqual({ name: 'Housing', amount: 1500 });
    expect(byLabel.find((l) => l.name === 'Dining').amount).toBe(0.3);
  });

  it('counts only what has happened by today, and reports what is scheduled', () => {
    const { current } = periodSummary(
      incomes,
      expenses,
      'monthly',
      '2025-03-15',
      '2025-03-15'
    );
    // Biweekly salary from Jan 3: Mar 14 has happened; Mar 28 has not.
    expect(current.income).toBe(2000);
    expect(current.scheduled.income).toBe(2000);
    expect(current.expense).toBe(1650.4);
    expect(current.savingsRate).toBeCloseTo(17.48, 2);
  });

  it('compares an in-progress period with the same point of the last one', () => {
    const coffee = [entry('Coffee', 5, '2025-02-01', 'weekly')]; // Feb 1, 8, 15, 22; Mar 1, 8, 15…
    const summary = periodSummary(
      [],
      coffee,
      'monthly',
      '2025-03-10',
      '2025-03-10'
    );
    expect(summary.comparison).toBe('to-date');
    expect(summary.current.expense).toBe(10); // Mar 1, 8
    expect(summary.previous.asOf).toBe('2025-02-10');
    expect(summary.previous.expense).toBe(10); // Feb 1, 8 — not all of February (20)

    const past = periodSummary(
      [],
      coffee,
      'monthly',
      '2025-02-10',
      '2025-03-10'
    );
    expect(past.comparison).toBe('full');
    expect(past.current.expense).toBe(20);
  });

  it('projects without multiplying fixed costs', () => {
    const range = { start: '2025-03-01', end: '2025-03-31' };
    const { actual, projected } = projectPeriod(expenses, range, '2025-03-15');
    expect(actual).toBe(1650.4);
    // Rent counted once; only one-offs (150.4) are extrapolated over 31 days.
    expect(projected).toBeCloseTo(1650.4 + (150.4 * 16) / 15, 1);
    expect(projected).toBeLessThan(2000);
  });

  it('does not extrapolate one big early purchase (uses typical history)', () => {
    // Three months of ~$300 one-off spending, then a $1,900 phone on Oct 8.
    const history = ['2026-07-10', '2026-08-10', '2026-09-10'].map((date) =>
      entry('Groceries', 300, date)
    );
    const phone = entry('Shopping', 1900, '2026-10-08');
    const range = { start: '2026-10-01', end: '2026-10-31' };
    const { actual, projected } = projectPeriod(
      [...history, phone],
      range,
      '2026-10-08',
      'monthly'
    );
    expect(actual).toBe(1900);
    // 1900 + typical 300 × (23/31 of the month left) ≈ 2,122 — not ~7,360.
    expect(projected).toBeCloseTo(1900 + 300 * (23 / 31), 0);
  });

  it('computes budget progress with unbudgeted categories listed', () => {
    const progress = targetProgress(
      { interval: 'monthly', amounts: { Housing: 1500, Groceries: 200 } },
      expenses,
      '2025-03-20',
      '2025-03-20'
    );
    expect(progress.target).toBe(1700);
    expect(progress.actual).toBe(1650.4);
    expect(progress.items.map((i) => i.name)).toEqual([
      'Housing',
      'Groceries',
      'Dining',
    ]);
    expect(progress.items.find((i) => i.name === 'Dining').target).toBe(0);
  });

  it('builds a trend that stops at today', () => {
    const trend = monthlyTrend(
      incomes,
      expenses,
      '2025-03-12',
      '2025-03-12',
      3
    );
    expect(trend.map((m) => m.month)).toEqual([
      '2025-01',
      '2025-02',
      '2025-03',
    ]);
    expect(trend[0].expense).toBe(1500);
  });

  it('lists upcoming items in date order', () => {
    const items = upcoming([...incomes, ...expenses], '2025-03-12', {
      days: 30,
    });
    expect(items.map((i) => i.date)).toEqual([
      '2025-03-14',
      '2025-03-28',
      '2025-04-01',
      '2025-04-11',
    ]);
  });

  it('suggests rounded targets from the last three months', () => {
    const suggestion = suggestTargets(expenses, 'monthly', '2025-04-15');
    expect(suggestion.Housing).toBe(1500);
    expect(suggestion.Groceries).toBe(55); // 150.1 / 3 = 50.03 → 55
  });
});

describe('smart add fallback parser', () => {
  const context = {
    today: '2025-10-08',
    categories: ['Groceries', 'Coffee'],
    sources: ['Salary'],
  };

  it('parses amount, relative date and an existing category', () => {
    expect(
      heuristicParse('Costco groceries $84.20 yesterday', context)
    ).toMatchObject({
      kind: 'expense',
      label: 'Groceries',
      isNewLabel: false,
      amount: 84.2,
      date: '2025-10-07',
      frequency: 'once',
    });
  });

  it('does not mistake dates for amounts', () => {
    expect(heuristicParse('Oct 3 dinner 45', context)).toMatchObject({
      amount: 45,
      date: '2025-10-03',
      label: 'Dining',
      isNewLabel: true,
    });
  });

  it('keeps only the merchant/item in the note', () => {
    expect(heuristicParse('Netflix 16.99 monthly', context).description).toBe(
      'Netflix'
    );
    expect(
      heuristicParse('Groceries at Costco $84.20 yesterday', context)
        .description
    ).toBe('Groceries at Costco');
    expect(heuristicParse('45', context).description).toBe('45');
  });

  it('detects income and frequency', () => {
    expect(heuristicParse('salary 3,200 every month', context)).toMatchObject({
      kind: 'income',
      label: 'Salary',
      amount: 3200,
      frequency: 'monthly',
    });
  });
});

describe('rule-based insights', () => {
  it('flags overspending categories', () => {
    const insights = ruleBasedInsights(
      {
        totals: { income: 1000, expense: 1200, net: -200, savingsRatePct: -20 },
        budget: {
          target: 900,
          spent: 1200,
          projected: 1300,
          elapsedPct: 50,
          overBudget: [{ category: 'Dining', spent: 300, budget: 100 }],
        },
        incomeGoal: null,
        savingsGoals: [],
        categoryChanges: [],
        averageMonthlyNet: null,
      },
      (v) => `$${v}`
    );
    expect(insights.map((i) => i.title)).toEqual([
      'Spending exceeds income',
      'Dining is over budget',
    ]);
  });
});
