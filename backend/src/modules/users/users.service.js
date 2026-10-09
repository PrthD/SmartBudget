import { User } from '../../models/User.js';
import { Expense, Income } from '../../models/transactions.js';
import { Budget, IncomeGoal, SavingsPlan } from '../../models/targets.js';
import { SavingsGoal } from '../../models/Savings.js';
import { Session } from '../../models/Session.js';
import { AiInsight, AiUsage } from '../../models/ai.js';
import {
  conflict,
  forbidden,
  notFound,
  unauthorized,
} from '../../lib/errors.js';
import { todayIn } from '../../lib/civilDate.js';
import { decodeKeys } from '../../lib/mapKeys.js';
import { revokeSessions, userHasPhoto } from '../auth/auth.service.js';
import { serialize as serializeTransaction } from '../transactions/transactions.service.js';
import { TRANSACTION_KINDS } from '../transactions/transactions.config.js';
import { serializeGoal } from '../savings/savings.service.js';
import { toPublicUser } from './users.serializer.js';
import { assertValidUpload, decodeAvatar } from './avatar.js';
import { invalidateUserContext } from './context.js';

async function findUser(userId, select = '') {
  const user = await User.findById(userId).select(select);
  // 401 (not 404): a deleted account's still-valid token must sign the client out.
  if (!user) throw unauthorized('Account no longer exists.');
  return user;
}

async function publicProfile(user) {
  return toPublicUser(user, { hasPhoto: await userHasPhoto(user._id) });
}

/** Re-authentication for sensitive changes. */
async function assertPassword(user, password) {
  if (!(await user.verifyPassword(password))) {
    throw forbidden('Current password is incorrect.');
  }
}

export async function getProfile(userId) {
  return publicProfile(await findUser(userId));
}

export async function updateProfile(userId, { name, preferences, onboarded }) {
  const user = await findUser(userId);
  if (name) user.name = name;
  if (preferences) {
    for (const [key, value] of Object.entries(preferences)) {
      user.set(`preferences.${key}`, value);
    }
  }
  if (onboarded) user.isFirstTimeLogin = false;
  await user.save();
  invalidateUserContext(userId);
  return publicProfile(user);
}

export async function changeEmail(userId, { email, currentPassword }) {
  const user = await findUser(userId, '+password');
  await assertPassword(user, currentPassword);
  if (email !== user.email && (await User.exists({ email }))) {
    throw conflict('An account with this email already exists.');
  }
  user.email = email;
  await user.save();
  return publicProfile(user);
}

/** Changing the password signs out every other session. */
export async function changePassword(
  userId,
  { currentPassword, newPassword },
  currentToken
) {
  const user = await findUser(userId, '+password');
  await assertPassword(user, currentPassword);
  user.password = newPassword;
  await user.save();
  await revokeSessions(userId, { exceptToken: currentToken });
}

export async function getAvatar(userId) {
  const user = await User.findById(userId)
    .select('+profilePhoto updatedAt')
    .lean();
  const image = user && decodeAvatar(user.profilePhoto);
  if (!image) throw notFound('No profile photo');
  return { ...image, version: new Date(user.updatedAt).getTime() };
}

export async function setAvatar(userId, dataUrl) {
  assertValidUpload(dataUrl);
  const user = await findUser(userId);
  user.set('profilePhoto', dataUrl);
  await user.save();
  return publicProfile(user);
}

export async function removeAvatar(userId) {
  const user = await findUser(userId);
  user.set('profilePhoto', '');
  await user.save();
  return publicProfile(user);
}

/** Everything stored about the user, in a portable JSON shape. */
export async function exportData(ctx) {
  const options = { timezone: ctx.timezone, today: todayIn(ctx.timezone) };
  const filter = { user: ctx.userId };
  const [user, expenses, incomes, budget, incomeGoal, goals, plan] =
    await Promise.all([
      findUser(ctx.userId),
      Expense.find(filter).sort({ date: -1 }).lean(),
      Income.find(filter).sort({ date: -1 }).lean(),
      Budget.findOne(filter).sort({ updatedAt: -1 }).lean(),
      IncomeGoal.findOne(filter).sort({ updatedAt: -1 }).lean(),
      SavingsGoal.find(filter).lean(),
      SavingsPlan.findOne(filter).sort({ updatedAt: -1 }).lean(),
    ]);
  return {
    exportedAt: new Date().toISOString(),
    profile: await publicProfile(user),
    expenses: expenses.map((d) =>
      serializeTransaction(d, TRANSACTION_KINDS.expense, options)
    ),
    incomes: incomes.map((d) =>
      serializeTransaction(d, TRANSACTION_KINDS.income, options)
    ),
    budget: budget && {
      interval: budget.interval,
      amounts: decodeKeys(budget.categoryBudgets),
    },
    incomeGoal: incomeGoal && {
      interval: incomeGoal.interval,
      amounts: decodeKeys(incomeGoal.sourceGoals),
    },
    savingsGoals: goals.map((g) => serializeGoal(g, options)),
    savingsPlan: plan && {
      interval: plan.interval,
      ratios: decodeKeys(plan.goalRatios),
    },
  };
}

/** Permanently deletes the account and all of its data. */
export async function deleteAccount(userId, password) {
  const user = await findUser(userId, '+password');
  await assertPassword(user, password);
  const filter = { user: userId };
  await Promise.all(
    [
      Expense,
      Income,
      Budget,
      IncomeGoal,
      SavingsGoal,
      SavingsPlan,
      Session,
      AiInsight,
      AiUsage,
    ].map((Model) => Model.deleteMany(filter))
  );
  await user.deleteOne();
  invalidateUserContext(userId);
}
