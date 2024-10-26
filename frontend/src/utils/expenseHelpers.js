// Validate expense form data
export const validateExpenseData = ({ category, amount }) => {
  if (!category || !amount || amount <= 0) {
    throw new Error('Invalid expense data: category and amount are required');
  }
};

// Calculate total expense
export const calculateTotalExpense = (expenseData) =>
  expenseData
    .filter((expense) => new Date(expense.date) <= new Date())
    .reduce((sum, expense) => sum + expense.amount, 0);

// Group expenses by category and frequency
export const groupExpensesByCategory = (expenses) => {
  const grouped = {};

  expenses.forEach((expense) => {
    // Use a unique key for each expense category and frequency
    const key = `${expense.category}-${expense.frequency}`;

    if (expense.isOriginal) {
      grouped[key] = { ...expense, futureInstances: [] };
    } else {
      // Use `originalId` to locate the main entry for grouping
      const originalKey = `${expense.category}-${expense.frequency}`;
      if (grouped[originalKey]) {
        grouped[originalKey].futureInstances.push(expense);
      }
    }
  });

  return Object.values(grouped);
};
