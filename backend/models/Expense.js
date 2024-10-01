const mongoose = require('mongoose');

// Define the Expense schema
const ExpenseSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
  },
  customCategory: {
    type: Boolean,
    default: false, // Indicates whether the category is a custom one created by the user
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Amount cannot be less than zero'],
  },
  date: {
    type: Date,
    default: Date.now,
  },
  description: {
    type: String,
    trim: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the user who created this expense
    //required: true,
  },
});

module.exports = mongoose.model('Expense', ExpenseSchema);
