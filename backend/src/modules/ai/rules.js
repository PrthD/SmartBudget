/**
 * Deterministic insights computed from the fact sheet. Always available, and
 * the baseline the AI report builds on (and falls back to).
 */
export function ruleBasedInsights(facts, formatMoney) {
  const insights = [];
  const { totals, budget, incomeGoal, savingsGoals, categoryChanges } = facts;

  if (totals.income > 0 && totals.net < 0) {
    insights.push({
      tone: 'warning',
      title: 'Spending exceeds income',
      detail: `You're ${formatMoney(-totals.net)} in the red this period.`,
    });
  } else if (totals.savingsRatePct !== null && totals.savingsRatePct >= 20) {
    insights.push({
      tone: 'positive',
      title: 'Strong savings rate',
      detail: `You're saving ${Math.round(totals.savingsRatePct)}% of your income this period.`,
    });
  }

  if (budget) {
    if (budget.overBudget.length) {
      const worst = [...budget.overBudget].sort(
        (a, b) => b.spent - b.budget - (a.spent - a.budget)
      )[0];
      insights.push({
        tone: 'warning',
        title: `${worst.category} is over budget`,
        detail: `Spent ${formatMoney(worst.spent)} of a ${formatMoney(worst.budget)} budget.`,
      });
    } else if (budget.projected > budget.target && budget.elapsedPct < 100) {
      insights.push({
        tone: 'warning',
        title: 'On track to overspend',
        detail: `At this pace you'll spend about ${formatMoney(budget.projected)} against a ${formatMoney(budget.target)} budget.`,
      });
    } else if (budget.target > 0) {
      insights.push({
        tone: 'positive',
        title: 'Budget on track',
        detail: `${formatMoney(budget.spent)} spent of ${formatMoney(budget.target)} with ${Math.round(100 - budget.elapsedPct)}% of the period left.`,
      });
    }
  }

  const jump = categoryChanges
    .filter(
      (c) =>
        c.changePct !== null && c.changePct >= 25 && c.amount - c.previous >= 20
    )
    .sort((a, b) => b.amount - b.previous - (a.amount - a.previous))[0];
  if (jump) {
    insights.push({
      tone: 'info',
      title: `${jump.category} spending is up ${Math.round(jump.changePct)}%`,
      detail: `${formatMoney(jump.amount)} this period vs ${formatMoney(jump.previous)} last period.`,
    });
  }

  if (
    incomeGoal &&
    incomeGoal.target > 0 &&
    incomeGoal.earned >= incomeGoal.target
  ) {
    insights.push({
      tone: 'positive',
      title: 'Income goal reached',
      detail: `You've earned ${formatMoney(incomeGoal.earned)} against a ${formatMoney(incomeGoal.target)} goal.`,
    });
  }

  const behind = savingsGoals.find(
    (g) =>
      g.overdue ||
      (g.monthlyNeeded &&
        facts.averageMonthlyNet !== null &&
        g.monthlyNeeded > facts.averageMonthlyNet)
  );
  if (behind) {
    insights.push({
      tone: 'warning',
      title: behind.overdue
        ? `"${behind.goal}" is past its deadline`
        : `"${behind.goal}" needs a faster pace`,
      detail: behind.overdue
        ? `${formatMoney(behind.remaining)} still to go.`
        : `It needs ${formatMoney(behind.monthlyNeeded)}/month to hit its deadline.`,
    });
  }

  return insights.slice(0, 5);
}
