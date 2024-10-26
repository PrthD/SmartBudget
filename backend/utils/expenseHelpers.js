import Expense from '../models/Expense.js';

// Helper function to generate the next date based on frequency
export const getNextDate = (currentDate, frequency) => {
  const nextDate = new Date(currentDate);
  switch (frequency) {
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'biweekly':
      nextDate.setDate(nextDate.getDate() + 14);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    default:
      break;
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
    console.error('Error generating future recurring expenses:', err.message);
  }
};
