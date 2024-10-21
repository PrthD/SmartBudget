import mongoose from 'mongoose';

const IncomeSchema = new mongoose.Schema({
  source: {
    type: String,
    required: true,
    trim: true,
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Amount must be a positive number'],
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
    // required: true,
  },
});

const Income = mongoose.models.Income || mongoose.model('Income', IncomeSchema);
export default Income;
