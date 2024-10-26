import React, { useEffect, useState, useMemo } from 'react';
import { fetchIncomes } from '../services/incomeService';
import { fetchExpenses } from '../services/expenseService';
import { calculateTotalIncome } from '../utils/incomeHelpers';
import { calculateTotalExpense } from '../utils/expenseHelpers';
import {
  generateMonthlyData,
  generateSavingsData,
} from '../utils/chartHelpers';
import IncomeVsExpenseChart from '../components/charts/IncomeVsExpenseChart';
import MonthlyTrendsChart from '../components/charts/MonthlyTrendsChart';
import SavingsChart from '../components/charts/SavingsChart';
// import '../styles/ChartsPage.css';

const ChartsPage = () => {
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

  const monthlyData = useMemo(
    () => generateMonthlyData(incomeData, expenseData),
    [incomeData, expenseData]
  );

  const savingsData = useMemo(
    () => generateSavingsData(monthlyData),
    [monthlyData]
  );

  return (
    <div className="charts-page">
      <h2>Charts & Analytics</h2>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : (
        <>
          <IncomeVsExpenseChart
            totalIncome={totalIncome}
            totalExpense={totalExpense}
          />
          <h2>Monthly Trends</h2>
          <MonthlyTrendsChart monthlyData={monthlyData} />
          <h2>Savings</h2>
          <SavingsChart savingsData={savingsData} />
        </>
      )}
    </div>
  );
};

export default ChartsPage;
