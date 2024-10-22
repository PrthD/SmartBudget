import mongoose from 'mongoose';

const SavingsGoalSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  targetAmount: {
    type: Number,
    required: true,
  },
  currentAmount: {
    type: Number,
    default: 0,
  },
  deadline: {
    type: Date,
    default: null, // Optional deadline for the goal
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    // required: true,
  },
});

const SavingsGoal = mongoose.model('SavingsGoal', SavingsGoalSchema);
export default SavingsGoal;
