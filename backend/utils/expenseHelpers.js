import Expense from '../models/Expense.js';
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
 * Generate future recurring expenses based on an initial expense entry.
 * @param {Object} expense - The expense to base future entries on.
 * @param {number} recurrenceCount - Number of future occurrences (default: 12).
 */
export const autoGenerateRecurringExpenses = async (
  expense,
  recurrenceCount = 12
) => {
  const { frequency, amount, category, customCategory, description } = expense;
  let nextDate = getNextDate(expense.date, frequency);
  const futureExpenses = [];

  for (let i = 0; i < recurrenceCount; i++) {
    futureExpenses.push({
      category: category,
      customCategory: customCategory || false,
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
    await Expense.insertMany(futureExpenses);
    logger.info(
      `Generated ${recurrenceCount} recurring expenses successfully.`
    );
  } catch (err) {
    logger.error('Error generating future recurring expenses:', err.message);
  }
};
