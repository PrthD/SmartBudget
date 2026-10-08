import mongoose from 'mongoose';

const { ObjectId, Mixed } = mongoose.Schema.Types;

/** Cached AI insight reports, keyed by the facts they were generated from. */
const AiInsightSchema = new mongoose.Schema(
  {
    user: { type: ObjectId, ref: 'User', required: true },
    factsHash: { type: String, required: true },
    report: { type: Mixed, required: true },
    model: { type: String, default: '' },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);
AiInsightSchema.index({ user: 1, factsHash: 1 });
AiInsightSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/** Per-user daily AI request counter (protects the shared free-tier quota). */
const AiUsageSchema = new mongoose.Schema({
  user: { type: ObjectId, ref: 'User', required: true },
  day: { type: String, required: true }, // UTC YYYY-MM-DD
  count: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true },
});
AiUsageSchema.index({ user: 1, day: 1 }, { unique: true });
AiUsageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const AiInsight =
  mongoose.models.AiInsight || mongoose.model('AiInsight', AiInsightSchema);
export const AiUsage =
  mongoose.models.AiUsage || mongoose.model('AiUsage', AiUsageSchema);
