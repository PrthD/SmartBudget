import Income from '../models/Income.js';
import logger from '../config/logger.js';

/**
 * Middleware to validate income data before saving.
 * Ensures source and a valid numeric amount are provided.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const validateIncome = (req, res, next) => {
  const { source, amount } = req.body;

  if (!source || !amount || isNaN(amount)) {
    const errorMsg = 'Validation failed: Source and valid amount are required';
    logger.warn(errorMsg);
    return res.status(400).json({ error: errorMsg });
  }

  next();
};

/**
 * Middleware to check for duplicate income entries in the database.
 * Prevents creation of incomes with identical source, amount, date, and frequency fields.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const checkDuplicateIncome = async (req, res, next) => {
  const { source, amount, date, frequency } = req.body;

  try {
    const normalizedDate = new Date(date);
    normalizedDate.setUTCHours(0, 0, 0, 0);

    const query = {
      source: source.trim(),
      amount: parseFloat(amount),
      date: normalizedDate,
      frequency,
    };

    const duplicateIncome = await Income.findOne(query);

    if (duplicateIncome) {
      const errorMsg = 'Duplicate income detected with matching details';
      logger.warn(errorMsg);
      return res.status(409).json({ error: errorMsg });
    }
    next();
  } catch (error) {
    logger.error('Error checking for duplicate income:', error.message);
    res
      .status(500)
      .json({ error: 'Server error while checking for duplicates' });
  }
};
