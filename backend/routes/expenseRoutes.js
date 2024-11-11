import express from 'express';
import Expense from '../models/Expense.js';
import logger from '../config/logger.js';
import { autoGenerateRecurringExpenses } from '../utils/expenseHelpers.js';
import {
  validateExpense,
  checkDuplicateExpense,
} from '../middlewares/expenseValidation.js';

const router = express.Router();

// @route    POST /api/expense/new
// @desc     Add a new expense entry
router.post(
  '/new',
  validateExpense,
  checkDuplicateExpense,
  async (req, res) => {
    logger.info('POST /api/expense/new - Adding a new expense');
    const { category, customCategory, amount, date, description, frequency } =
      req.body;

    try {
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
      logger.info('New expense saved successfully:', savedExpense);

      // Auto-generate recurring expenses if frequency is specified
      if (frequency && frequency !== 'once') {
        await autoGenerateRecurringExpenses(savedExpense);
      }

      res.status(201).json(savedExpense);
    } catch (err) {
      logger.error('Error saving new expense:', err.message);
      res.status(500).json({ error: 'Server Error' });
    }
  }
);

// @route    GET /api/expense/all
// @desc     Get all expense entries
router.get('/all', async (req, res) => {
  logger.info('GET /api/expense/all - Retrieving all expenses');
  try {
    const expenses = await Expense.find();
    logger.info('All expenses retrieved successfully');
    res.status(200).json(expenses);
  } catch (err) {
    logger.error('Error retrieving expenses:', err.message);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// @route    PUT /api/expense/update/:id
// @desc     Update an existing expense entry
router.put('/update/:id', validateExpense, async (req, res) => {
  logger.info(`PUT /api/expense/update/${req.params.id} - Updating an expense`);
  const { category, customCategory, amount, date, description, frequency } =
    req.body;

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

    // Regenerate future expenses if frequency has changed
    if (frequency && frequency !== 'once') {
      await autoGenerateRecurringExpenses(updatedExpense);
    }

    res.status(200).json(updatedExpense);
  } catch (err) {
    logger.error('Error updating expense: ' + err.message);
    res.status(500).json({ error: 'Failed to update expense entry' });
  }
});

// @route    DELETE /api/expense/delete/:id
// @desc     Delete an expense entry by ID and its recurrences
router.delete('/delete/:id', async (req, res) => {
  logger.info(
    `DELETE /api/expense/delete/${req.params.id} - Deleting an expense and its recurrences`
  );
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      logger.warn(`Expense not found for id: ${req.params.id}`);
      return res.status(404).json({ error: 'Expense not found' });
    }

    await Expense.deleteMany({
      category: expense.category,
      frequency: expense.frequency,
      isOriginal: { $in: [true, false] },
    });

    logger.info('Expense and its recurrences deleted successfully');
    res
      .status(200)
      .json({ message: 'Expense and its recurrences deleted successfully' });
  } catch (err) {
    logger.error('Error deleting expense: ' + err.message);
    res.status(500).json({ error: 'Failed to delete expense and recurrences' });
  }
});

export default router;
