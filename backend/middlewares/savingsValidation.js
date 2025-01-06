import logger from '../config/logger.js';

/**
 * For validating a single "Savings" doc that has title, targetAmount, etc.
 */
export const validateSavingsDoc = (req, res, next) => {
  const { title, targetAmount, currentAmount } = req.body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    const errorMsg =
      'Validation failed: Title is required and must be a string.';
    logger.warn(errorMsg);
    return res.status(400).json({ error: errorMsg });
  }

  const parsedTarget = parseFloat(targetAmount);
  if (isNaN(parsedTarget) || parsedTarget < 0) {
    const errorMsg =
      'Validation failed: targetAmount must be a non-negative number.';
    logger.warn(errorMsg);
    return res.status(400).json({ error: errorMsg });
  }

  if (currentAmount !== undefined) {
    const parsedCurrent = parseFloat(currentAmount);
    if (isNaN(parsedCurrent) || parsedCurrent < 0) {
      const errorMsg =
        'Validation failed: currentAmount must be a non-negative number.';
      logger.warn(errorMsg);
      return res.status(400).json({ error: errorMsg });
    }
  }

  next();
};
