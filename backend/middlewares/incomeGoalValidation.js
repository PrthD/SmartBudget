import logger from '../config/logger.js';

/**
 * Middleware to validate income goal data before saving or updating.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
export const validateIncomeGoal = (req, res, next) => {
  const { totalGoal, sourceGoals } = req.body;

  // Validate totalGoal if provided
  if (totalGoal !== undefined && (isNaN(totalGoal) || totalGoal < 0)) {
    const errorMsg = 'Total goal must be a non-negative number.';
    logger.warn(errorMsg);
    return res.status(400).json({ error: errorMsg });
  }

  // Validate each source goal if provided
  if (sourceGoals) {
    for (const [source, goal] of Object.entries(sourceGoals)) {
      if (goal === undefined || isNaN(goal) || goal < 0) {
        const errorMsg = `Goal for source "${source}" must be a non-negative number.`;
        logger.warn(errorMsg, { source, goal });
        return res.status(400).json({ error: errorMsg });
      }
    }
  }

  next();
};
