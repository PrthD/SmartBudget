import express from 'express';
import SavingsGoal from '../models/SavingsGoal.js';
import logger from '../config/logger.js';

const router = express.Router();

// @route POST /api/savings-goals
// @desc Add a new savings goal
router.post('/', async (req, res) => {
  logger.info('POST /api/savings-goals request received');
  const { title, targetAmount, deadline } = req.body;

  if (!title || !targetAmount) {
    logger.warn('Title and target amount are required.');
    return res
      .status(400)
      .json({ error: 'Title and target amount are required.' });
  }

  try {
    const existingGoal = await SavingsGoal.findOne({
      title,
      targetAmount,
      deadline,
    });
    if (existingGoal) {
      logger.warn(`Goal with the same details already exists.`);
      return res
        .status(400)
        .json({ error: 'Goal with the same details already exists.' });
    }

    const newGoal = new SavingsGoal({
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

// @route GET /api/savings-goals
// @desc Get all savings goals
router.get('/', async (req, res) => {
  logger.info('GET /api/savings-goals request received');
  try {
    const goals = await SavingsGoal.find({});
    logger.info('Savings goals retrieved successfully');
    res.status(200).json(goals);
  } catch (err) {
    logger.error('Error fetching savings goals: ' + err.message);
    res
      .status(500)
      .json({ error: 'Server error. Could not fetch savings goals.' });
  }
});

// @route PUT /api/savings-goals/:id
// @desc Update a savings goal
router.put('/:id', async (req, res) => {
  logger.info(`PUT /api/savings-goals/${req.params.id} request received`);
  const { title, targetAmount, currentAmount, deadline } = req.body;

  try {
    let goal = await SavingsGoal.findById(req.params.id);
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

// @route DELETE /api/savings-goals/:id
// @desc Delete a savings goal
router.delete('/:id', async (req, res) => {
  logger.info(`DELETE /api/savings-goals/${req.params.id} request received`);
  try {
    const deletedGoal = await SavingsGoal.findByIdAndDelete(req.params.id);

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
