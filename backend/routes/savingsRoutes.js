import express from 'express';
import Savings from '../models/Savings.js';
import logger from '../config/logger.js';
import { validateSavingsDoc } from '../middlewares/savingsValidation.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import moment from 'moment-timezone';

const router = express.Router();

// @route    POST /api/savings
// @desc     Add a new savings doc
router.post('/', requireAuth, validateSavingsDoc, async (req, res, _next) => {
  logger.info('POST /api/savings - Adding a new savings doc');
  try {
    const { title, targetAmount, currentAmount, deadline, description } =
      req.body;

    const newGoal = new Savings({
      user: req.userId,
      title,
      targetAmount: parseFloat(targetAmount),
      currentAmount: currentAmount ? parseFloat(currentAmount) : 0,
      deadline: deadline
        ? moment.tz(deadline, 'America/Edmonton').utc().toDate()
        : null,
      description: description?.trim() || '',
    });

    const savedGoal = await newGoal.save();
    logger.info('New savings doc saved successfully:', savedGoal);
    return res.status(201).json(savedGoal);
  } catch (err) {
    logger.error('Error saving new savings doc:', err.message);
    return res.status(500).json({ error: err.message || 'Server Error' });
  }
});

// @route    GET /api/savings
// @desc     Get all savings docs
router.get('/', requireAuth, async (req, res, _next) => {
  logger.info('GET /api/savings - Retrieving all savings docs');
  try {
    const goals = await Savings.find({ user: req.userId });
    logger.info('All savings docs retrieved successfully');
    return res.status(200).json(goals);
  } catch (err) {
    logger.error('Error retrieving savings docs:', err.message);
    return res.status(500).json({ error: 'Failed to fetch savings docs' });
  }
});

// @route    PUT /api/savings/:id
// @desc     Update an existing savings doc
router.put('/:id', requireAuth, validateSavingsDoc, async (req, res, _next) => {
  logger.info(`PUT /api/savings/${req.params.id} - Updating a savings doc`);
  try {
    const { id } = req.params;
    const { title, targetAmount, currentAmount, deadline, description } =
      req.body;

    const goal = await Savings.findById(id);
    if (!goal) {
      logger.warn(`Savings doc not found for id: ${id}`);
      return res.status(404).json({ error: 'Savings doc not found' });
    }

    if (goal.user.toString() !== req.userId) {
      return res
        .status(403)
        .json({ error: 'Not authorized to edit this savings doc' });
    }

    if (title !== undefined) goal.title = title.trim();
    if (targetAmount !== undefined)
      goal.targetAmount = parseFloat(targetAmount);
    if (currentAmount !== undefined)
      goal.currentAmount = parseFloat(currentAmount);

    if (deadline !== undefined) {
      goal.deadline = deadline
        ? moment.tz(deadline, 'America/Edmonton').utc().toDate()
        : null;
    }
    if (description !== undefined) {
      goal.description = description.trim();
    }

    const updatedGoal = await goal.save();
    logger.info('Savings doc updated successfully:', updatedGoal);
    return res.status(200).json(updatedGoal);
  } catch (err) {
    logger.error('Error updating savings doc:', err.message);
    return res.status(500).json({ error: 'Failed to update savings doc' });
  }
});

// @route    DELETE /api/savings/:id
// @desc     Delete a savings doc by ID
router.delete('/:id', requireAuth, async (req, res, _next) => {
  logger.info(`DELETE /api/savings/${req.params.id} - Deleting a savings doc`);
  try {
    const { id } = req.params;
    const goal = await Savings.findById(id);
    if (!goal) {
      logger.warn(`Savings doc not found for id: ${id}`);
      return res.status(404).json({ error: 'Savings doc not found' });
    }

    if (goal.user.toString() !== req.userId) {
      return res
        .status(403)
        .json({ error: 'Not authorized to delete this doc' });
    }

    const deletedGoal = await Savings.findByIdAndDelete(id);

    logger.info('Savings doc deleted successfully:', deletedGoal);
    return res
      .status(200)
      .json({ message: 'Savings doc deleted successfully' });
  } catch (err) {
    logger.error('Error deleting savings doc:', err.message);
    return res.status(500).json({ error: 'Failed to delete savings doc' });
  }
});

export default router;
