import { round2 } from '../../lib/money.js';

const pctChange = (current, previous) =>
  previous > 0 ? Math.round(((current - previous) / previous) * 100) : null;
// Percentages are whole numbers: the model echoes whatever precision it gets.
const pct = (value) =>
  value === null || value === undefined ? null : Math.round(value);

/**
 * Condenses an analytics summary into the small, anonymous fact sheet that
 * insights are generated from. Contains no names, emails or free-text
 * descriptions — only category/source/goal labels and numbers.
 */
export function buildFacts(summary, currency) {
  const { current, previous, budget, incomeGoal, savings, upcoming, trend } =
    summary;

  const previousByCategory = new Map(
    previous.byCategory.map((c) => [c.name, c.amount])
  );
  const categoryChanges = current.byCategory
    .map((c) => ({
      category: c.name,
      amount: c.amount,
      previous: previousByCategory.get(c.name) ?? 0,
      changePct: pctChange(c.amount, previousByCategory.get(c.name) ?? 0),
    }))
    .slice(0, 8);

  const recentNets = trend.slice(-4, -1).map((m) => m.net);
  const averageMonthlyNet = recentNets.length
    ? round2(recentNets.reduce((a, b) => a + b, 0) / recentNets.length)
    : null;

  return {
    currency,
    period: {
      start: current.range.start,
      end: current.range.end,
      today: summary.today,
    },
    totals: {
      // Actual so far this period…
      income: current.income,
      expense: current.expense,
      net: current.net,
      savingsRatePct: pct(current.savingsRate),
      // …plus what is still scheduled before it ends (e.g. a later payday),
      // so a "negative so far" period isn't misread.
      scheduledIncome: current.scheduled.income,
      scheduledExpense: current.scheduled.expense,
      projectedNet: round2(
        current.net + current.scheduled.income - current.scheduled.expense
      ),
      // Compared with the same point of the previous period.
      expenseChangePct: pctChange(current.expense, previous.expense),
      incomeChangePct: pctChange(current.income, previous.income),
    },
    previousTotals: {
      income: previous.income,
      expense: previous.expense,
      net: previous.net,
    },
    categoryChanges,
    budget: budget && {
      interval: budget.interval,
      target: budget.target,
      spent: budget.actual,
      projected: budget.projected,
      elapsedPct: pct(budget.elapsed * 100),
      overBudget: budget.items
        .filter((i) => i.target > 0 && i.actual > i.target)
        .map((i) => ({ category: i.name, spent: i.actual, budget: i.target })),
      unbudgetedSpend: round2(
        budget.items
          .filter((i) => i.target === 0)
          .reduce((acc, i) => acc + i.actual, 0)
      ),
    },
    incomeGoal: incomeGoal && {
      interval: incomeGoal.interval,
      target: incomeGoal.target,
      earned: incomeGoal.actual,
      elapsedPct: pct(incomeGoal.elapsed * 100),
    },
    savingsGoals: savings.goals.slice(0, 6).map((g) => ({
      goal: g.title,
      percent: pct(g.percent),
      remaining: g.remaining,
      deadline: g.deadline,
      monthlyNeeded: g.monthlyNeeded,
      overdue: g.overdue,
    })),
    averageMonthlyNet,
    upcomingBills: upcoming
      .filter((u) => u.kind === 'expense')
      .slice(0, 5)
      .map((u) => ({ label: u.label, amount: u.amount, date: u.date })),
  };
}
