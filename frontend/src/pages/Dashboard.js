import React, { useState, useEffect } from 'react';
import '../styles/Dashboard.css';
import IncomeVsExpensesChart from '../components/charts/IncomeVsExpensesChart';
import MonthlyTrendsChart from '../components/charts/MonthlyTrendsChart';
import SavingsChart from '../components/charts/SavingsChart';
import PropTypes from 'prop-types';

const Dashboard = ({ incomeData, expenseData }) => {
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [savings, setSavings] = useState(0);
  const [monthlyData, setMonthlyData] = useState([]);
  const [savingsData, setSavingsData] = useState([]);

  useEffect(() => {
    const totalIncomeCalc = incomeData.reduce(
      (sum, income) => sum + income.amount,
      0
    );
    const totalExpensesCalc = expenseData.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );

    setTotalIncome(totalIncomeCalc);
    setTotalExpenses(totalExpensesCalc);
    setSavings(totalIncomeCalc - totalExpensesCalc);

    // Generate monthly data
    const monthlyDataCalc = generateMonthlyData(incomeData, expenseData);
    setMonthlyData(monthlyDataCalc);

    // Generate savings data
    const savingsDataCalc = generateSavingsData(monthlyDataCalc);
    setSavingsData(savingsDataCalc);
  }, [incomeData, expenseData]);

  // Function to generate monthly trend data
  const generateMonthlyData = (incomeData, expenseData) => {
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

  // Function to generate savings data from monthly trends
  const generateSavingsData = (monthlyData) => {
    return monthlyData.map((data) => ({
      month: data.month,
      savings: data.income - data.expenses,
    }));
  };

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
        {/* Pass incomeData and expenseData as props to IncomeVsExpensesChart */}
        <IncomeVsExpensesChart
          totalIncome={totalIncome}
          totalExpenses={totalExpenses}
        />
        {/* Pass monthlyData as prop to MonthlyTrendsChart */}
        <MonthlyTrendsChart monthlyData={monthlyData} />
        {/* Pass savingsData as prop to SavingsChart */}
        <SavingsChart savingsData={savingsData} />
      </div>
    </div>
  );
};

// Define PropTypes for the Dashboard component
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
