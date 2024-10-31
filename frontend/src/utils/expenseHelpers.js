// Validate expense form data
export const validateExpenseData = ({ category, amount }) => {
  if (!category || !amount || amount <= 0) {
    const errorMsg =
      'Validation failed: Category and positive amount are required.';
    console.warn(errorMsg);
    throw new Error(errorMsg);
  }
};

// Calculate total expense
export const calculateTotalExpense = (expenseData) => {
  if (!Array.isArray(expenseData)) {
    const errorMsg = 'Invalid data: Expense data must be an array.';
    console.warn(errorMsg);
    throw new Error(errorMsg);
  }
  return expenseData
    .filter((expense) => new Date(expense.date) <= new Date())
    .reduce((sum, expense) => sum + (expense.amount || 0), 0);
};

// Group expenses by category and frequency
export const groupExpensesByCategory = (expenses) => {
  if (!Array.isArray(expenses)) {
    const errorMsg = 'Invalid data: Expenses must be an array.';
    console.warn(errorMsg);
    throw new Error(errorMsg);
  }

  const grouped = {};

  expenses.forEach((expense) => {
    if (!expense.category || !expense.frequency) return;

    // Create a unique key for each category and frequency combination
    const key = `${expense.category}-${expense.frequency}`;

    if (expense.isOriginal) {
      grouped[key] = { ...expense, futureInstances: [] };
    } else {
      const originalKey = `${expense.category}-${expense.frequency}`;
      if (grouped[originalKey]) {
        grouped[originalKey].futureInstances.push(expense);
      }
    }
  });

  return Object.values(grouped);
};
