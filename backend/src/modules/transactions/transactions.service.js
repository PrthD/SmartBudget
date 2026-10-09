import { badRequest, notFound } from '../../lib/errors.js';
import {
  civilToInstant,
  instantToCivil,
  todayIn,
} from '../../lib/civilDate.js';
import { isOccurrence, nextOccurrence } from '../../lib/recurrence.js';
import { encodeKey } from '../../lib/mapKeys.js';

/** Converts a stored document into the recurrence "schedule" shape. */
export function toSchedule(doc, timezone) {
  return {
    anchor: instantToCivil(doc.date, timezone),
    frequency: doc.frequency ?? 'once',
    skipped: new Set(
      (doc.skippedDates ?? []).map((d) => instantToCivil(d, timezone))
    ),
  };
}

export function serialize(doc, config, { timezone, today }) {
  const schedule = toSchedule(doc, timezone);
  const result = {
    id: String(doc._id),
    kind: config.kind,
    [config.labelField]: doc[config.labelField],
    amount: doc.amount,
    date: schedule.anchor,
    description: doc.description ?? '',
    frequency: schedule.frequency,
    skippedDates: [...schedule.skipped].sort(),
    nextOccurrence: nextOccurrence(schedule, today),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
  for (const field of config.extraFields) result[field] = Boolean(doc[field]);
  return result;
}

/** Builds the CRUD service for one transaction kind. */
export function createTransactionService(config) {
  const { Model, labelField, labelName } = config;

  const serializeFor = (ctx) => {
    const options = { timezone: ctx.timezone, today: todayIn(ctx.timezone) };
    return (doc) => serialize(doc, config, options);
  };

  async function findOwned(ctx, id) {
    const doc = await Model.findOne({ _id: id, user: ctx.userId });
    // 404 (not 403) so other users' ids are indistinguishable from missing.
    if (!doc)
      throw notFound(
        `${config.kind === 'expense' ? 'Expense' : 'Income'} not found`
      );
    return doc;
  }

  return {
    async list(ctx) {
      const docs = await Model.find({ user: ctx.userId })
        .sort({ date: -1, _id: -1 })
        .lean();
      return docs.map(serializeFor(ctx));
    },

    async create(ctx, input) {
      const doc = await Model.create({
        ...input,
        user: ctx.userId,
        date: civilToInstant(input.date, ctx.timezone),
      });
      return serializeFor(ctx)(doc.toObject());
    },

    async update(ctx, id, input) {
      const doc = await findOwned(ctx, id);
      const scheduleChanged =
        (input.date && input.date !== instantToCivil(doc.date, ctx.timezone)) ||
        (input.frequency && input.frequency !== doc.frequency);

      const { date, ...rest } = input;
      doc.set(rest);
      if (date) doc.date = civilToInstant(date, ctx.timezone);
      // Skips refer to dates of the old schedule; they don't carry over.
      if (scheduleChanged) doc.skippedDates = [];
      await doc.save();
      return serializeFor(ctx)(doc.toObject());
    },

    async remove(ctx, id) {
      const { deletedCount } = await Model.deleteOne({
        _id: id,
        user: ctx.userId,
      });
      if (!deletedCount) throw notFound();
    },

    async skipOccurrence(ctx, id, date) {
      const doc = await findOwned(ctx, id);
      const schedule = toSchedule(doc, ctx.timezone);
      if (schedule.frequency === 'once') {
        throw badRequest('Only recurring items can skip an occurrence.');
      }
      if (!isOccurrence(schedule, date)) {
        throw badRequest(`${date} is not a scheduled occurrence.`);
      }
      if (!schedule.skipped.has(date)) {
        doc.skippedDates.push(civilToInstant(date, ctx.timezone));
        await doc.save();
      }
      return serializeFor(ctx)(doc.toObject());
    },

    async restoreOccurrence(ctx, id, date) {
      const doc = await findOwned(ctx, id);
      doc.skippedDates = doc.skippedDates.filter(
        (skipped) => instantToCivil(skipped, ctx.timezone) !== date
      );
      await doc.save();
      return serializeFor(ctx)(doc.toObject());
    },

    /** Renames a category/source everywhere, including its budget/goal. */
    async renameLabel(ctx, from, to) {
      if (from === to) return { updated: 0 };
      const { modifiedCount } = await Model.updateMany(
        { user: ctx.userId, [labelField]: from },
        { $set: { [labelField]: to } }
      );
      if (!modifiedCount) throw notFound(`${labelName} "${from}" not found`);

      const target = await config.TargetModel.findOne({
        user: ctx.userId,
      }).sort({ updatedAt: -1 });
      const map = target?.[config.targetMapField];
      if (map?.has(encodeKey(from))) {
        const existing = map.get(encodeKey(to)) ?? 0;
        map.set(encodeKey(to), existing + map.get(encodeKey(from)));
        map.delete(encodeKey(from));
        await target.save();
      }
      return { updated: modifiedCount };
    },
  };
}
