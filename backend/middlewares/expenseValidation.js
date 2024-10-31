import Expense from '../models/Expense.js';
import logger from '../config/logger.js';

/**
 * Middleware to validate expense data before saving.
 * Ensures category and a valid numeric amount are provided.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const validateExpense = (req, res, next) => {
  const { category, amount } = req.body;

  if (!category || !amount || isNaN(amount)) {
    const errorMsg =
      'Validation failed: Category and valid amount are required';
    logger.warn(errorMsg);
    return res.status(400).json({ error: errorMsg });
  }

  next();
};

/**
 * Middleware to check for duplicate expense entries in the database.
 * Prevents creation of expenses with identical category, customCategory,
 * amount, date, and frequency fields.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const checkDuplicateExpense = async (req, res, next) => {
  const { category, customCategory, amount, date, frequency } = req.body;

  try {
    const normalizedDate = new Date(date);
    normalizedDate.setUTCHours(0, 0, 0, 0);

    const query = {
      amount: parseFloat(amount),
      date: normalizedDate,
      frequency,
    };

    if (customCategory) {
      query.category = category.trim();
      query.customCategory = true;
    } else {
      query.category = category.trim();
      query.customCategory = false;
    }

    const duplicateExpense = await Expense.findOne(query);

    if (duplicateExpense) {
      const errorMsg = 'Duplicate expense detected with matching details';
      logger.warn(errorMsg);
      return res.status(409).json({ error: errorMsg });
    }
    next();
  } catch (error) {
    logger.error('Error checking for duplicate expense:', error.message);
    res
      .status(500)
      .json({ error: 'Server error while checking for duplicates' });
  }
};
