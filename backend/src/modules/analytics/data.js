import { TRANSACTION_KINDS } from '../transactions/transactions.config.js';
import { toSchedule } from '../transactions/transactions.service.js';

const PROJECTION = 'category source amount date frequency skippedDates';

/** Loads one kind of transaction as analytics entries. */
export async function loadEntries(ctx, kind) {
  const config = TRANSACTION_KINDS[kind];
  const docs = await config.Model.find({ user: ctx.userId })
    .select(PROJECTION)
    .lean();
  return docs.map((doc) => ({
    id: String(doc._id),
    kind,
    label: doc[config.labelField],
    amount: doc.amount,
    schedule: toSchedule(doc, ctx.timezone),
  }));
}

export async function loadAllEntries(ctx) {
  const [incomes, expenses] = await Promise.all([
    loadEntries(ctx, 'income'),
    loadEntries(ctx, 'expense'),
  ]);
  return { incomes, expenses };
}
