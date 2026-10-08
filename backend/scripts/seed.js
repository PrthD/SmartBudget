import { User } from '../src/models/User.js';
import { Expense, Income } from '../src/models/transactions.js';
import { Budget, IncomeGoal, SavingsPlan } from '../src/models/targets.js';
import { SavingsGoal } from '../src/models/Savings.js';
import {
  addDays,
  addMonths,
  civilToInstant,
  formatCivil,
  parseCivil,
  todayIn,
} from '../src/lib/civilDate.js';

const TZ = 'America/Edmonton';
export const DEMO_USER = {
  name: 'Alex Morgan',
  email: 'demo@smartbudget.dev',
  password: 'demo1234',
};

// Deterministic pseudo-random numbers so the demo looks the same every run.
function random(seed) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

/** Seeds a demo account with ~6 months of realistic data. Dev/test only. */
export async function seedDemoData() {
  if (process.env.NODE_ENV === 'production')
    throw new Error('Refusing to seed production');
  if (await User.exists({ email: DEMO_USER.email })) return;

  const user = await User.create({ ...DEMO_USER, isFirstTimeLogin: false });
  const today = todayIn(TZ);
  const { year, month } = parseCivil(today);
  const start = addMonths(formatCivil(year, month, 1), -5);
  const at = (date) => civilToInstant(date, TZ);
  const rand = random(42);

  const recurringExpenses = [
    ['Housing', 1450, start, 'monthly', 'Rent'],
    ['Utilities', 120, addDays(start, 4), 'monthly', 'Electricity & internet'],
    ['Entertainment', 16.99, addDays(start, 9), 'monthly', 'Streaming'],
    ['Transportation', 105, addDays(start, 1), 'monthly', 'Transit pass'],
  ];
  const oneOff = [];
  for (let date = start; date <= today; date = addDays(date, 1)) {
    if (rand() < 0.28)
      oneOff.push(['Groceries', 30 + rand() * 90, date, 'Weekly shop']);
    if (rand() < 0.18)
      oneOff.push(['Dining', 12 + rand() * 45, date, 'Lunch out']);
    if (rand() < 0.05)
      oneOff.push(['Shopping', 25 + rand() * 140, date, 'Online order']);
  }

  await Expense.insertMany([
    ...recurringExpenses.map(
      ([category, amount, date, frequency, description]) => ({
        user: user._id,
        category,
        amount,
        date: at(date),
        frequency,
        description,
      })
    ),
    ...oneOff.map(([category, amount, date, description]) => ({
      user: user._id,
      category,
      customCategory: ![
        'Groceries',
        'Transportation',
        'Entertainment',
        'Utilities',
      ].includes(category),
      amount: Math.round(amount * 100) / 100,
      date: at(date),
      frequency: 'once',
      description,
    })),
  ]);

  await Income.insertMany([
    {
      user: user._id,
      source: 'Salary',
      amount: 2150,
      date: at(addDays(start, 4)),
      frequency: 'biweekly',
      description: 'Paycheque',
    },
    {
      user: user._id,
      source: 'Freelance',
      amount: 650,
      date: at(addMonths(start, 2)),
      frequency: 'once',
      description: 'Website project',
    },
    {
      user: user._id,
      source: 'Freelance',
      amount: 420,
      date: at(addMonths(start, 4)),
      frequency: 'once',
      description: 'Logo design',
    },
  ]);

  await Budget.create({
    user: user._id,
    interval: 'monthly',
    categoryBudgets: {
      Housing: 1450,
      Groceries: 450,
      Dining: 200,
      Transportation: 120,
      Utilities: 130,
      Entertainment: 40,
      Shopping: 150,
    },
    totalBudget: 2540,
  });
  await IncomeGoal.create({
    user: user._id,
    interval: 'monthly',
    sourceGoals: { Salary: 4300, Freelance: 500 },
    totalGoal: 4800,
  });

  await SavingsGoal.insertMany([
    {
      user: user._id,
      title: 'Emergency fund',
      targetAmount: 10000,
      currentAmount: 4200,
      deadline: at(addMonths(today, 10)),
      description: '3 months of expenses',
    },
    {
      user: user._id,
      title: 'Japan trip',
      targetAmount: 4500,
      currentAmount: 1250,
      deadline: at(addMonths(today, 7)),
    },
    {
      user: user._id,
      title: 'New laptop',
      targetAmount: 2200,
      currentAmount: 1900,
    },
  ]);
  await SavingsPlan.create({
    user: user._id,
    interval: 'monthly',
    goalRatios: {
      'Emergency fund': 0.5,
      'Japan trip': 0.35,
      'New laptop': 0.15,
    },
  });
}
