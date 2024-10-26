// Validate income form data
export const validateIncomeData = ({ source, amount }) => {
  if (!source || !amount || amount <= 0) {
    throw new Error('Invalid income data: source and amount are required');
  }
};

// Calculate total income
export const calculateTotalIncome = (incomeData) =>
  incomeData
    .filter((income) => new Date(income.date) <= new Date())
    .reduce((sum, income) => sum + income.amount, 0);

// Group incomes by source and frequency
export const groupIncomesBySource = (incomes) => {
  const grouped = {};

  incomes.forEach((income) => {
    // Use a unique key for each income source and frequency
    const key = `${income.source}-${income.frequency}`;

    if (income.isOriginal) {
      // Initialize each entry with unique ID to avoid overwriting
      grouped[key] = { ...income, futureInstances: [] };
    } else {
      // Find the original entry to group recurring instances
      const originalKey = `${income.source}-${income.frequency}`;
      if (grouped[originalKey]) {
        grouped[originalKey].futureInstances.push(income);
      }
    }
  });

  return Object.values(grouped);
};
