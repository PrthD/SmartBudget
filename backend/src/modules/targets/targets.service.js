import { todayIn } from '../../lib/civilDate.js';
import { decodeKeys, encodeKeys } from '../../lib/mapKeys.js';
import { round2 } from '../../lib/money.js';
import { notFound } from '../../lib/errors.js';
import { loadEntries } from '../analytics/data.js';
import { suggestTargets, targetProgress } from '../analytics/engine.js';

/**
 * Budget (expense categories) and income goal (income sources) share this
 * service. Production may hold duplicate docs from v1, so reads take the most
 * recent one and deletes remove all of them.
 */
export function createTargetService({ Model, mapField, totalField, kind }) {
  const findLatest = (ctx) =>
    Model.findOne({ user: ctx.userId }).sort({ updatedAt: -1 });

  async function serialize(ctx, doc, refDate) {
    if (!doc) return null;
    const amounts = decodeKeys(doc[mapField]);
    const today = todayIn(ctx.timezone);
    const entries = await loadEntries(ctx, kind);
    return {
      id: String(doc._id),
      interval: doc.interval,
      amounts,
      total: round2(doc[totalField] ?? 0),
      progress: targetProgress(
        { interval: doc.interval, amounts },
        entries,
        refDate ?? today,
        today
      ),
      updatedAt: doc.updatedAt,
    };
  }

  return {
    async get(ctx, refDate) {
      return serialize(ctx, await findLatest(ctx), refDate);
    },

    async upsert(ctx, { interval, amounts }) {
      const positive = Object.fromEntries(
        Object.entries(amounts).filter(([, value]) => value > 0)
      );
      const total = round2(
        Object.values(positive).reduce((acc, v) => acc + v, 0)
      );
      const update = {
        interval,
        [mapField]: encodeKeys(positive),
        [totalField]: total,
      };

      const doc = (await findLatest(ctx)) ?? new Model({ user: ctx.userId });
      doc.set(update);
      await doc.save();
      return serialize(ctx, doc);
    },

    async remove(ctx) {
      const { deletedCount } = await Model.deleteMany({ user: ctx.userId });
      if (!deletedCount) throw notFound();
    },

    async suggest(ctx, interval) {
      const entries = await loadEntries(ctx, kind);
      return {
        interval,
        amounts: suggestTargets(entries, interval, todayIn(ctx.timezone)),
      };
    },
  };
}
