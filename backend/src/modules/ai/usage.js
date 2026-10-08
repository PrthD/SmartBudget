import { env } from '../../config/env.js';
import { AiUsage } from '../../models/ai.js';
import { tooManyRequests } from '../../lib/errors.js';

const DAY_MS = 86_400_000;

/** Counts one AI call against the user's daily allowance. */
export async function consumeAiQuota(userId) {
  const day = new Date().toISOString().slice(0, 10);
  const usage = await AiUsage.findOneAndUpdate(
    { user: userId, day },
    {
      $inc: { count: 1 },
      $setOnInsert: { expiresAt: new Date(Date.now() + 2 * DAY_MS) },
    },
    { upsert: true, new: true, lean: true }
  );
  if (usage.count > env.AI_DAILY_REQUESTS_PER_USER) {
    throw tooManyRequests(
      "You've reached today's AI limit. It resets at midnight UTC."
    );
  }
}
