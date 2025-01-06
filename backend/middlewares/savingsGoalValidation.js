import logger from '../config/logger.js';

/**
 * For validating the ratio-based "SavingsGoal" doc that has goalRatios, totalSegregated, etc.
 */
export const validateSavingsDistribution = (req, res, next) => {
  const { goalRatios, totalSegregated } = req.body;

  if (goalRatios && typeof goalRatios === 'object') {
    for (const [goalName, ratio] of Object.entries(goalRatios)) {
      const parsedRatio = parseFloat(ratio);
      if (isNaN(parsedRatio) || parsedRatio < 0) {
        const errorMsg = `Ratio for goal "${goalName}" must be a non-negative number.`;
        logger.warn(errorMsg);
        return res.status(400).json({ error: errorMsg });
      }
    }
  }

  if (totalSegregated !== undefined) {
    const parsedSegregated = parseFloat(totalSegregated);
    if (isNaN(parsedSegregated) || parsedSegregated < 0) {
      const errorMsg = 'totalSegregated must be a non-negative number.';
      logger.warn(errorMsg);
      return res.status(400).json({ error: errorMsg });
    }
  }

  next();
};
