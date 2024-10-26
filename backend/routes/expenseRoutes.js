import express from 'express';
import Expense from '../models/Expense.js';
import logger from '../config/logger.js';
import { autoGenerateRecurringExpenses } from '../utils/expenseHelpersBackend.js';

const router = express.Router();

// @route    POST /api/expense
// @desc     Add a new expense
router.post('/', async (req, res) => {
  logger.info('POST /api/expense request received');
  const { category, customCategory, amount, date, description, frequency } =
    req.body;

  if (!category || !amount || isNaN(amount)) {
    logger.warn('Category and valid amount are required');
    return res
      .status(400)
      .json({ error: 'Category and valid amount are required.' });
  }

  try {
    const existingExpense = await Expense.findOne({
      category,
      customCategory,
      amount,
      date,
      frequency,
    });
    if (existingExpense) {
      logger.warn(`Expense with the same details already exists.`);
      return res
        .status(400)
        .json({ error: 'Expense with the same details already exists.' });
    }

    const expense = new Expense({
      category,
      customCategory: customCategory || false,
      amount: parseFloat(amount),
      date: date ? new Date(date) : new Date(),
      description,
      frequency,
      isOriginal: true,
    });

    const savedExpense = await expense.save();
    logger.info('Expense saved successfully:', savedExpense);

    // Auto-generate future recurring expenses
    if (frequency && frequency !== 'once') {
      await autoGenerateRecurringExpenses(savedExpense);
    }

    res.status(201).json(savedExpense);
  } catch (err) {
    logger.error('Error saving expense: ' + err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @route    GET /api/expense
// @desc     Get all expenses
router.get('/', async (req, res) => {
  logger.info('GET /api/expense request received');
  try {
    const expenses = await Expense.find();
    logger.info('Expenses retrieved successfully');
    res.status(200).json(expenses);
  } catch (err) {
    logger.error('Error fetching expenses: ' + err.message);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// @route    PUT /api/expense/:id
// @desc     Update an expense
router.put('/:id', async (req, res) => {
  logger.info(`PUT /api/expense/${req.params.id} request received`);
  const { category, customCategory, amount, date, description, frequency } =
    req.body;

  if (amount && isNaN(amount)) {
    logger.warn('Valid amount is required');
    return res.status(400).json({ error: 'Invalid amount provided.' });
  }

  try {
    let expense = await Expense.findById(req.params.id);
    if (!expense) {
      logger.warn(`Expense not found for id: ${req.params.id}`);
      return res.status(404).json({ error: 'Expense not found' });
    }

    expense.category = category || expense.category;
    expense.customCategory =
      customCategory !== undefined ? customCategory : expense.customCategory;
    expense.amount = parseFloat(amount) || expense.amount;
    expense.date = date ? new Date(date) : expense.date;
    expense.description = description || expense.description;
    expense.frequency = frequency || expense.frequency;

    const updatedExpense = await expense.save();
    logger.info('Expense updated successfully:', updatedExpense);

    // Auto-generate future recurring expenses if the frequency is updated
    if (frequency && frequency !== 'once') {
      await autoGenerateRecurringExpenses(updatedExpense);
    }

    res.status(200).json(updatedExpense);
  } catch (err) {
    logger.error('Error updating expense: ' + err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @route    DELETE /api/expense/:id
// @desc     Delete an expense
router.delete('/:id', async (req, res) => {
  logger.info(`DELETE /api/expense/${req.params.id} request received`);
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      logger.warn(`Expense not found for id: ${req.params.id}`);
      return res.status(404).json({ error: 'Expense not found' });
    }

    await Expense.findByIdAndDelete(req.params.id);
    logger.info('Expense removed successfully');
    res.status(200).json({ message: 'Expense removed successfully' });
  } catch (err) {
    logger.error('Error deleting expense: ' + err.message);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

export default router;
