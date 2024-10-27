import Income from '../models/Income.js';
import logger from '../config/logger.js';

// Middleware to validate income data
export const validateIncome = (req, res, next) => {
  const { source, amount } = req.body;

  if (!source || !amount || isNaN(amount)) {
    logger.warn('Validation failed: Source and valid amount are required');
    return res
      .status(400)
      .json({ error: 'Source and valid amount are required.' });
  }

  next();
};

// Middleware to check for duplicate income
export const checkDuplicateIncome = async (req, res, next) => {
  const { source, amount, date, frequency } = req.body;

  try {
    const existingIncome = await Income.findOne({
      source,
      amount,
      date,
      frequency,
    });
    if (existingIncome) {
      logger.warn('Duplicate income detected');
      return res
        .status(409)
        .json({ error: 'Income with the same details already exists.' });
    }
    next();
  } catch (error) {
    logger.error('Error checking duplicate income:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};
