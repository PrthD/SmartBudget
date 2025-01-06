// File: src/pages/Dashboard.js

import React, { useMemo, useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { fetchIncomes } from '../services/incomeService';
import { fetchExpenses } from '../services/expenseService';
import { fetchBudget } from '../services/budgetService'; // Updated import
import { calculateTotalIncome } from '../utils/incomeHelpers';
import { calculateTotalExpense } from '../utils/expenseHelpers';
import {
  generateMonthlyData,
  generateSavingsData,
} from '../utils/chartHelpers';
import {
  FaDollarSign,
  FaMoneyBillWave,
  FaPiggyBank,
  FaChartLine,
} from 'react-icons/fa';
import { notifyError } from '../utils/notificationService';
import NavBar from '../components/common/NavBar';
import IncomeVsExpenseChart from '../components/charts/IncomeVsExpenseChart';
import MonthlyTrendsChart from '../components/charts/MonthlyTrendsChart';
import SavingsChart from '../components/charts/SavingsChart';
import GoalCard from '../components/incomes/GoalCard';
import BudgetCard from '../components/expenses/BudgetCard';
import 'react-circular-progressbar/dist/styles.css';
import '../styles/Dashboard.css';
import { LoadingContext } from '../contexts/LoadingContext';

const Dashboard = () => {
  const [incomeData, setIncomeData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);
  // Removed goalData state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { setLoading: setGlobalLoading } = useContext(LoadingContext);

  // Fetch all necessary data
  const fetchDashboardData = async () => {
    try {
      setGlobalLoading(true);
      const [incomes, expenses] = await Promise.all([
        fetchIncomes(),
        fetchExpenses(),
        fetchBudget(),
      ]);

      setIncomeData(incomes);
      setExpenseData(expenses);
      // Removed setGoalData(goal)
      setError('');
    } catch (err) {
      const errorMsg =
        err.response?.data?.error || 'Failed to load dashboard data.';
      setError(errorMsg);
      notifyError(errorMsg);
    } finally {
      setLoading(false);
      setGlobalLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Calculate key metrics
  const totalIncome = useMemo(
    () => calculateTotalIncome(incomeData),
    [incomeData]
  );

  const totalExpense = useMemo(
    () => calculateTotalExpense(expenseData),
    [expenseData]
  );

  const totalSavings = useMemo(
    () => totalIncome - totalExpense,
    [totalIncome, totalExpense]
  );

  // Generate data for charts
  const monthlyData = useMemo(
    () => generateMonthlyData(incomeData, expenseData),
    [incomeData, expenseData]
  );

  const savingsData = useMemo(
    () => generateSavingsData(monthlyData),
    [monthlyData]
  );

  // Handle Refresh
  const handleRefresh = () => {
    fetchDashboardData();
  };

  return (
    <div className="dashboard">
      <NavBar />

      <header className="dashboard-header">
        <h1>SmartBudgetAI Dashboard</h1>
        <button
          className="refresh-btn"
          onClick={handleRefresh}
          title="Refresh Dashboard"
        >
          &#8635;
        </button>
      </header>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading your financial overview...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <p>{error}</p>
          <button onClick={handleRefresh} className="retry-btn">
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* Key Financial Metrics */}
          <section className="metrics-overview">
            <div className="metric-card income-card">
              <FaDollarSign className="metric-icon" />
              <div className="metric-info">
                <h3>Total Income</h3>
                <p>${totalIncome.toFixed(2)}</p>
              </div>
            </div>
            <div className="metric-card expense-card">
              <FaMoneyBillWave className="metric-icon" />
              <div className="metric-info">
                <h3>Total Expenses</h3>
                <p>${totalExpense.toFixed(2)}</p>
              </div>
            </div>
            <div className="metric-card savings-card">
              <FaPiggyBank className="metric-icon" />
              <div className="metric-info">
                <h3>Total Savings</h3>
                <p>${totalSavings.toFixed(2)}</p>
              </div>
            </div>
          </section>

          {/* Financial Goals */}
          <section className="goals-section">
            <h2>Your Income Goals</h2>
            <GoalCard incomes={incomeData} />
          </section>

          {/* Budgets Overview */}
          <section className="budgets-section">
            <h2>Your Budgets</h2>
            <BudgetCard expenses={expenseData} />
          </section>

          {/* Charts Overview */}
          <section className="charts-overview">
            <div className="chart-container">
              <h3>Income vs Expenses Overview</h3>
              <IncomeVsExpenseChart
                totalIncome={totalIncome}
                totalExpense={totalExpense}
              />
            </div>
            <div className="chart-container">
              <h3>Monthly Trends</h3>
              <MonthlyTrendsChart monthlyData={monthlyData} />
            </div>
            <div className="chart-container">
              <h3>Savings Over Time</h3>
              <SavingsChart savingsData={savingsData} />
            </div>
          </section>

          {/* Navigation Links */}
          <section className="dashboard-navigation">
            <Link to="/expenses">
              <button className="dashboard-btn">
                <FaMoneyBillWave className="nav-icon" />
                Manage Expenses
              </button>
            </Link>
            <Link to="/incomes">
              <button className="dashboard-btn">
                <FaDollarSign className="nav-icon" />
                Manage Incomes
              </button>
            </Link>
            <Link to="/savings">
              <button className="dashboard-btn">
                <FaPiggyBank className="nav-icon" />
                Savings Goals
              </button>
            </Link>
            <Link to="/charts">
              <button className="dashboard-btn">
                <FaChartLine className="nav-icon" />
                Advanced Charts & Analytics
              </button>
            </Link>
          </section>

          {/* Summary Section */}
          <section className="dashboard-summary">
            <p>
              Welcome to your SmartBudgetAI Dashboard! Here you can get a
              comprehensive overview of your financial health, track your income
              and expenses, set and monitor your income goals, and analyze your
              savings trends. Use the navigation buttons above to dive deeper
              into each section and take full control of your finances.
            </p>
          </section>
        </>
      )}
    </div>
  );
};

export default Dashboard;
