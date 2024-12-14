import mongoose from 'mongoose';

const ExpenseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      //required: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    customCategory: {
      type: Boolean,
      default: false,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
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
    originalExpenseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Expense',
      default: null,
    },
    skippedDates: {
      type: [Date],
      default: [],
    },
    totalBudget: {
      type: Number,
      default: 0,
      min: 0,
    },
    categoryBudgets: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true }
);

const Expense =
  mongoose.models.Expense || mongoose.model('Expense', ExpenseSchema);
export default Expense;
