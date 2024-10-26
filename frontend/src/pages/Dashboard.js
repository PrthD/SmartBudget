import React, { useMemo, useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import IncomeVsExpenseChart from '../components/charts/IncomeVsExpenseChart';
import MonthlyTrendsChart from '../components/charts/MonthlyTrendsChart';
import SavingsChart from '../components/charts/SavingsChart';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const [incomeData, setIncomeData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const incomes = await axios.get('http://localhost:5000/api/income');
        const expenses = await axios.get('http://localhost:5000/api/expense');
        setIncomeData(incomes.data);
        setExpenseData(expenses.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const totalIncome = useMemo(
    () =>
      incomeData
        .filter((income) => new Date(income.date) <= new Date())
        .reduce((sum, income) => sum + income.amount, 0),
    [incomeData]
  );

  const totalExpenses = useMemo(
    () =>
      expenseData
        .filter((expense) => new Date(expense.date) <= new Date())
        .reduce((sum, expense) => sum + expense.amount, 0),
    [expenseData]
  );

  const totalSavings = totalIncome - totalExpenses;

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

      {/* Overview of Key Financial Metrics */}
      <div className="metrics-overview">
        <div className="metric-card">
          <h3>Total Income</h3>
          <p>${totalIncome.toFixed(2)}</p>
        </div>
        <div className="metric-card">
          <h3>Total Expenses</h3>
          <p>${totalExpenses.toFixed(2)}</p>
        </div>
        <div className="metric-card">
          <h3>Total Savings</h3>
          <p>${totalSavings.toFixed(2)}</p>
        </div>
      </div>

      {/* Basic Charts Overview */}
      <div className="charts-overview">
        <h2>Income vs Expenses Overview</h2>
        <IncomeVsExpenseChart
          totalIncome={totalIncome}
          totalExpense={totalExpenses}
        />
        <h2>Monthly Trends Overview</h2>
        <MonthlyTrendsChart monthlyData={monthlyData} />
        <h2>Savings Overview</h2>
        <SavingsChart savingsData={savingsData} />
      </div>

      {/* Navigation Links */}
      <div className="dashboard-navigation">
        <Link to="/expense">
          <button className="dashboard-btn">Manage Expenses</button>
        </Link>
        <Link to="/income">
          <button className="dashboard-btn">Manage Incomes</button>
        </Link>
        <Link to="/savings">
          <button className="dashboard-btn">Savings Goals</button>
        </Link>
        <Link to="/charts">
          <button className="dashboard-btn">Advanced Charts & Analytics</button>
        </Link>
      </div>

      {/* Summary Section */}
      <div className="dashboard-summary">
        <p>
          This dashboard provides a quick overview of your financial status. For
          detailed management of incomes, expenses, and savings, explore the
          sections above.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
