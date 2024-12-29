import moment from 'moment-timezone';

/**
 * Format income data by formatting dates and setting default frequency.
 * @param {Array<Object>} incomes - Array of income objects.
 * @returns {Array<Object>} Formatted array of income objects.
 */
export const formatIncomeData = (incomes) => {
  return incomes.map((income) => ({
    ...income,
    date: moment(income.date).tz('America/Edmonton').format('YYYY-MM-DD'),
    frequency: income.frequency || 'once',
    nextRecurrence: income.nextRecurrence
      ? moment(income.nextRecurrence)
          .tz('America/Edmonton')
          .format('YYYY-MM-DD')
      : null,
  }));
};

/**
 * Validate the income data object.
 * @param {Object} data - The income data to validate.
 * @param {string} data.source - The source of the income.
 * @param {number} data.amount - The amount of the income.
 * @throws {Error} Throws an error if validation fails.
 */
export const validateIncomeData = ({ source, amount }) => {
  if (!source || !amount || amount <= 0) {
    const errorMsg =
      'Validation failed: Source and positive amount are required.';
    console.warn(errorMsg);
    throw new Error(errorMsg);
  }
};

/**
 * Calculate the total income amount for incomes up to the current date.
 * @param {Array<Object>} incomeData - Array of income objects.
 * @returns {number} Total income amount.
 * @throws {Error} Throws an error if incomeData is not an array.
 */
export const calculateTotalIncome = (incomeData) => {
  if (!Array.isArray(incomeData)) {
    const errorMsg = 'Invalid data: Income data must be an array.';
    console.warn(errorMsg);
    throw new Error(errorMsg);
  }

  return incomeData.reduce((sum, income) => {
    const incomeDate = moment(income.date).tz('America/Edmonton').toDate();
    if (incomeDate <= new Date()) {
      return sum + (income.amount || 0);
    }
    return sum;
  }, 0);
};

/**
 * Group incomes by source and sum their amounts.
 * @param {Array<Object>} incomes - Array of income objects.
 * @returns {Array<Object>} Array of grouped income objects by source.
 * @throws {Error} Throws an error if incomes is not an array.
 */
export const groupIncomesBySource = (incomes) => {
  if (!Array.isArray(incomes)) {
    const errorMsg = 'Invalid data: Incomes must be an array.';
    console.warn(errorMsg);
    throw new Error(errorMsg);
  }

  const grouped = {};
  incomes.forEach((income) => {
    const key = income.source;
    if (!grouped[key]) {
      grouped[key] = {
        source: key,
        amount: 0,
        incomes: [],
      };
    }
    grouped[key].amount += income.amount || 0;
    grouped[key].incomes.push(income);
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
 * Frequency constants for recurring incomes.
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
      throw new Error(`Invalid frequency type provided: ${frequency}`);
  }
};

/**
 * Generate ephemeral expansions for a single recurring income that fall within [startDate, endDate].
 * @param {Object} income - The income object with fields: date, amount, frequency, skippedDates, etc.
 * @param {moment.Moment} startDate - Start of the timeframe.
 * @param {moment.Moment} endDate - End of the timeframe.
 * @returns {Array<Object>} Array of ephemeral income instances (including the original date if in range).
 */
export const expandRecurringIncomesInInterval = (
  income,
  startDate,
  endDate
) => {
  const expansions = [];
  const { frequency, skippedDates = [] } = income;

  let current = moment(income.date).tz('America/Edmonton').startOf('day');

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
        ...income,
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
 * Expand *all* incomes in the specified interval, including ephemeral expansions
 * for recurring incomes. For once-only incomes, we simply check if they fall in the range.
 * @param {Array<Object>} incomes - The raw array of income documents from DB.
 * @param {moment.Moment} startDate
 * @param {moment.Moment} endDate
 * @returns {Array<Object>} The ephemeral expansions for all incomes that fall in [startDate, endDate].
 */
export const expandIncomesInInterval = (incomes, startDate, endDate) => {
  const allInInterval = [];

  incomes.forEach((income) => {
    if (!income.frequency || income.frequency === FREQUENCY.ONCE) {
      const incomeDate = moment(income.date).tz('America/Edmonton');
      if (incomeDate.isBetween(startDate, endDate, null, '[]')) {
        allInInterval.push(income);
      }
    } else {
      const expansions = expandRecurringIncomesInInterval(
        income,
        startDate,
        endDate
      );
      allInInterval.push(...expansions);
    }
  });

  return allInInterval;
};

/**
 * Calculate the *total* income amount for a specified [startDate, endDate],
 * including ephemeral expansions of any recurring incomes that fall in that range.
 * @param {Array<Object>} incomes - The raw income data from DB.
 * @param {moment.Moment} startDate
 * @param {moment.Moment} endDate
 * @returns {number} The total income for the chosen timeframe.
 */
export const calculateTotalIncomeInInterval = (incomes, startDate, endDate) => {
  if (!Array.isArray(incomes)) {
    throw new Error('Invalid data: incomes must be an array.');
  }
  const expansions = expandIncomesInInterval(incomes, startDate, endDate);

  return expansions.reduce((sum, inc) => sum + (inc.amount || 0), 0);
};

/**
 * Calculate the next recurrence date for a recurring income, considering skipped dates
 * and ensuring that if the original date is in the future, we move to the recurrence *after* that date.
 * @param {Object} income - The income object.
 * @param {string} income.date - The original date of the income.
 * @param {string} income.frequency - The frequency of the income recurrence.
 * @param {Array<string>} [income.skippedDates] - Dates to skip for recurrence.
 * @returns {Date|null} The next recurrence date or null if not applicable.
 */
export const calculateNextRecurrence = (income) => {
  if (!income.frequency || income.frequency === FREQUENCY.ONCE) {
    return null;
  }

  let nextDate = moment(income.date).tz('America/Edmonton').startOf('day');
  const today = moment().tz('America/Edmonton').startOf('day');
  const futureLimit = today.clone().add(5, 'years');

  if (nextDate.isSameOrAfter(today, 'day')) {
    nextDate = getNextDate(nextDate, income.frequency);
  }

  const skippedDates = (income.skippedDates || []).map((d) =>
    moment(d).tz('America/Edmonton').startOf('day').format('YYYY-MM-DD')
  );

  while (
    nextDate.isSameOrBefore(today) ||
    skippedDates.includes(nextDate.format('YYYY-MM-DD'))
  ) {
    nextDate = getNextDate(nextDate, income.frequency);

    if (nextDate.isAfter(futureLimit)) {
      return null;
    }
  }

  return nextDate.toDate();
};

/**
 * Filter incomes based on a search query.
 * @param {Array<Object>} incomes - Array of income objects.
 * @param {string} query - Search query string.
 * @returns {Array<Object>} Filtered array of income objects.
 */
export const filterIncomes = (incomes, query) => {
  if (!query) return incomes;

  const keywords = query.toLowerCase().split(/\s+/);

  return incomes.filter((income) => {
    return keywords.every((keyword) => {
      const parsedKeyword = parseFloat(keyword);
      return (
        income.source.toLowerCase().includes(keyword) ||
        income.description?.toLowerCase().includes(keyword) ||
        (!isNaN(parsedKeyword) && income.amount === parsedKeyword) ||
        income.date.includes(keyword) ||
        (income.frequency && income.frequency.toLowerCase() === keyword)
      );
    });
  });
};

/**
 * Compare two values based on the field type.
 * @param {string} field - The field to compare.
 * @param {Object} a - First income object.
 * @param {Object} b - Second income object.
 * @returns {number} Comparison result.
 */
const compareValues = (field, a, b) => {
  let valueA = a[field];
  let valueB = b[field];

  if (field === 'amount') {
    return valueA - valueB;
  } else if (field === 'date') {
    return new Date(valueA) - new Date(valueB);
  } else if (field === 'source' || field === 'description') {
    return String(valueA)
      .toLowerCase()
      .localeCompare(String(valueB).toLowerCase());
  }
  return 0;
};

/**
 * Sort an array of incomes based on multiple fields and orders.
 * @param {Array<Object>} items - Array of income objects to sort.
 * @param {Array<string>} fields - Fields to sort by.
 * @param {Array<string>} [orders=[]] - Sort orders ('asc' or 'desc') for each field.
 * @returns {Array<Object>} Sorted array of incomes.
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
