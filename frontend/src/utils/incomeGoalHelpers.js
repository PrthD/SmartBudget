import moment from 'moment-timezone';
import { groupIncomesBySource } from '../utils/incomeHelpers';

/**
 * Calculate the breakdown of income vs. goals by source.
 * @param {Array} incomes - List of income objects (with `source` and `amount`).
 * @param {Object} sourceGoals - { [sourceName]: number } from the DB.
 * @returns {Object} - { [sourceName]: { earned: number, goal: number } }.
 */
export const calculateSourceBreakdown = (incomes, sourceGoals) => {
  const breakdown = {};

  incomes.forEach((income) => {
    if (!breakdown[income.source]) {
      breakdown[income.source] = {
        earned: 0,
        goal: sourceGoals[income.source] || 0,
      };
    }
    breakdown[income.source].earned += income.amount;
  });

  return breakdown;
};

/**
 * Get the color for the "goal alert" based on the percentage of income goal achieved.
 * @param {number} percentage - Percentage of the income goal achieved.
 * @returns {string} - Color code for the alert (red, yellow, green).
 */
export const getGoalAlertColor = (percentage) => {
  if (percentage < 50) return 'red';
  if (percentage < 80) return 'yellow';
  return 'green';
};

/**
 * Return [startMoment, endMoment] for the chosen interval (weekly, biweekly, etc.),
 * @param {string} interval - One of "weekly", "biweekly", "monthly", or "yearly".
 * @returns {[moment.Moment, moment.Moment]} - The start and end dates as moment objects.
 */
export const getTimeframeDates = (interval) => {
  const now = moment.tz('America/Edmonton');
  let start;
  let end;

  switch (interval) {
    case 'weekly':
      start = now.clone().startOf('week');
      end = now.clone().endOf('week');
      break;
    case 'biweekly':
      start = now.clone().startOf('week');
      end = start.clone().add(2, 'weeks').endOf('day');
      break;
    case 'yearly':
      start = now.clone().startOf('year');
      end = now.clone().endOf('year');
      break;
    default:
      // monthly
      start = now.clone().startOf('month');
      end = now.clone().endOf('month');
  }

  return [start, end];
};

/**
 * Merges the `sourceGoals` object with any sources found in incomes,
 * ensuring each known source has at least a 0 goal if not present.
 * @param {Object} sourceGoals - Existing { [sourceName]: number } from DB.
 * @param {Array} incomes - List of income objects, each with a `source`.
 * @returns {Object} - Combined { [sourceName]: number } with all needed keys.
 */
export const mergeSourceGoals = (sourceGoals, incomes) => {
  const grouped = groupIncomesBySource(incomes);
  const combined = { ...sourceGoals };

  grouped.forEach(({ source }) => {
    if (!(source in combined)) {
      combined[source] = 0;
    }
  });

  return combined;
};

/**
 * Sorts source names by:
 * 1) DB sources (not newly added) by earliest createdAt date
 * 2) Newly added sources - alphabetical
 *
 * @param {Object} goals - The { sourceName: goalValue } map.
 * @param {Array} newlyAddedSources - Sources explicitly added in the modal session.
 * @param {Object} sourceCreatedAtMap - { [sourceName]: earliestCreationDateString }.
 *
 * @returns {Array<string>} - Sorted list of source names.
 */
export const sortSourceGoals = (
  goals,
  newlyAddedSources = [],
  sourceCreatedAtMap = {}
) => {
  const allSources = Object.keys(goals);

  const dbSources = allSources.filter(
    (src) => !newlyAddedSources.includes(src)
  );

  dbSources.sort((a, b) => {
    const dateA = new Date(sourceCreatedAtMap[a] || '2999-01-01');
    const dateB = new Date(sourceCreatedAtMap[b] || '2999-01-01');
    return dateA - dateB;
  });

  const newSources = newlyAddedSources.filter((src) =>
    allSources.includes(src)
  );
  newSources.sort((a, b) => a.localeCompare(b));

  return [...dbSources, ...newSources];
};

// Helper to build a unique key for GoalCard alerts
export function getGoalAlertKey(interval, totalIncome, totalGoal) {
  const incomeRounded = Math.round(totalIncome);
  const goalRounded = Math.round(totalGoal);

  return `goalAlert-${interval}-income=${incomeRounded}-goal=${goalRounded}`;
}
