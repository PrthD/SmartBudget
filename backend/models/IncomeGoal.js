import mongoose from 'mongoose';

const IncomeGoalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      // required: true,
    },
    totalGoal: {
      type: Number,
      default: 0,
      min: 0,
    },
    sourceGoals: {
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

const IncomeGoal =
  mongoose.models.IncomeGoal || mongoose.model('IncomeGoal', IncomeGoalSchema);

export default IncomeGoal;
