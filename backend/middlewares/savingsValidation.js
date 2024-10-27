import Savings from '../models/Savings.js';
import logger from '../config/logger.js';

// Middleware to validate savings goal data
export const validateSavingsGoal = (req, res, next) => {
  const { title, targetAmount } = req.body;

  if (!title || !targetAmount || isNaN(targetAmount)) {
    logger.warn(
      'Validation failed: Title and valid target amount are required'
    );
    return res
      .status(400)
      .json({ error: 'Title and valid target amount are required.' });
  }

  next();
};

// Middleware to check for duplicate savings goal
export const checkDuplicateGoal = async (req, res, next) => {
  const { title, targetAmount, deadline } = req.body;

  try {
    const existingGoal = await Savings.findOne({
      title,
      targetAmount,
      deadline,
    });
    if (existingGoal) {
      logger.warn('Duplicate goal detected');
      return res
        .status(409)
        .json({ error: 'Goal with the same details already exists.' });
    }
    next();
  } catch (error) {
    logger.error('Error checking duplicate goal:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};
