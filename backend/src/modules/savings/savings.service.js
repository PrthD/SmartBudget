import { SavingsGoal } from '../../models/Savings.js';
import { SavingsPlan } from '../../models/targets.js';
import { badRequest, conflict, notFound } from '../../lib/errors.js';
import {
  civilToInstant,
  instantToCivil,
  monthsBetween,
  todayIn,
} from '../../lib/civilDate.js';
import { decodeKeys, encodeKey, encodeKeys } from '../../lib/mapKeys.js';
import { round2 } from '../../lib/money.js';
import { periodRange } from '../../lib/periods.js';
import { loadAllEntries } from '../analytics/data.js';
import { toDateRange, totalsInRange } from '../analytics/engine.js';

const RATIO_TOLERANCE = 1e-4;

export function serializeGoal(doc, { timezone, today }) {
  const deadline = doc.deadline ? instantToCivil(doc.deadline, timezone) : null;
  const current = round2(doc.currentAmount ?? 0);
  const remaining = round2(Math.max(0, doc.targetAmount - current));
  // Months left including the current one, so "due this month" needs 1x.
  const monthsLeft = deadline
    ? Math.max(0, monthsBetween(today, deadline) + 1)
    : null;
  return {
    id: String(doc._id),
    title: doc.title,
    targetAmount: doc.targetAmount,
    currentAmount: current,
    remaining,
    percent:
      doc.targetAmount > 0 ? round2((current / doc.targetAmount) * 100) : 0,
    deadline,
    overdue: Boolean(deadline && deadline < today && remaining > 0),
    monthlyNeeded: monthsLeft ? round2(remaining / monthsLeft) : null,
    description: doc.description ?? '',
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

const findPlan = (ctx) =>
  SavingsPlan.findOne({ user: ctx.userId }).sort({ updatedAt: -1 });

async function findGoal(ctx, id) {
  const goal = await SavingsGoal.findOne({ _id: id, user: ctx.userId });
  if (!goal) throw notFound('Savings goal not found');
  return goal;
}

async function assertTitleAvailable(ctx, title, exceptId) {
  const clash = await SavingsGoal.exists({
    user: ctx.userId,
    title,
    ...(exceptId ? { _id: { $ne: exceptId } } : {}),
  });
  if (clash) throw conflict(`A goal named "${title}" already exists.`);
}

function assertFutureDeadline(ctx, deadline) {
  if (deadline && deadline < todayIn(ctx.timezone)) {
    throw badRequest('Deadline cannot be in the past.');
  }
}

const options = (ctx) => ({
  timezone: ctx.timezone,
  today: todayIn(ctx.timezone),
});

/* ------------------------------ Goals ----------------------------------- */

export async function listGoals(ctx) {
  const docs = await SavingsGoal.find({ user: ctx.userId })
    .sort({ createdAt: 1 })
    .lean();
  return docs.map((doc) => serializeGoal(doc, options(ctx)));
}

export async function createGoal(ctx, input) {
  await assertTitleAvailable(ctx, input.title);
  assertFutureDeadline(ctx, input.deadline);
  const doc = await SavingsGoal.create({
    ...input,
    user: ctx.userId,
    deadline: input.deadline
      ? civilToInstant(input.deadline, ctx.timezone)
      : null,
  });
  return serializeGoal(doc.toObject(), options(ctx));
}

export async function updateGoal(ctx, id, input) {
  const goal = await findGoal(ctx, id);
  const previousTitle = goal.title;

  if (input.title && input.title !== previousTitle) {
    await assertTitleAvailable(ctx, input.title, goal._id);
  }
  if (input.deadline !== undefined) {
    const current = goal.deadline
      ? instantToCivil(goal.deadline, ctx.timezone)
      : null;
    if (input.deadline !== current) assertFutureDeadline(ctx, input.deadline);
  }

  const { deadline, ...rest } = input;
  goal.set(rest);
  if (deadline !== undefined) {
    goal.deadline = deadline ? civilToInstant(deadline, ctx.timezone) : null;
  }
  await goal.save();

  // The plan is keyed by title (v1 schema): carry the share over on rename.
  if (input.title && input.title !== previousTitle) {
    const plan = await findPlan(ctx);
    const ratios = plan?.goalRatios;
    if (ratios?.has(encodeKey(previousTitle))) {
      ratios.set(encodeKey(input.title), ratios.get(encodeKey(previousTitle)));
      ratios.delete(encodeKey(previousTitle));
      await plan.save();
    }
  }
  return serializeGoal(goal.toObject(), options(ctx));
}

export async function deleteGoal(ctx, id) {
  const goal = await findGoal(ctx, id);
  await goal.deleteOne();

  // Re-balance the remaining shares so the plan stays valid.
  const plan = await findPlan(ctx);
  if (plan?.goalRatios?.has(encodeKey(goal.title))) {
    plan.goalRatios.delete(encodeKey(goal.title));
    const total = [...plan.goalRatios.values()].reduce((acc, v) => acc + v, 0);
    if (total <= 0) {
      await SavingsPlan.deleteMany({ user: ctx.userId });
    } else {
      for (const [key, value] of plan.goalRatios)
        plan.goalRatios.set(key, value / total);
      await plan.save();
    }
  }
}

/** Adds (or withdraws, if negative) money; never drops below zero. */
export async function contribute(ctx, id, amount) {
  const goal = await SavingsGoal.findOneAndUpdate(
    { _id: id, user: ctx.userId },
    [
      {
        $set: {
          currentAmount: {
            $round: [
              {
                $max: [
                  0,
                  { $add: [{ $ifNull: ['$currentAmount', 0] }, amount] },
                ],
              },
              2,
            ],
          },
        },
      },
    ],
    { new: true, lean: true, updatePipeline: true }
  );
  if (!goal) throw notFound('Savings goal not found');
  return serializeGoal(goal, options(ctx));
}

/* ------------------------------ Plan ------------------------------------ */

async function serializePlan(ctx, plan) {
  if (!plan) return null;
  const ratios = decodeKeys(plan.goalRatios);
  const today = todayIn(ctx.timezone);
  const range = periodRange(plan.interval, today);
  const [{ incomes, expenses }, goals] = await Promise.all([
    loadAllEntries(ctx),
    SavingsGoal.find({ user: ctx.userId })
      .sort({ createdAt: 1 })
      .select('title')
      .lean(),
  ]);
  // Net savings so far this period (scheduled future items don't count yet).
  const done = toDateRange(range, today);
  const net = round2(
    totalsInRange(incomes, done).total - totalsInRange(expenses, done).total
  );
  const distributable = Math.max(0, net);
  // Listed in goal order (stable across renames), skipping stale titles.
  const allocations = goals
    .filter((goal) => ratios[goal.title] > 0)
    .map((goal) => ({
      goalId: String(goal._id),
      title: goal.title,
      ratio: ratios[goal.title],
      amount: round2(distributable * ratios[goal.title]),
    }));
  const allocatedRatio = allocations.reduce((acc, a) => acc + a.ratio, 0);

  return {
    id: String(plan._id),
    interval: plan.interval,
    range,
    netSavings: net,
    allocations,
    unallocated: round2(distributable * Math.max(0, 1 - allocatedRatio)),
    updatedAt: plan.updatedAt,
  };
}

export async function getPlan(ctx) {
  return serializePlan(ctx, await findPlan(ctx));
}

/** `ratios` is { goalId: share (0..1) }; shares must total ≤ 100%. */
export async function upsertPlan(ctx, { interval, ratios }) {
  const goals = await SavingsGoal.find({
    user: ctx.userId,
    _id: { $in: Object.keys(ratios) },
  })
    .select('title')
    .lean();
  if (goals.length !== Object.keys(ratios).length) {
    throw badRequest('The plan references a savings goal that does not exist.');
  }
  const total = Object.values(ratios).reduce((acc, v) => acc + v, 0);
  if (total <= 0) throw badRequest('Allocate a share to at least one goal.');
  if (total > 1 + RATIO_TOLERANCE)
    throw badRequest('Shares cannot add up to more than 100%.');

  const byTitle = Object.fromEntries(
    goals
      .map((goal) => [goal.title, ratios[String(goal._id)]])
      .filter(([, v]) => v > 0)
  );
  const plan = (await findPlan(ctx)) ?? new SavingsPlan({ user: ctx.userId });
  plan.set({ interval, goalRatios: encodeKeys(byTitle) });
  await plan.save();
  return serializePlan(ctx, plan);
}

export async function deletePlan(ctx) {
  const { deletedCount } = await SavingsPlan.deleteMany({ user: ctx.userId });
  if (!deletedCount) throw notFound();
}
