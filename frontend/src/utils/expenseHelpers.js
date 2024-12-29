import moment from 'moment-timezone';

/**
 * Format expense data by formatting dates and setting default frequency.
 * @param {Array<Object>} expenses - Array of expense objects.
 * @returns {Array<Object>} Formatted array of expense objects.
 */
export const formatExpenseData = (expenses) => {
  return expenses.map((expense) => ({
    ...expense,
    date: moment(expense.date).tz('America/Edmonton').format('YYYY-MM-DD'),
    frequency: expense.frequency || 'once',
    nextRecurrence: expense.nextRecurrence
      ? moment(expense.nextRecurrence)
          .tz('America/Edmonton')
          .format('YYYY-MM-DD')
      : null,
  }));
};

/**
 * Validate the expense data object.
 * @param {Object} data - The expense data to validate.
 * @param {string} data.category - The category of the expense.
 * @param {number} data.amount - The amount of the expense.
 * @throws {Error} Throws an error if validation fails.
 */
export const validateExpenseData = ({ category, amount }) => {
  if (!category || !amount || amount <= 0) {
    const errorMsg =
      'Validation failed: Category and positive amount are required.';
    console.warn(errorMsg);
    throw new Error(errorMsg);
  }
};

/**
 * Calculate the total expense amount for expenses up to the current date.
 * @param {Array<Object>} expenseData - Array of expense objects.
 * @returns {number} Total expense amount.
 * @throws {Error} Throws an error if expenseData is not an array.
 */
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

/**
 * Group expenses by category and sum their amounts.
 * (Usually called after expansions or if expansions are not needed.)
 * @param {Array<Object>} expenses - Array of expense objects.
 * @returns {Array<Object>} Array of grouped expense objects by category.
 */
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
        category: key,
        amount: 0,
        expenses: [],
      };
    }
    grouped[key].amount += expense.amount || 0;
    grouped[key].expenses.push(expense);
  });

  return Object.values(grouped);
};

/**
 * Format the next recurrence date to 'YYYY-MM-DD' or return null if not provided.
 * @param {string|Date|null} nextRecurrence - The next recurrence date.
 * @returns {string|null} Formatted next recurrence date or null.
 */
export const formatNextRecurrence = (nextRecurrence) => {
  if (!nextRecurrence) return null;
  return moment(nextRecurrence).tz('America/Edmonton').format('YYYY-MM-DD');
};

/**
 * Frequency constants for recurring expenses.
 * @enum {string}
 */
export const FREQUENCY = {
  ONCE: 'once',
  WEEKLY: 'weekly',
  BIWEEKLY: 'biweekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
};

/**
 * Returns the next date after `currentDate` based on the provided frequency.
 * @param {moment.Moment} currentDate - The current date as a moment object.
 * @param {string} frequency - Frequency for the recurrence.
 * @returns {moment.Moment} The next recurrence date as a moment object.
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
      throw new Error(`Invalid frequency type provided: ${frequency}`);
  }
};

/**
 * Generate ephemeral expansions for a single recurring expense that fall within [startDate, endDate].
 * @param {Object} expense - The expense object with fields: date, amount, frequency, skippedDates, etc.
 * @param {moment.Moment} startDate - Start of the timeframe.
 * @param {moment.Moment} endDate - End of the timeframe.
 * @returns {Array<Object>} Array of ephemeral expense instances (including the original date if in range).
 */
export const expandRecurringExpensesInInterval = (
  expense,
  startDate,
  endDate
) => {
  const expansions = [];
  const { frequency, skippedDates = [] } = expense;

  let current = moment(expense.date).tz('America/Edmonton').startOf('day');

  const skipped = skippedDates.map((d) =>
    moment(d).tz('America/Edmonton').format('YYYY-MM-DD')
  );

  const limit = endDate.clone().add(1, 'day').startOf('day');

  while (current.isSameOrBefore(limit)) {
    const currentStr = current.format('YYYY-MM-DD');

    if (
      !skipped.includes(currentStr) &&
      current.isBetween(startDate, endDate, null, '[]')
    ) {
      expansions.push({
        ...expense,
        date: currentStr,
      });
    }

    current = getNextDate(current, frequency);

    if (current.diff(startDate, 'years') > 5) {
      break;
    }
  }

  return expansions;
};

/**
 * Expand *all* expenses in the specified interval, including ephemeral expansions
 * for recurring expenses. For once-only expenses, we simply check if they fall in the range.
 * @param {Array<Object>} expenses - The raw array of expense documents from DB.
 * @param {moment.Moment} startDate
 * @param {moment.Moment} endDate
 * @returns {Array<Object>} The ephemeral expansions for all expenses that fall in [startDate, endDate].
 */
export const expandExpensesInInterval = (expenses, startDate, endDate) => {
  const allInInterval = [];

  expenses.forEach((expense) => {
    if (!expense.frequency || expense.frequency === FREQUENCY.ONCE) {
      const expenseDate = moment(expense.date).tz('America/Edmonton');
      if (expenseDate.isBetween(startDate, endDate, null, '[]')) {
        allInInterval.push(expense);
      }
    } else {
      const expansions = expandRecurringExpensesInInterval(
        expense,
        startDate,
        endDate
      );
      allInInterval.push(...expansions);
    }
  });

  return allInInterval;
};

/**
 * Calculate the *total* expense amount for a specified [startDate, endDate],
 * including ephemeral expansions of any recurring expenses that fall in that range.
 * @param {Array<Object>} expenses - The raw expense data from DB.
 * @param {moment.Moment} startDate
 * @param {moment.Moment} endDate
 * @returns {number} The total expense for the chosen timeframe.
 */
export const calculateTotalExpenseInInterval = (
  expenses,
  startDate,
  endDate
) => {
  if (!Array.isArray(expenses)) {
    throw new Error('Invalid data: expenses must be an array.');
  }
  const expansions = expandExpensesInInterval(expenses, startDate, endDate);

  return expansions.reduce((sum, exp) => sum + (exp.amount || 0), 0);
};

/**
 * Calculate the next recurrence date for a recurring expense, considering skipped dates
 * and ensuring that if the original date is in the future, we move to the recurrence *after* that date.
 * @param {Object} expense - The expense object.
 * @param {string} expense.date - The original date of the expense.
 * @param {string} expense.frequency - The frequency of the expense recurrence.
 * @param {Array<string>} [expense.skippedDates] - Dates to skip for recurrence.
 * @returns {Date|null} The next recurrence date or null if not applicable.
 */
export const calculateNextRecurrence = (expense) => {
  if (!expense.frequency || expense.frequency === FREQUENCY.ONCE) {
    return null;
  }

  let nextDate = moment(expense.date).tz('America/Edmonton').startOf('day');
  const today = moment().tz('America/Edmonton').startOf('day');
  const futureLimit = today.clone().add(5, 'years');

  if (nextDate.isSameOrAfter(today, 'day')) {
    nextDate = getNextDate(nextDate, expense.frequency);
  }

  const skippedDates = (expense.skippedDates || []).map((d) =>
    moment(d).tz('America/Edmonton').startOf('day').format('YYYY-MM-DD')
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

/**
 * Filter expenses based on a search query.
 * @param {Array<Object>} expenses - Array of expense objects.
 * @param {string} query - Search query string.
 * @returns {Array<Object>} Filtered array of expense objects.
 */
export const filterExpenses = (expenses, query) => {
  if (!query) return expenses;

  const keywords = query.toLowerCase().split(/\s+/);

  return expenses.filter((expense) =>
    keywords.every((keyword) => {
      const parsedKeyword = parseFloat(keyword);
      return (
        expense.category.toLowerCase().includes(keyword) ||
        expense.description?.toLowerCase().includes(keyword) ||
        (!isNaN(parsedKeyword) && expense.amount === parsedKeyword) ||
        expense.date.includes(keyword) ||
        (expense.frequency && expense.frequency.toLowerCase() === keyword)
      );
    })
  );
};

/**
 * Compare two values based on the field type.
 * @param {string} field - The field to compare.
 * @param {Object} a - First expense object.
 * @param {Object} b - Second expense object.
 * @returns {number} Comparison result.
 */
const compareValues = (field, a, b) => {
  let valueA = a[field];
  let valueB = b[field];

  if (field === 'amount') {
    return valueA - valueB;
  } else if (field === 'date') {
    return new Date(valueA) - new Date(valueB);
  } else if (field === 'category' || field === 'description') {
    return String(valueA)
      .toLowerCase()
      .localeCompare(String(valueB).toLowerCase());
  }
  return 0;
};

/**
 * Sort an array of expenses based on multiple fields and orders.
 * @param {Array<Object>} items - Array of expense objects to sort.
 * @param {Array<string>} fields - Fields to sort by.
 * @param {Array<string>} [orders=[]] - Sort orders ('asc' or 'desc') for each field.
 * @returns {Array<Object>} Sorted array of expenses.
 */
export const sortByFields = (items, fields, orders = []) => {
  return [...items].sort((a, b) => {
    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];
      const order = orders[i] || 'asc';
      const comparison = compareValues(field, a, b);
      if (comparison !== 0) {
        return order === 'asc' ? comparison : -comparison;
      }
    }
    return 0;
  });
};
