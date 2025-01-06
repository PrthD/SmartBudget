import express from 'express';
import SavingsGoal from '../models/SavingsGoal.js';
import logger from '../config/logger.js';
import { validateSavingsDistribution } from '../middlewares/savingsGoalValidation.js';

const router = express.Router();

/**
 * @route   GET /api/savings-goal
 * @desc    Fetch the savings distribution doc for the logged-in user
 */
router.get('/', async (req, res, _next) => {
  logger.info('GET /api/savings-goal - Fetching savings distribution doc');
  try {
    // const userId = req.user._id;
    // const savingsGoal = await SavingsGoal.findOne({ user: userId });

    const doc = await SavingsGoal.findOne();
    if (!doc) {
      logger.warn('No savings distribution doc found');
      return res.status(404).json({ error: 'No savings distribution found.' });
    }
    logger.info('Savings distribution doc fetched successfully');
    return res.status(200).json(doc);
  } catch (err) {
    logger.error('Error fetching savings distribution:', err.message);
    return res.status(500).json({ error: 'Failed to fetch distribution doc.' });
  }
});

/**
 * @route   POST /api/savings-goal
 * @desc    Create a new savings distribution doc
 */
router.post('/', validateSavingsDistribution, async (req, res, _next) => {
  logger.info('POST /api/savings-goal - Creating new savings distribution doc');
  try {
    const { goalRatios = {}, interval = 'monthly' } = req.body;
    const sumRatios = Object.values(goalRatios).reduce((a, b) => a + b, 0);
    if (sumRatios === 0) {
      return res.status(400).json({ error: 'Total ratio cannot be 0.' });
    }

    const doc = new SavingsGoal({
      totalSegregated: 0,
      goalRatios,
      interval,
    });
    const savedDoc = await doc.save();
    logger.info('New savings distribution doc created:', savedDoc);
    return res.status(201).json(savedDoc);
  } catch (err) {
    logger.error('Error creating distribution doc:', err.message);
    return res.status(500).json({ error: 'Failed to create distribution doc' });
  }
});

/**
 * @route   PUT /api/savings-goal/:id
 * @desc    Update existing savings Distribution doc
 */
router.put('/:id', validateSavingsDistribution, async (req, res, _next) => {
  logger.info(
    `PUT /api/savings-goal/${req.params.id} - Updating savings Distribution doc`
  );
  try {
    const { goalRatios, interval, totalSegregated } = req.body;
    const doc = await SavingsGoal.findById(req.params.id);
    if (!doc) {
      logger.warn(
        `Savings distribution doc not found for id: ${req.params.id}`
      );
      return res.status(404).json({ error: 'Distribution doc not found.' });
    }

    if (goalRatios !== undefined) {
      const sumRatios = Object.values(goalRatios).reduce((a, b) => a + b, 0);
      if (sumRatios <= 0) {
        return res.status(400).json({ error: 'Total ratio must be > 0' });
      }
      doc.goalRatios = goalRatios;
    }
    if (interval !== undefined) {
      doc.interval = interval;
    }
    if (totalSegregated !== undefined) {
      doc.totalSegregated = parseFloat(totalSegregated) || 0;
    }

    const updated = await doc.save();
    logger.info('Distribution doc updated successfully:', updated);
    return res
      .status(200)
      .json({ message: 'Updated successfully', updatedGoal: updated });
  } catch (err) {
    logger.error('Error updating distribution doc:', err.message);
    return res.status(500).json({ error: 'Failed to update distribution doc' });
  }
});

/**
 * @route   DELETE /api/savings-goal/:id
 * @desc    Permanently delete the user's savings distribution doc
 */
router.delete('/:id', async (req, res, _next) => {
  logger.info(
    `DELETE /api/savings-goal/${req.params.id} - Deleting a savings distribution doc`
  );
  try {
    const doc = await SavingsGoal.findByIdAndDelete(req.params.id);
    if (!doc) {
      logger.warn(`Distribution doc not found for id: ${req.params.id}`);
      return res.status(404).json({ error: 'Distribution doc not found' });
    }
    logger.info('Distribution doc deleted successfully:', doc);
    return res
      .status(200)
      .json({ message: 'Distribution doc deleted successfully' });
  } catch (err) {
    logger.error('Error deleting doc:', err.message);
    return res.status(500).json({ error: 'Failed to delete distribution doc' });
  }
});

export default router;
