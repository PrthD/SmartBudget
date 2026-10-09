import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

/**
 * Everything that differs between expenses and income. The pages, table,
 * form and hooks are shared and driven by this config.
 */
export const TRANSACTION_KINDS = {
  expense: {
    kind: 'expense',
    path: '/expenses', // API
    route: '/expenses', // app page
    labelField: 'category',
    labelName: 'Category',
    labelPlural: 'categories',
    title: 'Expenses',
    singular: 'expense',
    description: 'Track spending, recurring bills and your budget.',
    icon: ArrowDownRight,
    tone: 'expense',
    target: { path: '/budget', name: 'Budget', verb: 'spent' },
    defaultLabels: [
      'Groceries',
      'Housing',
      'Transportation',
      'Dining',
      'Utilities',
      'Entertainment',
      'Health',
      'Shopping',
    ],
  },
  income: {
    kind: 'income',
    path: '/incomes', // API
    route: '/income', // app page
    labelField: 'source',
    labelName: 'Source',
    labelPlural: 'sources',
    title: 'Income',
    singular: 'income',
    description: 'Track earnings, paydays and your income goal.',
    icon: ArrowUpRight,
    tone: 'income',
    target: { path: '/income-goal', name: 'Income goal', verb: 'earned' },
    defaultLabels: ['Salary', 'Freelance', 'Investments', 'Gifts', 'Refunds'],
  },
};

export const FREQUENCIES = ['once', 'weekly', 'biweekly', 'monthly', 'yearly'];
export const INTERVALS = ['weekly', 'biweekly', 'monthly', 'yearly'];
