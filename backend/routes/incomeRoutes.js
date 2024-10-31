import express from 'express';
import Income from '../models/Income.js';
import logger from '../config/logger.js';
import { autoGenerateRecurringIncomes } from '../utils/incomeHelpers.js';
import {
  validateIncome,
  checkDuplicateIncome,
} from '../middlewares/incomeValidation.js';

const router = express.Router();

// @route    POST /api/income/new
// @desc     Add a new income entry
router.post('/new', validateIncome, checkDuplicateIncome, async (req, res) => {
  logger.info('POST /api/income/new - Adding a new income');
  const { source, amount, date, description, frequency } = req.body;

  try {
    const income = new Income({
      source,
      amount: parseFloat(amount),
      date: date ? new Date(date) : new Date(),
      description,
      frequency,
      isOriginal: true,
    });

    const savedIncome = await income.save();
    logger.info('New income saved successfully:', savedIncome);

    // Auto-generate recurring incomes if frequency is specified
    if (frequency && frequency !== 'once') {
      await autoGenerateRecurringIncomes(savedIncome);
    }

    res.status(201).json(savedIncome);
  } catch (err) {
    logger.error('Error saving new income: ' + err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @route    GET /api/income/all
// @desc     Get all income entries
router.get('/all', async (req, res) => {
  logger.info('GET /api/income/all - Retrieving all incomes');
  try {
    const incomes = await Income.find();
    logger.info('All incomes retrieved successfully');
    res.status(200).json(incomes);
  } catch (err) {
    logger.error('Error retrieving incomes: ' + err.message);
    res.status(500).json({ error: 'Failed to fetch incomes' });
  }
});

// @route    PUT /api/income/update/:id
// @desc     Update an existing income entry
router.put('/update/:id', validateIncome, async (req, res) => {
  logger.info(`PUT /api/income/update/${req.params.id} - Updating an income`);
  const { source, amount, date, description, frequency } = req.body;

  try {
    let income = await Income.findById(req.params.id);
    if (!income) {
      logger.warn(`Income not found for id: ${req.params.id}`);
      return res.status(404).json({ error: 'Income not found' });
    }

    income.source = source || income.source;
    income.amount = parseFloat(amount) || income.amount;
    income.date = date ? new Date(date) : income.date;
    income.description = description || income.description;
    income.frequency = frequency || income.frequency;

    const updatedIncome = await income.save();
    logger.info('Income updated successfully:', updatedIncome);

    // Regenerate future incomes if frequency has changed
    if (frequency && frequency !== 'once') {
      await autoGenerateRecurringIncomes(updatedIncome);
    }

    res.status(200).json(updatedIncome);
  } catch (err) {
    logger.error('Error updating income: ' + err.message);
    res.status(500).json({ error: 'Failed to update income entry' });
  }
});

// @route    DELETE /api/income/delete/:id
// @desc     Delete an income entry by ID
router.delete('/delete/:id', async (req, res) => {
  logger.info(
    `DELETE /api/income/delete/${req.params.id} - Deleting an income`
  );
  try {
    const income = await Income.findById(req.params.id);
    if (!income) {
      logger.warn(`Income not found for id: ${req.params.id}`);
      return res.status(404).json({ error: 'Income not found' });
    }

    await Income.findByIdAndDelete(req.params.id);
    logger.info('Income deleted successfully');
    res.status(200).json({ message: 'Income deleted successfully' });
  } catch (err) {
    logger.error('Error deleting income: ' + err.message);
    res.status(500).json({ error: 'Failed to delete income entry' });
  }
});

export default router;
