import moment from 'moment-timezone';

/**
 * Return [startMoment, endMoment] for the chosen interval (weekly, etc.).
 */
export const getSavingsTimeframe = (interval) => {
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
 * Return color based on how far along you are in your ratio or goal, etc.
 */
export const getGoalAlertColor = (percentage) => {
  if (percentage < 50) return 'red';
  if (percentage < 80) return 'yellow';
  return 'green';
};

/**
 * Validate that each ratio is non-negative and sum > 0.
 */
export const validateRatios = (ratios) => {
  if (!ratios || typeof ratios !== 'object') return false;
  let sum = 0;
  for (const val of Object.values(ratios)) {
    if (typeof val !== 'number' || val < 0 || Number.isNaN(val)) {
      return false;
    }
    sum += val;
  }
  return sum > 0;
};

/**
 * Convert string-based ratio values to floats and default to 0 if empty.
 * Also returns the sum of the ratio values.
 * @param {Object} inputRatios - { [goalName]: string|number }
 * @returns { [cleanRatios: object, sum: number] }
 */
export const sanitizeAndSumRatios = (inputRatios) => {
  const cleaned = {};
  let sum = 0;
  for (const [title, val] of Object.entries(inputRatios)) {
    const parsed = parseFloat(val) || 0;
    cleaned[title] = parsed < 0 ? 0 : parsed;
    sum += cleaned[title];
  }
  return [cleaned, sum];
};

/**
 * Sort function for sub-goals:
 * 1. Goals with a deadline come first (ascending by deadline).
 * 2. Goals without a deadline come after, alphabetical by name.
 *
 * @param {Array<Object>} goals - Array of objects, each { name, deadline, ratio }
 * @returns {Array<Object>} The sorted array of goal objects
 */
export const sortGoalsByDeadlineThenName = (goals) => {
  return [...goals].sort((a, b) => {
    const hasDeadlineA = !!a.deadline;
    const hasDeadlineB = !!b.deadline;

    if (hasDeadlineA && !hasDeadlineB) return -1;
    if (!hasDeadlineA && hasDeadlineB) return 1;

    if (hasDeadlineA && hasDeadlineB) {
      const dateA = new Date(a.deadline);
      const dateB = new Date(b.deadline);
      return dateA - dateB;
    }

    return a.name.localeCompare(b.name);
  });
};

/**
 * 'interval' list to show them in a dropdown.
 */
export const SAVINGS_INTERVALS = ['weekly', 'biweekly', 'monthly', 'yearly'];
