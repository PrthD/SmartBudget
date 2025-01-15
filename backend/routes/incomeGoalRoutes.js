import express from 'express';
import IncomeGoal from '../models/IncomeGoal.js';
import logger from '../config/logger.js';
import { validateIncomeGoal } from '../middlewares/incomeGoalValidation.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @route   GET /api/income-goal
 * @desc    Fetch the income goal for the logged-in user
 */
router.get('/', requireAuth, async (req, res) => {
  logger.info('GET /api/income-goal - Fetching income goal');
  try {
    const incomeGoal = await IncomeGoal.findOne({ user: req.userId });
    if (!incomeGoal) {
      logger.warn('No income goal found in the system');
      return res.status(404).json({ error: 'No income goal record found.' });
    }

    logger.info('Income goal fetched successfully');
    res.status(200).json(incomeGoal);
  } catch (err) {
    logger.error('Error fetching income goal:', err.message);
    res.status(500).json({ error: 'Failed to fetch income goal information.' });
  }
});

/**
 * @route   POST /api/income-goal
 * @desc    Create a new income goal
 */
router.post('/', requireAuth, validateIncomeGoal, async (req, res) => {
  logger.info('POST /api/income-goal - Creating new income goal');
  try {
    const { sourceGoals = {}, interval = 'monthly' } = req.body;

    const sumSourceGoals = Object.values(sourceGoals).reduce(
      (sum, val) => sum + val,
      0
    );

    const newIncomeGoal = new IncomeGoal({
      user: req.userId,
      totalGoal: sumSourceGoals,
      sourceGoals,
      interval,
    });

    const savedGoal = await newIncomeGoal.save();
    logger.info('New income goal created successfully:', savedGoal);

    res.status(201).json(savedGoal);
  } catch (err) {
    logger.error('Error creating income goal:', err.message);
    res.status(500).json({ error: 'Failed to create income goal' });
  }
});

/**
 * @route   PUT /api/income-goal/:id
 * @desc    Update an existing income goal
 */
router.put('/:id', requireAuth, validateIncomeGoal, async (req, res) => {
  logger.info(`PUT /api/income-goal/${req.params.id} - Updating income goal`);
  try {
    const { sourceGoals, interval } = req.body;

    const goalDoc = await IncomeGoal.findById(req.params.id);
    if (!goalDoc) {
      logger.warn(`Income goal not found for id: ${req.params.id}`);
      return res.status(404).json({ error: 'Income goal not found' });
    }

    if (goalDoc.user.toString() !== req.userId) {
      return res
        .status(403)
        .json({ error: 'Not authorized to edit this income goal' });
    }

    if (sourceGoals !== undefined) {
      goalDoc.sourceGoals = sourceGoals;
      const sumSourceGoals = Object.values(sourceGoals).reduce(
        (sum, val) => sum + val,
        0
      );
      goalDoc.totalGoal = sumSourceGoals;
    }

    if (interval !== undefined) {
      goalDoc.interval = interval;
    }

    const updatedGoal = await goalDoc.save();
    logger.info('Income goal updated successfully:', updatedGoal);

    res.status(200).json({
      message: 'Income goal updated successfully',
      updatedGoal,
    });
  } catch (err) {
    logger.error('Error updating income goal:', err.message);
    res.status(500).json({ error: 'Failed to update income goal' });
  }
});

/**
 * @route   DELETE /api/income-goal/:id
 * @desc    Permanently delete an existing income goal
 */
router.delete('/:id', requireAuth, async (req, res) => {
  logger.info(
    `DELETE /api/income-goal/${req.params.id} - Deleting income goal`
  );
  try {
    const goal = await IncomeGoal.findById(req.params.id);
    if (!goal) {
      logger.warn(`Income goal not found for id: ${req.params.id}`);
      return res.status(404).json({ error: 'Income goal not found' });
    }

    if (goal.user.toString() !== req.userId) {
      return res
        .status(403)
        .json({ error: 'Not authorized to delete this goal' });
    }

    const deletedGoal = await IncomeGoal.findByIdAndDelete(req.params.id);

    logger.info('Income goal deleted successfully:', deletedGoal);
    return res
      .status(200)
      .json({ message: 'Income goal deleted successfully' });
  } catch (err) {
    logger.error('Error deleting income goal:', err.message);
    return res.status(500).json({ error: 'Failed to delete income goal' });
  }
});

export default router;
