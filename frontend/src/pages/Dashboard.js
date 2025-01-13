import React, { useMemo, useEffect, useState, useContext } from 'react';
import { fetchIncomes } from '../services/incomeService';
import { fetchExpenses } from '../services/expenseService';
import { fetchSavingsGoals } from '../services/savingsService';
import { fetchBudget } from '../services/budgetService';
import { fetchIncomeGoal } from '../services/incomeGoalService';
import { fetchSavingsGoal } from '../services/savingsGoalService';
import { calculateTotalIncomeInInterval } from '../utils/incomeHelpers';
import { calculateTotalExpenseInInterval } from '../utils/expenseHelpers';
import { getSavingsTimeframe } from '../utils/savingsGoalHelpers';
import {
  generateMonthlyData,
  generateSavingsData,
} from '../utils/chartHelpers';
import { FaDollarSign, FaMoneyBillWave, FaPiggyBank } from 'react-icons/fa';
import { notifyError } from '../utils/notificationService';
import NavBar from '../components/common/NavBar';
import BudgetOverviewCard from '../components/dashboard/BudgetOverviewCard';
import GoalOverviewCard from '../components/dashboard/GoalOverviewCard';
import SavingsGoalOverviewCard from '../components/dashboard/SavingsGoalOverviewCard';
import ChartSwiper from '../components/charts/ChartSwiper';
import noChartDataIcon from '../assets/icons/no-chart-data.png';
import '../styles/dashboard/Dashboard.css';
import { LoadingContext } from '../contexts/LoadingContext';

const intervals = ['weekly', 'biweekly', 'monthly', 'yearly'];

const Dashboard = () => {
  const [incomeData, setIncomeData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);
  const [interval, setInterval] = useState('monthly');
  const [savingsData, setSavingsData] = useState([]);
  const [budgetInfo, setBudgetInfo] = useState(null);
  const [incomeGoalInfo, setIncomeGoalInfo] = useState(null);
  const [savingsGoalInfo, setSavingsGoalInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { setLoading: setGlobalLoading } = useContext(LoadingContext);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setGlobalLoading(true);
      const [incomes = [], expenses = [], savingsGoals = []] =
        await Promise.allSettled([
          fetchIncomes(),
          fetchExpenses(),
          fetchSavingsGoals(),
        ]).then((results) =>
          results.map((result) =>
            result.status === 'fulfilled' ? result.value : []
          )
        );

      let fetchedBudget, fetchedGoal, fetchedSavings;
      try {
        fetchedBudget = await fetchBudget();
      } catch (err) {
        fetchedBudget = null;
      }
      try {
        fetchedGoal = await fetchIncomeGoal();
      } catch (err) {
        fetchedGoal = null;
      }
      try {
        fetchedSavings = await fetchSavingsGoal();
      } catch (err) {
        fetchedSavings = null;
      }

      setBudgetInfo(fetchedBudget);
      setIncomeGoalInfo(fetchedGoal);
      setSavingsGoalInfo(fetchedSavings);

      setIncomeData(incomes);
      setExpenseData(expenses);
      setSavingsData(savingsGoals);
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

  const handleIntervalChange = () => {
    const currentIndex = intervals.indexOf(interval);
    const nextIndex = (currentIndex + 1) % intervals.length;
    setInterval(intervals[nextIndex]);
  };

  const [startDate, endDate] = useMemo(() => {
    return getSavingsTimeframe(interval);
  }, [interval]);

  const totalIncome = useMemo(
    () => calculateTotalIncomeInInterval(incomeData, startDate, endDate),
    [incomeData, startDate, endDate]
  );

  const totalExpense = useMemo(
    () => calculateTotalExpenseInInterval(expenseData, startDate, endDate),
    [expenseData, startDate, endDate]
  );

  const totalSavings = useMemo(
    () => totalIncome - totalExpense,
    [totalIncome, totalExpense]
  );

  const monthlyChartData = useMemo(
    () => generateMonthlyData(incomeData || [], expenseData || []) || [],
    [incomeData, expenseData]
  );

  const savingsChartData = useMemo(
    () => generateSavingsData(monthlyChartData || []) || [],
    [monthlyChartData]
  );

  const isBudgetEmpty = !budgetInfo;
  const isGoalEmpty = !incomeGoalInfo;
  const isSavingsEmpty = !savingsGoalInfo;

  function getOverviewLayoutState() {
    return isBudgetEmpty || isGoalEmpty || isSavingsEmpty
      ? 'empty-state'
      : 'filled-state';
  }

  const isChartDataEmpty = monthlyChartData.length === 0;

  const containerClass = `overview-charts-container ${getOverviewLayoutState()}`;
  const sectionClass = `overview-section ${getOverviewLayoutState()}`;
  const chartClass = `chart-swiper-container ${
    isChartDataEmpty ? 'empty-state' : 'filled-state'
  }`;

  if (loading) {
    return (
      <div className="dashboard-loading">
        <NavBar />
        <div className="loader">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <NavBar />
        <div className="error-message">
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={fetchDashboardData} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <NavBar />

      <div className="dashboard-container">
        {/* Metrics Section */}
        <section className="metrics-section">
          <div
            className="metric-card income-card"
            onClick={handleIntervalChange}
          >
            <FaDollarSign className="metric-icon" />
            <div className="metric-info">
              <h3>Total Income</h3>
              <p>${totalIncome.toFixed(2)}</p>
              <small>Interval: {interval}</small>
            </div>
          </div>

          <div
            className="metric-card expense-card"
            onClick={handleIntervalChange}
          >
            <FaMoneyBillWave className="metric-icon" />
            <div className="metric-info">
              <h3>Total Expenses</h3>
              <p>${totalExpense.toFixed(2)}</p>
              <small>Interval: {interval}</small>
            </div>
          </div>

          <div
            className="metric-card savings-card"
            onClick={handleIntervalChange}
          >
            <FaPiggyBank className="metric-icon" />
            <div className="metric-info">
              <h3>Total Savings</h3>
              <p>${totalSavings.toFixed(2)}</p>
              <small>Interval: {interval}</small>
            </div>
          </div>
        </section>

        {/* Overview left, chart right */}
        <div className={containerClass}>
          <section className={sectionClass}>
            {<BudgetOverviewCard expenses={expenseData} />}
            {<GoalOverviewCard incomes={incomeData} />}
            {
              <SavingsGoalOverviewCard
                incomes={incomeData}
                expenses={expenseData}
                allSubGoals={savingsData
                  .filter((g) => g && g.title)
                  .map((g) => ({
                    name: g.title,
                    deadline: g.deadline,
                    currentAmount: g.currentAmount,
                    targetAmount: g.targetAmount,
                    ratio: 0,
                  }))}
              />
            }
          </section>

          {/* Chart area */}
          <div className={chartClass}>
            {isChartDataEmpty ? (
              <div
                className={`no-chart-data ${
                  isChartDataEmpty ? getOverviewLayoutState() : ''
                }`}
              >
                <img
                  src={noChartDataIcon}
                  alt="No Chart Data"
                  className="no-chart-data-image"
                />
                <p className="no-chart-data-message">
                  📊 No data available for charts! <br />
                  Add income or expenses to visualize your financial trends. 🚀
                </p>
              </div>
            ) : (
              <ChartSwiper
                savingsChartData={savingsChartData}
                monthlyChartData={monthlyChartData}
                totalIncome={totalIncome}
                totalExpense={totalExpense}
              />
            )}
          </div>
        </div>
      </div>

      {/* Summary Section */}
      <section className="dashboard-summary">
        <p>
          Welcome to your Smart Budget Dashboard! Here you can get a
          comprehensive overview of your financial health, track your income and
          expenses, set and monitor your income goals, and analyze your savings
          trends.
        </p>
      </section>
    </div>
  );
};

export default Dashboard;
