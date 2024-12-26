import logger from '../config/logger.js';

/**
 * Middleware to validate income data before saving.
 * Ensures source, a valid numeric amount, and checks if
 * originalIncomeId is properly set for non-original incomes.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const validateIncome = (req, res, next) => {
  const { source, amount, date, isOriginal, originalIncomeId } = req.body;

  if (!source || !amount || isNaN(amount) || !date) {
    const errorMsg =
      'Validation failed: Source, date, and valid amount are required';
    logger.warn(errorMsg);
    return res.status(400).json({ error: errorMsg });
  }

  if (isOriginal === false && !originalIncomeId) {
    const errorMsg =
      'Validation failed: Non-original incomes must have an originalIncomeId';
    logger.warn(errorMsg);
    return res.status(400).json({ error: errorMsg });
  }

  next();
};
