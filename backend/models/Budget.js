import mongoose from 'mongoose';

const BudgetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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
    interval: {
      type: String,
      enum: ['weekly', 'biweekly', 'monthly', 'yearly'],
      default: 'monthly',
    },
  },
  { timestamps: true }
);

const Budget = mongoose.models.Budget || mongoose.model('Budget', BudgetSchema);

export default Budget;
