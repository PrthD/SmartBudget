import mongoose from 'mongoose';
import { INTERVALS } from '../lib/periods.js';

const { ObjectId } = mongoose.Schema.Types;

/**
 * Budget (per expense category) and IncomeGoal (per income source) are the
 * same concept: a map of name → amount for a recurring interval. Field names
 * match v1. Map keys are escaped via lib/mapKeys.js.
 */
function buildTargetSchema(mapField, totalField) {
  const schema = new mongoose.Schema(
    {
      user: { type: ObjectId, ref: 'User', required: true },
      [totalField]: { type: Number, default: 0, min: 0 },
      [mapField]: { type: Map, of: Number, default: {} },
      interval: { type: String, enum: INTERVALS, default: 'monthly' },
    },
    { timestamps: true }
  );
  // Not unique: v1 could create duplicates and production may contain some.
  // The service always reads the most recent document and deletes all.
  schema.index({ user: 1, updatedAt: -1 });
  return schema;
}

export const Budget =
  mongoose.models.Budget ||
  mongoose.model('Budget', buildTargetSchema('categoryBudgets', 'totalBudget'));

export const IncomeGoal =
  mongoose.models.IncomeGoal ||
  mongoose.model('IncomeGoal', buildTargetSchema('sourceGoals', 'totalGoal'));

/** The savings allocation plan: goal title → share of net savings (0..1). */
const SavingsPlanSchema = new mongoose.Schema(
  {
    user: { type: ObjectId, ref: 'User', required: true },
    totalSegregated: { type: Number, default: 0, min: 0 }, // legacy, unused
    goalRatios: { type: Map, of: Number, default: {} },
    interval: { type: String, enum: INTERVALS, default: 'monthly' },
  },
  { timestamps: true }
);
SavingsPlanSchema.index({ user: 1, updatedAt: -1 });

// Collection name stays "savingsgoals" (v1 model name: SavingsGoal).
export const SavingsPlan =
  mongoose.models.SavingsGoal ||
  mongoose.model('SavingsGoal', SavingsPlanSchema);
