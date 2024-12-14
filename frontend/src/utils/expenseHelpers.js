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
 * @param {Array<Object>} expenses - Array of expense objects.
 * @returns {Array<Object>} Array of grouped expense objects by category.
 * @throws {Error} Throws an error if expenses is not an array.
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
 * Calculate the next date based on the provided frequency.
 * @param {moment.Moment} currentDate - The current date as a moment object.
 * @param {string} frequency - Frequency for the recurrence.
 * @returns {moment.Moment} The calculated next date as a moment object.
 * @throws {Error} Throws an error if an invalid frequency is provided.
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

/**
 * Filter expenses based on a search query.
 * @param {Array<Object>} expenses - Array of expense objects.
 * @param {string} query - Search query string.
 * @returns {Array<Object>} Filtered array of expense objects.
 */
export const filterExpenses = (expenses, query) => {
  if (!query) {
    return expenses;
  }

  const keywords = query.toLowerCase().split(/\s+/);

  return expenses.filter((expense) => {
    return keywords.every((keyword) => {
      const parsedKeyword = parseFloat(keyword);

      return (
        expense.category.toLowerCase().includes(keyword) ||
        expense.description?.toLowerCase().includes(keyword) ||
        (!isNaN(parsedKeyword) && expense.amount === parsedKeyword) ||
        expense.date.includes(keyword) ||
        (expense.frequency && expense.frequency.toLowerCase() === keyword)
      );
    });
  });
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
  } else {
    return 0;
  }
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

      let comparison = compareValues(field, a, b);
      if (comparison !== 0) {
        return order === 'asc' ? comparison : -comparison;
      }
    }
    return 0;
  });
};

/**
 * Calculate the category breakdown for budgets.
 * @param {Array} expenses - List of expenses.
 * @param {Object} categoryBudgets - Category budgets mapping.
 * @returns {Object} - Breakdown of spending and budgets by category.
 */
export const calculateCategoryBreakdown = (expenses, categoryBudgets) => {
  const breakdown = {};

  expenses.forEach((expense) => {
    if (!breakdown[expense.category]) {
      breakdown[expense.category] = {
        spent: 0,
        budget: categoryBudgets[expense.category] || 0,
      };
    }
    breakdown[expense.category].spent += expense.amount;
  });

  return breakdown;
};

/**
 * Get the color for the budget alert based on the percentage spent.
 * @param {number} percentage - Percentage of the budget spent.
 * @returns {string} - Color code for the alert.
 */
export const getBudgetAlertColor = (percentage) => {
  if (percentage < 75) return 'green';
  if (percentage < 90) return 'yellow';
  return 'red';
};
