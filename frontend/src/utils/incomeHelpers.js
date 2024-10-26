// Validate income form data
export const validateIncomeData = ({ source, amount }) => {
  if (!source || !amount || amount <= 0) {
    throw new Error('Invalid income data: source and amount are required');
  }
};

// Group incomes by source and frequency
export const groupIncomesBySource = (incomes) => {
  const grouped = {};
  incomes.forEach((income) => {
    const key = `${income.category}-${income.frequency}`;
    if (income.isOriginal) {
      if (!grouped[key]) {
        grouped[key] = { ...income, futureInstances: [] };
      }
    } else {
      if (grouped[key]) {
        grouped[key].futureInstances.push(income);
      }
    }
  });
  return Object.values(grouped);
};
