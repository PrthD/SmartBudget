import express from 'express';
import Savings from '../models/Savings.js';
import logger from '../config/logger.js';
import {
  validateSavingsGoal,
  checkDuplicateGoal,
} from '../middlewares/savingsValidation.js';

const router = express.Router();

// @route   POST /api/savings
// @desc    Add a new savings goal
router.post('/', validateSavingsGoal, checkDuplicateGoal, async (req, res) => {
  logger.info('POST /api/savings request received');
  const { title, targetAmount, deadline } = req.body;

  try {
    const newGoal = new Savings({
      title,
      targetAmount,
      currentAmount: 0, // Initialize with 0 savings, update later
      deadline: deadline ? new Date(deadline) : null,
    });

    const savedGoal = await newGoal.save();
    logger.info('Savings goal saved successfully:', savedGoal);
    res.status(201).json(savedGoal);
  } catch (err) {
    logger.error('Error saving savings goal: ' + err.message);
    res
      .status(500)
      .json({ error: 'Server error. Could not save savings goal.' });
  }
});

// @route   GET /api/savings
// @desc    Get all savings goals
router.get('/', async (req, res) => {
  logger.info('GET /api/savings request received');
  try {
    const goals = await Savings.find({});
    logger.info('Savings goals retrieved successfully');
    res.status(200).json(goals);
  } catch (err) {
    logger.error('Error fetching savings goals: ' + err.message);
    res
      .status(500)
      .json({ error: 'Server error. Could not fetch savings goals.' });
  }
});

// @route    PUT /api/savings/:id
// @desc     Update a savings goal
router.put('/:id', validateSavingsGoal, async (req, res) => {
  logger.info(`PUT /api/savings/${req.params.id} request received`);
  const { title, targetAmount, currentAmount, deadline } = req.body;

  try {
    const goal = await Savings.findById(req.params.id);
    if (!goal) {
      logger.warn(`Savings goal not found for id: ${req.params.id}`);
      return res.status(404).json({ error: 'Savings goal not found' });
    }

    goal.title = title || goal.title;
    goal.targetAmount = targetAmount || goal.targetAmount;
    goal.currentAmount = currentAmount || goal.currentAmount;
    goal.deadline = deadline ? new Date(deadline) : goal.deadline;

    const updatedGoal = await goal.save();
    logger.info('Savings goal updated successfully:', updatedGoal);
    res.status(200).json(updatedGoal);
  } catch (err) {
    logger.error('Error updating savings goal: ' + err.message);
    res
      .status(500)
      .json({ error: 'Server error. Could not update savings goal.' });
  }
});

// @route    DELETE /api/savings/:id
// @desc     Delete a savings goal
router.delete('/:id', async (req, res) => {
  logger.info(`DELETE /api/savings/${req.params.id} request received`);
  try {
    const deletedGoal = await Savings.findByIdAndDelete(req.params.id);

    if (!deletedGoal) {
      logger.warn(`Savings goal not found for id: ${req.params.id}`);
      return res.status(404).json({ error: 'Savings goal not found.' });
    }

    logger.info('Savings goal deleted successfully.');
    res.status(200).json({ message: 'Savings goal deleted successfully.' });
  } catch (err) {
    logger.error('Error deleting savings goal: ' + err.message);
    res
      .status(500)
      .json({ error: 'Server error. Could not delete savings goal.' });
  }
});

export default router;
