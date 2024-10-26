// Validate expense form data
export const validateExpenseData = ({ category, amount }) => {
  if (!category || !amount || amount <= 0) {
    throw new Error('Invalid expense data: category and amount are required');
  }
};

// Group expenses by category and frequency
export const groupExpensesByCategory = (expenses) => {
  const grouped = {};
  expenses.forEach((expense) => {
    const key = `${expense.category}-${expense.frequency}`;
    if (expense.isOriginal) {
      if (!grouped[key]) {
        grouped[key] = { ...expense, futureInstances: [] };
      }
    } else {
      if (grouped[key]) {
        grouped[key].futureInstances.push(expense);
      }
    }
  });
  return Object.values(grouped);
};
