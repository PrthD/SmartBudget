import express from 'express';
import Expense from '../models/Expense.js';
import logger from '../config/logger.js';
import { calculateNextRecurrence } from '../utils/expenseHelpers.js';
import { validateExpense } from '../middlewares/expenseValidation.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import moment from 'moment-timezone';

const router = express.Router();

// @route    POST /api/expense/new
// @desc     Add a new expense entry
router.post('/new', requireAuth, validateExpense, async (req, res) => {
  logger.info('POST /api/expense/new - Adding a new expense');
  const { category, customCategory, amount, date, description, frequency } =
    req.body;

  try {
    const expense = new Expense({
      user: req.userId,
      category,
      customCategory: customCategory || false,
      amount: parseFloat(amount),
      date: date
        ? moment.tz(date, 'America/Edmonton').utc().toDate()
        : new Date(),
      description,
      frequency,
      isOriginal: true,
      skippedDates: [],
    });

    const savedExpense = await expense.save();
    logger.info('New expense saved successfully:', savedExpense);

    res.status(201).json(savedExpense);
  } catch (err) {
    logger.error('Error saving new expense:', err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @route    GET /api/expense/all
// @desc     Get all expense entries
router.get('/all', requireAuth, async (req, res) => {
  logger.info('GET /api/expense/all - Retrieving all expenses');
  try {
    const expenses = await Expense.find({ user: req.userId });
    logger.info('All expenses retrieved successfully');

    const expensesWithNextRecurrence = expenses.map((expense) => {
      const nextRecurrence = calculateNextRecurrence(expense);
      return {
        ...expense.toObject(),
        nextRecurrence,
      };
    });

    res.status(200).json(expensesWithNextRecurrence);
  } catch (err) {
    logger.error('Error retrieving expenses:', err.message);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// @route    PUT /api/expense/update/:id
// @desc     Update an existing expense entry
router.put('/update/:id', requireAuth, validateExpense, async (req, res) => {
  logger.info(`PUT /api/expense/update/${req.params.id} - Updating an expense`);
  const { category, customCategory, amount, date, description, frequency } =
    req.body;

  try {
    let expense = await Expense.findById(req.params.id);
    if (!expense) {
      logger.warn(`Expense not found for id: ${req.params.id}`);
      return res.status(404).json({ error: 'Expense not found' });
    }

    if (expense.user.toString() !== req.userId) {
      return res
        .status(403)
        .json({ error: 'Not authorized to edit this expense' });
    }

    expense.category = category || expense.category;
    expense.customCategory =
      customCategory !== undefined ? customCategory : expense.customCategory;
    expense.amount = parseFloat(amount) || expense.amount;
    expense.date = date
      ? moment.tz(date, 'America/Edmonton').utc().toDate()
      : expense.date;
    expense.description = description || expense.description;
    expense.frequency = frequency || expense.frequency;

    const updatedExpense = await expense.save();
    logger.info('Expense updated successfully:', updatedExpense);

    res.status(200).json(updatedExpense);
  } catch (err) {
    logger.error('Error updating expense: ' + err.message);
    res.status(500).json({ error: 'Failed to update expense entry' });
  }
});

// @route    DELETE /api/expense/delete/:id
// @desc     Delete an expense entry by ID
router.delete('/delete/:id', requireAuth, async (req, res) => {
  logger.info(
    `DELETE /api/expense/delete/${req.params.id} - Deleting an expense`
  );
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      logger.warn(`Expense not found for id: ${req.params.id}`);
      return res.status(404).json({ error: 'Expense not found' });
    }

    if (expense.user.toString() !== req.userId) {
      return res
        .status(403)
        .json({ error: 'Not authorized to delete this expense' });
    }

    await Expense.findByIdAndDelete(req.params.id);

    logger.info('Expense deleted successfully');
    res.status(200).json({ message: 'Expense deleted successfully' });
  } catch (err) {
    logger.error('Error deleting expense: ' + err.message);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

// @route    POST /api/expense/skip-next/:id
// @desc     Skip a specific recurrence date for a recurring expense
router.post('/skip-next/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { dateToSkip } = req.body;
  logger.info(`POST /api/expense/skip-next/${id} - Skipping a recurrence date`);

  try {
    const expense = await Expense.findById(id);
    if (!expense) {
      logger.warn(`Expense not found for id: ${id}`);
      return res.status(404).json({ error: 'Expense not found' });
    }

    if (expense.user.toString() !== req.userId) {
      return res
        .status(403)
        .json({ error: 'Not authorized to modify this expense' });
    }

    expense.skippedDates = expense.skippedDates || [];
    expense.skippedDates.push(
      moment.tz(dateToSkip, 'America/Edmonton').utc().toDate()
    );

    await expense.save();

    logger.info(`Recurrence date ${dateToSkip} skipped successfully`);
    res.status(200).json({ message: 'Recurrence date skipped successfully' });
  } catch (err) {
    logger.error('Error skipping recurrence date:', err.message);
    res.status(500).json({ error: 'Failed to skip recurrence date' });
  }
});

export default router;
