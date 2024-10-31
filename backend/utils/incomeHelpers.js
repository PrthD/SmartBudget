import Income from '../models/Income.js';
import logger from '../config/logger.js';

// Frequency constants
export const FREQUENCY = {
  WEEKLY: 'weekly',
  BIWEEKLY: 'biweekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
};

/**
 * Calculate the next date based on the provided frequency.
 * @param {Date} currentDate - The current date.
 * @param {string} frequency - Frequency for the recurrence.
 * @returns {Date} The calculated next date.
 */
export const getNextDate = (currentDate, frequency) => {
  const nextDate = new Date(currentDate);

  switch (frequency) {
    case FREQUENCY.WEEKLY:
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case FREQUENCY.BIWEEKLY:
      nextDate.setDate(nextDate.getDate() + 14);
      break;
    case FREQUENCY.MONTHLY:
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case FREQUENCY.YEARLY:
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    default:
      throw new Error('Invalid frequency type provided.');
  }

  return nextDate;
};

/**
 * Generate future recurring incomes based on an initial income entry.
 * @param {Object} income - The income to base future entries on.
 * @param {number} recurrenceCount - Number of future occurrences (default: 12).
 */
export const autoGenerateRecurringIncomes = async (
  income,
  recurrenceCount = 12
) => {
  const { frequency, amount, source, description } = income;
  let nextDate = getNextDate(income.date, frequency);
  const futureIncomes = [];

  for (let i = 0; i < recurrenceCount; i++) {
    futureIncomes.push({
      source: source,
      amount: amount,
      date: nextDate,
      description: description,
      frequency: frequency,
      isOriginal: false,
      //   user: expense.user,
    });
    nextDate = getNextDate(nextDate, frequency);
  }

  try {
    await Income.insertMany(futureIncomes);
    logger.info(`Generated ${recurrenceCount} recurring incomes successfully.`);
  } catch (err) {
    logger.error('Error generating future recurring incomes:', err.message);
  }
};
