import mongoose from 'mongoose';

const SavingsSchema = new mongoose.Schema({
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
    default: null,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    // required: true,
  },
});

const Savings = mongoose.model('Savings', SavingsSchema);
export default Savings;
