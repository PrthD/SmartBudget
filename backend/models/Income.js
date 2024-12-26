import mongoose from 'mongoose';

const IncomeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      // required: true,
    },
    source: {
      type: String,
      required: [true, 'Source is required'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
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
    originalIncomeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Income',
      default: null,
    },
    skippedDates: {
      type: [Date],
      default: [],
    },
  },
  { timestamps: true }
);

const Income = mongoose.models.Income || mongoose.model('Income', IncomeSchema);
export default Income;
