import logger from '../config/logger.js';

/**
 * Middleware to validate budget data before saving or updating.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
export const validateBudget = (req, res, next) => {
  const { totalBudget, categoryBudgets } = req.body;

  // Validate totalBudget if provided
  if (totalBudget !== undefined && (isNaN(totalBudget) || totalBudget < 0)) {
    const errorMsg = 'Total budget must be a non-negative number.';
    logger.warn(errorMsg);
    return res.status(400).json({ error: errorMsg });
  }

  // Validate each category budget if provided
  if (categoryBudgets) {
    for (const [category, budget] of Object.entries(categoryBudgets)) {
      if (isNaN(budget) || budget < 0) {
        const errorMsg = `Budget for category "${category}" must be a non-negative number.`;
        logger.warn(errorMsg);
        return res.status(400).json({ error: errorMsg });
      }
    }
  }

  next();
};
