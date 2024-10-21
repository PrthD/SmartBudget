import mongoose from 'mongoose';

const ExpenseSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    trim: true,
  },
  customCategory: {
    type: Boolean,
    default: false,
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
  frequency: {
    type: String,
    enum: ['once', 'weekly', 'biweekly', 'monthly', 'yearly'],
    required: true,
  },
  isOriginal: {
    type: Boolean,
    default: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    //required: true,
  },
});

const Expense =
  mongoose.models.Expense || mongoose.model('Expense', ExpenseSchema);
export default Expense;
