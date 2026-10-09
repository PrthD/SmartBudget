import mongoose from 'mongoose';
import { FREQUENCIES } from '../lib/recurrence.js';

const { ObjectId } = mongoose.Schema.Types;

/**
 * Expenses and incomes share one shape; only the "label" field differs
 * (`category` vs `source`). Field names match v1 exactly so production data
 * is read as-is. `isOriginal` / `original*Id` are legacy and unused.
 */
function buildTransactionSchema(labelField, extraFields = {}) {
  const schema = new mongoose.Schema(
    {
      user: { type: ObjectId, ref: 'User', required: true },
      [labelField]: { type: String, required: true, trim: true },
      amount: { type: Number, required: true, min: 0 },
      date: { type: Date, required: true },
      description: { type: String, trim: true, default: '' },
      frequency: { type: String, enum: FREQUENCIES, default: 'once' },
      skippedDates: { type: [Date], default: [] },
      ...extraFields,
    },
    { timestamps: true }
  );
  schema.index({ user: 1, date: -1 });
  return schema;
}

const ExpenseSchema = buildTransactionSchema('category', {
  customCategory: { type: Boolean, default: false },
  isOriginal: { type: Boolean },
  originalExpenseId: { type: ObjectId },
});

const IncomeSchema = buildTransactionSchema('source', {
  isOriginal: { type: Boolean },
  originalIncomeId: { type: ObjectId },
});

export const Expense =
  mongoose.models.Expense || mongoose.model('Expense', ExpenseSchema);
export const Income =
  mongoose.models.Income || mongoose.model('Income', IncomeSchema);
