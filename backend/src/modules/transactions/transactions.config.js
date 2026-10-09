import { Expense, Income } from '../../models/transactions.js';
import { Budget, IncomeGoal } from '../../models/targets.js';

/**
 * Expenses and incomes are handled by one generic module; this is everything
 * that differs between them.
 */
export const TRANSACTION_KINDS = {
  expense: {
    kind: 'expense',
    Model: Expense,
    labelField: 'category',
    labelName: 'Category',
    // Budgets are keyed by expense category.
    TargetModel: Budget,
    targetMapField: 'categoryBudgets',
    extraFields: ['customCategory'],
  },
  income: {
    kind: 'income',
    Model: Income,
    labelField: 'source',
    labelName: 'Source',
    // Income goals are keyed by income source.
    TargetModel: IncomeGoal,
    targetMapField: 'sourceGoals',
    extraFields: [],
  },
};
