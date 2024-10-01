const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');

// Create a new expense
router.post('/', async (req, res) => {
  console.log('POST /api/expenses request received');
  console.log('Request Body:', req.body);
  const { category, amount, date, description, customCategory } = req.body;

  try {
    // Validate that amount is a number and category is provided
    if (!category || !amount) {
      return res
        .status(400)
        .json({ error: 'Category and amount are required.' });
    }

    // Create the expense
    const expense = new Expense({
      category,
      customCategory: customCategory || false, // Indicate if it's a custom category
      amount,
      date,
      description,
    });

    // Save to the database
    const savedExpense = await expense.save();
    res.status(201).json(savedExpense);
    console.log('Expense saved successfully:', savedExpense);
  } catch (err) {
    console.error('Error saving expense:', err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// Get all expenses
router.get('/', async (req, res) => {
  try {
    const expenses = await Expense.find();
    res.json(expenses);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// Update an existing expense
router.put('/:id', async (req, res) => {
  const { category, amount, date, description, customCategory } = req.body;

  try {
    // Find the expense by ID and update it
    let expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ error: 'Expense not found' });

    // Update fields
    expense.category = category || expense.category;
    expense.amount = amount || expense.amount;
    expense.date = date || expense.date;
    expense.description = description || expense.description;
    expense.customCategory = customCategory || expense.customCategory;

    // Save the updated expense
    expense = await expense.save();
    res.json(expense);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// Delete an expense
router.delete('/:id', async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ error: 'Expense not found' });

    // Remove the expense from the database
    await Expense.deleteOne({ _id: req.params.id });
    res.json({ message: 'Expense deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = router;
