import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import '../styles/Dashboard.css';
import IncomeVsExpensesChart from '../components/charts/IncomeVsExpensesChart';
import MonthlyTrendsChart from '../components/charts/MonthlyTrendsChart';
import SavingsChart from '../components/charts/SavingsChart';

const Dashboard = ({ incomeData, expenseData }) => {
  const totalIncome = useMemo(
    () => incomeData.reduce((sum, income) => sum + income.amount, 0),
    [incomeData]
  );
  const totalExpenses = useMemo(
    () => expenseData.reduce((sum, expense) => sum + expense.amount, 0),
    [expenseData]
  );
  const savings = totalIncome - totalExpenses;

  const monthlyData = useMemo(() => {
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
  }, [incomeData, expenseData]);

  const savingsData = useMemo(
    () =>
      monthlyData.map((data) => ({
        month: data.month,
        savings: data.income - data.expenses,
      })),
    [monthlyData]
  );

  return (
    <div className="dashboard">
      <h1>SmartBudgetAI Dashboard</h1>

      {/* Display Key Financial Metrics */}
      <div className="metrics">
        <div className="metric-card">
          <h3>Total Income</h3>
          <p>${totalIncome}</p>
        </div>
        <div className="metric-card">
          <h3>Total Expenses</h3>
          <p>${totalExpenses}</p>
        </div>
        <div className="metric-card">
          <h3>Savings</h3>
          <p>${savings}</p>
        </div>
      </div>

      {/* Render Chart Components */}
      <div className="charts">
        <IncomeVsExpensesChart
          totalIncome={totalIncome}
          totalExpenses={totalExpenses}
        />
        <MonthlyTrendsChart monthlyData={monthlyData} />
        <SavingsChart savingsData={savingsData} />
      </div>
    </div>
  );
};

Dashboard.propTypes = {
  incomeData: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      amount: PropTypes.number.isRequired,
      date: PropTypes.string.isRequired,
      source: PropTypes.string.isRequired,
      description: PropTypes.string,
    })
  ).isRequired,
  expenseData: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      amount: PropTypes.number.isRequired,
      date: PropTypes.string.isRequired,
      category: PropTypes.string.isRequired,
      description: PropTypes.string,
    })
  ).isRequired,
};

export default Dashboard;
