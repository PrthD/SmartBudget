import moment from 'moment-timezone';
import { groupExpensesByCategory } from '../utils/expenseHelpers';

/**
 * Calculate the category breakdown for budgets.
 * @param {Array} expenses - List of expenses.
 * @param {Object} categoryBudgets - Category budgets mapping.
 * @returns {Object} - Breakdown of spending and budgets by category.
 */
export const calculateCategoryBreakdown = (expenses, categoryBudgets) => {
  const breakdown = {};

  expenses.forEach((expense) => {
    if (!breakdown[expense.category]) {
      breakdown[expense.category] = {
        spent: 0,
        budget: categoryBudgets[expense.category] || 0,
      };
    }
    breakdown[expense.category].spent += expense.amount;
  });

  return breakdown;
};

/**
 * Get the color for the budget alert based on the percentage spent.
 * @param {number} percentage - Percentage of the budget spent.
 * @returns {string} - Color code for the alert.
 */
export const getBudgetAlertColor = (percentage) => {
  if (percentage < 75) return 'green';
  if (percentage < 90) return 'yellow';
  return 'red';
};

/**
 * Return [startMoment, endMoment] for the chosen interval:
 */
export const getTimeframeDates = (interval) => {
  const now = moment.tz('America/Edmonton');
  let start;
  let end;

  switch (interval) {
    case 'weekly':
      start = now.clone().startOf('week');
      end = now.clone().endOf('week');
      break;
    case 'biweekly':
      start = now.clone().startOf('week');
      end = start.clone().add(2, 'weeks').endOf('day');
      break;
    case 'yearly':
      start = now.clone().startOf('year');
      end = now.clone().endOf('year');
      break;
    default:
      // monthly
      start = now.clone().startOf('month');
      end = now.clone().endOf('month');
  }

  return [start, end];
};

/**
 * Merges the budgetCategories object with any categories found in expenses
 * (ensuring each category has at least a 0 budget if not present).
 * @param {Object} budgetCategories - Existing categoryBudgets from DB.
 * @param {Array} expenses - List of expense objects.
 * @returns {Object} - Combined budget categories with all needed keys.
 */
export const mergeBudgetCategories = (budgetCategories, expenses) => {
  const groupedCategories = groupExpensesByCategory(expenses);
  const combined = { ...budgetCategories };

  groupedCategories.forEach(({ category }) => {
    if (!combined[category]) {
      combined[category] = 0;
    }
  });

  return combined;
};

/**
 * Sorts category names by:
 * 1) Predefined categories in the order of the predefined list.
 * 2) DB categories (not predefined, not newly added) by earliest createdAt date.
 * 3) Newly added categories via the modal - alphabetical.
 *
 * @param {Object} budgets - The { category: budgetValue } map.
 * @param {Array} predefinedList - Array of objects, each with at least { name }.
 * @param {Array} newlyAddedList - Categories explicitly added in the modal session.
 * @param {Object} categoryCreatedAtMap - { [categoryName]: earliestCreationDateString }
 * @returns {Array} - Sorted list of category names.
 */
export const sortCategoryBudgets = (
  budgets,
  predefinedList,
  newlyAddedList,
  categoryCreatedAtMap = {}
) => {
  const allCategories = Object.keys(budgets);

  const predefinedOrder = predefinedList.map((catObj) => catObj.name);
  const sortedPredefined = predefinedOrder.filter((catName) =>
    allCategories.includes(catName)
  );

  const dbCategories = allCategories.filter(
    (cat) => !sortedPredefined.includes(cat) && !newlyAddedList.includes(cat)
  );

  dbCategories.sort((a, b) => {
    const dateA = new Date(categoryCreatedAtMap[a] || '2999-01-01');
    const dateB = new Date(categoryCreatedAtMap[b] || '2999-01-01');
    return dateA - dateB;
  });

  const newCategories = newlyAddedList.filter((cat) =>
    allCategories.includes(cat)
  );
  newCategories.sort((a, b) => a.localeCompare(b));

  return [...sortedPredefined, ...dbCategories, ...newCategories];
};

// Helper to build a unique key for BudgetCard alerts
export function getBudgetAlertKey(interval, totalSpent, totalBudget) {
  const spentRounded = Math.round(totalSpent);
  const budgetRounded = Math.round(totalBudget);

  return `budgetAlert-${interval}-spent=${spentRounded}-budget=${budgetRounded}`;
}
