import Expense from '../models/Expense.js';
import logger from '../config/logger.js';

// Frequency constants
export const FREQUENCY = {
  WEEKLY: 'weekly',
  BIWEEKLY: 'biweekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
};

// Helper function to generate the next date based on frequency
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
      throw new Error('Invalid frequency');
  }
  return nextDate;
};

// Auto-generate future recurring expenses
export const autoGenerateRecurringExpenses = async (expense) => {
  const { frequency, amount, category, description } = expense;
  const futureExpenses = [];
  let nextDate = getNextDate(expense.date, frequency);

  for (let i = 0; i < 12; i++) {
    futureExpenses.push({
      category: category,
      customCategory: expense.customCategory,
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
  } catch (err) {
    logger.error('Error generating future recurring expenses:', err.message);
  }
};
