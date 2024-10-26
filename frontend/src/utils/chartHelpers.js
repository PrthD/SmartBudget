// Generate monthly data for income and expense
export const generateMonthlyData = (incomeData, expenseData) => {
  const monthlyTotals = {};

  incomeData.forEach((income) => {
    const month = new Date(income.date).toLocaleString('default', {
      month: 'short',
    });
    monthlyTotals[month] = monthlyTotals[month] || { income: 0, expenses: 0 };
    monthlyTotals[month].income += income.amount;
  });

  expenseData.forEach((expense) => {
    const month = new Date(expense.date).toLocaleString('default', {
      month: 'short',
    });
    monthlyTotals[month] = monthlyTotals[month] || { income: 0, expenses: 0 };
    monthlyTotals[month].expenses += expense.amount;
  });

  return Object.keys(monthlyTotals).map((month) => ({
    month,
    income: monthlyTotals[month].income,
    expenses: monthlyTotals[month].expenses,
  }));
};

// Generate savings data based on monthly data
export const generateSavingsData = (monthlyData) =>
  monthlyData.map((data) => ({
    month: data.month,
    savings: data.income - data.expenses,
  }));
