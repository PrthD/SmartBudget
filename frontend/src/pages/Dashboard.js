import React, { useMemo, useEffect, useState } from 'react';
import { fetchIncomes } from '../services/incomeService';
import { fetchExpenses } from '../services/expenseService';
import { calculateTotalIncome } from '../utils/incomeHelpers';
import { calculateTotalExpense } from '../utils/expenseHelpers';
import {
  generateMonthlyData,
  generateSavingsData,
} from '../utils/chartHelpers';
import { Link } from 'react-router-dom';
import IncomeVsExpenseChart from '../components/charts/IncomeVsExpenseChart';
import MonthlyTrendsChart from '../components/charts/MonthlyTrendsChart';
import SavingsChart from '../components/charts/SavingsChart';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const [incomeData, setIncomeData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchChartData = async () => {
    try {
      setLoading(true);
      const incomes = await fetchIncomes();
      const expenses = await fetchExpenses();
      setIncomeData(incomes);
      setExpenseData(expenses);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChartData();
  }, []);

  const totalIncome = useMemo(
    () => calculateTotalIncome(incomeData),
    [incomeData]
  );

  const totalExpense = useMemo(
    () => calculateTotalExpense(expenseData),
    [expenseData]
  );

  const totalSavings = totalIncome - totalExpense;

  const monthlyData = useMemo(
    () => generateMonthlyData(incomeData, expenseData),
    [incomeData, expenseData]
  );

  const savingsData = useMemo(
    () => generateSavingsData(monthlyData),
    [monthlyData]
  );

  return (
    <div className="dashboard">
      <h1>SmartBudgetAI Dashboard</h1>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : (
        <>
          {/* Overview of Key Financial Metrics */}
          <div className="metrics-overview">
            <div className="metric-card">
              <h3>Total Income</h3>
              <p>${totalIncome.toFixed(2)}</p>
            </div>
            <div className="metric-card">
              <h3>Total Expenses</h3>
              <p>${totalExpense.toFixed(2)}</p>
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
              totalExpense={totalExpense}
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
              <button className="dashboard-btn">
                Advanced Charts & Analytics
              </button>
            </Link>
          </div>

          {/* Summary Section */}
          <div className="dashboard-summary">
            <p>
              This dashboard provides a quick overview of your financial status.
              For detailed management of incomes, expenses, and savings, explore
              the sections above.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
