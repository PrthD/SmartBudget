import express from 'express';
import Income from '../models/Income.js';
import logger from '../config/logger.js';

const router = express.Router();

// @route    POST /api/income
// @desc     Add a new income entry
router.post('/', async (req, res) => {
  logger.info('POST /api/income request received');
  const { source, amount, date, description } = req.body;

  // Validate the required fields
  if (!source || !amount) {
    logger.warn('Source and amount are required');
    return res.status(400).json({ error: 'Source and amount are required.' });
  }

  try {
    const income = new Income({
      source,
      amount: parseFloat(amount),
      date: date ? new Date(date) : new Date(),
      description,
    });

    const savedIncome = await income.save();
    logger.info('Income saved successfully:', savedIncome);
    res.status(201).json(savedIncome);
  } catch (err) {
    logger.error('Error saving income: ' + err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @route    GET /api/income
// @desc     Get all income entries
router.get('/', async (req, res) => {
  logger.info('GET /api/income request received');
  try {
    const incomeEntries = await Income.find();
    logger.info('Income entries retrieved successfully');
    res.status(200).json(incomeEntries);
  } catch (err) {
    logger.error('Error fetching income entries: ' + err.message);
    res.status(500).json({ error: 'Failed to fetch income entries' });
  }
});

// @route    PUT /api/income/:id
// @desc     Update an income entry
router.put('/:id', async (req, res) => {
  logger.info(`PUT /api/income/${req.params.id} request received`);
  const { source, amount, date, description } = req.body;

  try {
    const income = await Income.findById(req.params.id);
    if (!income) {
      logger.warn(`Income entry not found for id: ${req.params.id}`);
      return res.status(404).json({ error: 'Income entry not found' });
    }

    // Update the fields
    income.source = source || income.source;
    income.amount = parseFloat(amount) || income.amount;
    income.date = date ? new Date(date) : income.date;
    income.description = description || income.description;

    const updatedIncome = await income.save();
    logger.info('Income updated successfully:', updatedIncome);
    res.status(200).json(updatedIncome);
  } catch (err) {
    logger.error('Error updating income: ' + err.message);
    res.status(500).json({ error: 'Failed to update income entry' });
  }
});

// @route    DELETE /api/income/:id
// @desc     Delete an income entry
router.delete('/:id', async (req, res) => {
  logger.info(`DELETE /api/income/${req.params.id} request received`);
  try {
    const income = await Income.findById(req.params.id);
    if (!income) {
      logger.warn(`Income entry not found for id: ${req.params.id}`);
      return res.status(404).json({ error: 'Income entry not found' });
    }

    await Income.findByIdAndDelete(req.params.id);
    logger.info('Income entry removed successfully');
    res.status(200).json({ message: 'Income entry removed successfully' });
  } catch (err) {
    logger.error('Error deleting income entry: ' + err.message);
    res.status(500).json({ error: 'Failed to delete income entry' });
  }
});

export default router;
