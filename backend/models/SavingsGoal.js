import mongoose from 'mongoose';

const SavingsGoalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      // required: true,
    },
    totalSegregated: {
      type: Number,
      default: 0,
      min: 0,
    },
    goalRatios: {
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

const SavingsGoal =
  mongoose.models.SavingsGoal ||
  mongoose.model('SavingsGoal', SavingsGoalSchema);

export default SavingsGoal;
