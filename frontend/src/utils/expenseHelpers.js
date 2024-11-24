import moment from 'moment-timezone';

// Validate expense form data
export const validateExpenseData = ({ category, amount }) => {
  if (!category || !amount || amount <= 0) {
    const errorMsg =
      'Validation failed: Category and positive amount are required.';
    console.warn(errorMsg);
    throw new Error(errorMsg);
  }
};

export const formatNextRecurrence = (nextRecurrence) => {
  if (!nextRecurrence) return null;
  return moment(nextRecurrence).tz('America/Edmonton').format('YYYY-MM-DD');
};

// Calculate total expense
export const calculateTotalExpense = (expenseData) => {
  if (!Array.isArray(expenseData)) {
    const errorMsg = 'Invalid data: Expense data must be an array.';
    console.warn(errorMsg);
    throw new Error(errorMsg);
  }

  return expenseData.reduce((sum, expense) => {
    const expenseDate = moment(expense.date).tz('America/Edmonton').toDate();
    if (expenseDate <= new Date()) {
      return sum + (expense.amount || 0);
    }
    return sum;
  }, 0);
};

// Group expenses by category
export const groupExpensesByCategory = (expenses) => {
  if (!Array.isArray(expenses)) {
    const errorMsg = 'Invalid data: Expenses must be an array.';
    console.warn(errorMsg);
    throw new Error(errorMsg);
  }

  const grouped = {};

  expenses.forEach((expense) => {
    const key = expense.category;

    if (!grouped[key]) {
      grouped[key] = {
        category: expense.category,
        amount: 0,
        expenses: [],
      };
    }

    grouped[key].amount += expense.amount || 0;
    grouped[key].expenses.push(expense);
  });

  return Object.values(grouped);
};

// Frequency constants
export const FREQUENCY = {
  ONCE: 'once',
  WEEKLY: 'weekly',
  BIWEEKLY: 'biweekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
};

/**
 * Calculate the next date based on the provided frequency.
 * @param {moment.Moment} currentDate - The current date as a moment object.
 * @param {string} frequency - Frequency for the recurrence.
 * @returns {moment.Moment} The calculated next date as a moment object.
 */
export const getNextDate = (currentDate, frequency) => {
  switch (frequency) {
    case FREQUENCY.WEEKLY:
      return currentDate.clone().add(1, 'week');
    case FREQUENCY.BIWEEKLY:
      return currentDate.clone().add(2, 'weeks');
    case FREQUENCY.MONTHLY:
      return currentDate.clone().add(1, 'month');
    case FREQUENCY.YEARLY:
      return currentDate.clone().add(1, 'year');
    default:
      throw new Error('Invalid frequency type provided.');
  }
};

/**
 * Calculate the next recurrence date for a recurring expense, considering skipped dates.
 * @param {Object} expense - The expense object.
 * @returns {Date|null} The next recurrence date or null if not applicable.
 */
export const calculateNextRecurrence = (expense) => {
  if (!expense.frequency || expense.frequency === FREQUENCY.ONCE) {
    return null;
  }

  let nextDate = moment(expense.date).tz('America/Edmonton').startOf('day');
  const today = moment().tz('America/Edmonton').startOf('day');
  const futureLimit = today.clone().add(5, 'years');

  const skippedDates = (expense.skippedDates || []).map((date) =>
    moment(date).tz('America/Edmonton').startOf('day').format('YYYY-MM-DD')
  );

  while (
    nextDate.isSameOrBefore(today) ||
    skippedDates.includes(nextDate.format('YYYY-MM-DD'))
  ) {
    nextDate = getNextDate(nextDate, expense.frequency);
    if (nextDate.isAfter(futureLimit)) {
      return null;
    }
  }

  return nextDate.toDate();
};
