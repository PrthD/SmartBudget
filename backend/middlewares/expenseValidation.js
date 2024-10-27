import Expense from '../models/Expense.js';
import logger from '../config/logger.js';

// Middleware to validate expense data
export const validateExpense = (req, res, next) => {
  const { category, amount } = req.body;

  if (!category || !amount || isNaN(amount)) {
    logger.warn('Validation failed: Category and valid amount are required');
    return res
      .status(400)
      .json({ error: 'Category and valid amount are required.' });
  }

  next();
};

// Middleware to check for duplicate expenses
export const checkDuplicateExpense = async (req, res, next) => {
  const { category, customCategory, amount, date, frequency } = req.body;

  try {
    const existingExpense = await Expense.findOne({
      category,
      customCategory,
      amount,
      date,
      frequency,
    });
    if (existingExpense) {
      logger.warn('Duplicate expense detected');
      return res
        .status(409)
        .json({ error: 'Expense with the same details already exists.' });
    }
    next();
  } catch (error) {
    logger.error('Error checking duplicate expense:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};
