import { minDate, todayIn } from '../../lib/civilDate.js';
import { periodRange } from '../../lib/periods.js';
import { decodeKeys } from '../../lib/mapKeys.js';
import { Budget, IncomeGoal } from '../../models/targets.js';
import { SavingsGoal } from '../../models/Savings.js';
import { loadAllEntries } from './data.js';
import {
  monthlyTrend,
  periodSummary,
  targetProgress,
  upcoming,
} from './engine.js';
import { serializeGoal } from '../savings/savings.service.js';

const latest = (Model, ctx) =>
  Model.findOne({ user: ctx.userId }).sort({ updatedAt: -1 }).lean();

/** Everything the dashboard needs, in one round trip. */
export async function getSummary(ctx, { interval, date }) {
  const today = todayIn(ctx.timezone);
  const refDate = date ?? today;

  const [{ incomes, expenses }, budget, incomeGoal, goals] = await Promise.all([
    loadAllEntries(ctx),
    latest(Budget, ctx),
    latest(IncomeGoal, ctx),
    SavingsGoal.find({ user: ctx.userId }).sort({ createdAt: 1 }).lean(),
  ]);

  const progressOf = (doc, mapField, entries) =>
    doc
      ? targetProgress(
          { interval: doc.interval, amounts: decodeKeys(doc[mapField]) },
          entries,
          refDate,
          today
        )
      : null;

  const savingsGoals = goals.map((goal) =>
    serializeGoal(goal, { timezone: ctx.timezone, today })
  );

  return {
    today,
    interval,
    ...periodSummary(incomes, expenses, interval, refDate, today),
    budget: progressOf(budget, 'categoryBudgets', expenses),
    incomeGoal: progressOf(incomeGoal, 'sourceGoals', incomes),
    savings: {
      saved: savingsGoals.reduce((acc, g) => acc + g.currentAmount, 0),
      target: savingsGoals.reduce((acc, g) => acc + g.targetAmount, 0),
      goals: savingsGoals,
    },
    // The 12 months ending with the selected period (e.g. Jan–Dec for a past
    // year), never past today.
    trend: monthlyTrend(
      incomes,
      expenses,
      minDate(periodRange(interval, refDate).end, today),
      today,
      12
    ),
    upcoming: upcoming([...incomes, ...expenses], today),
  };
}
