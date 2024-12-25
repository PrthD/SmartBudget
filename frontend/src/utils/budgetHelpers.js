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
