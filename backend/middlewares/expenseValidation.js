import logger from '../config/logger.js';

/**
 * Middleware to validate expense data before saving.
 * Ensures category, a valid numeric amount, and checks if
 * originalExpenseId is properly set for non-original expenses.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const validateExpense = (req, res, next) => {
  const { category, amount, date, isOriginal, originalExpenseId } = req.body;

  if (!category || !amount || isNaN(amount) || !date) {
    const errorMsg =
      'Validation failed: Category, date, and valid amount are required';
    logger.warn(errorMsg);
    return res.status(400).json({ error: errorMsg });
  }

  if (isOriginal === false && !originalExpenseId) {
    const errorMsg =
      'Validation failed: Non-original expenses must have an originalExpenseId';
    logger.warn(errorMsg);
    return res.status(400).json({ error: errorMsg });
  }

  next();
};
