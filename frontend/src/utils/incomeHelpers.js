// Validate income form data
export const validateIncomeData = ({ source, amount }) => {
  if (!source || !amount || amount <= 0) {
    const errorMsg =
      'Validation failed: Source and positive amount are required.';
    console.warn(errorMsg);
    throw new Error(errorMsg);
  }
};

// Calculate total income
export const calculateTotalIncome = (incomeData) => {
  if (!Array.isArray(incomeData)) {
    const errorMsg = 'Invalid data: Income data must be an array.';
    console.warn(errorMsg);
    throw new Error(errorMsg);
  }
  return incomeData
    .filter((income) => new Date(income.date) <= new Date())
    .reduce((sum, income) => sum + (income.amount || 0), 0);
};

// Group incomes by source and frequency
export const groupIncomesBySource = (incomes) => {
  if (!Array.isArray(incomes)) {
    const errorMsg = 'Invalid data: Incomes must be an array.';
    console.warn(errorMsg);
    throw new Error(errorMsg);
  }

  const grouped = {};

  incomes.forEach((income) => {
    if (!income.source || !income.frequency) return;

    // Create a unique key for each source and frequency combination
    const key = `${income.source}-${income.frequency}`;

    if (income.isOriginal) {
      grouped[key] = { ...income, futureInstances: [] };
    } else {
      const originalKey = `${income.source}-${income.frequency}`;
      if (grouped[originalKey]) {
        grouped[originalKey].futureInstances.push(income);
      }
    }
  });

  return Object.values(grouped);
};
