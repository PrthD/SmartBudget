import express from 'express';
import Income from '../models/Income.js';

const router = express.Router();

// Create a new income stream
router.post('/', async (req, res) => {
  const { source, amount, date, description } = req.body;

  try {
    // Validate that required fields are provided
    if (!source || !amount) {
      return res.status(400).json({ error: 'Source and amount are required.' });
    }

    // Create a new income stream
    const income = new Income({
      source,
      amount,
      date: date || new Date(), // Use provided date or default to current date
      description,
      // user: req.user.id, // Uncomment and use if user authentication is enabled
    });

    const savedIncome = await income.save();
    res.status(201).json(savedIncome);
  } catch (err) {
    console.error('Error creating income:', err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// Get all income streams
router.get('/', async (req, res) => {
  try {
    const incomes = await Income.find(); // Get all income streams
    res.json(incomes);
  } catch (err) {
    console.error('Error fetching income:', err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// Update an existing income stream
router.put('/:id', async (req, res) => {
  const { source, amount, date, description } = req.body;

  try {
    let income = await Income.findById(req.params.id);
    if (!income) return res.status(404).json({ error: 'Income not found' });

    // Update the fields
    income.source = source || income.source;
    income.amount = amount || income.amount;
    income.date = date || income.date;
    income.description = description || income.description;

    income = await income.save();
    res.json(income);
  } catch (err) {
    console.error('Error updating income:', err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// Delete an income stream
router.delete('/:id', async (req, res) => {
  try {
    const income = await Income.findById(req.params.id);
    if (!income) return res.status(404).json({ error: 'Income not found' });

    await income.deleteOne(); // Delete the income stream
    res.json({ message: 'Income deleted successfully' });
  } catch (err) {
    console.error('Error deleting income:', err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

export default router;
