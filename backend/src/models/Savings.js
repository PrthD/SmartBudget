import mongoose from 'mongoose';

/** An individual savings goal (v1 model name: Savings). */
const SavingsSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    targetAmount: { type: Number, required: true, min: 0 },
    currentAmount: { type: Number, default: 0, min: 0 },
    deadline: { type: Date, default: null },
    description: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);
SavingsSchema.index({ user: 1, createdAt: 1 });

export const SavingsGoal =
  mongoose.models.Savings || mongoose.model('Savings', SavingsSchema);
