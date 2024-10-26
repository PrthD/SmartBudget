import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import IncomeVsExpensesChart from '../components/charts/IncomeVsExpenseChart';
import MonthlyTrendsChart from '../components/charts/MonthlyTrendsChart';
import SavingsChart from '../components/charts/SavingsChart';
// import '../styles/ChartsPage.css';

const ChartsPage = () => {
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
        console.error('Error fetching chart data:', error);
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
    <div className="charts-page">
      <h2>Charts & Analytics</h2>
      <IncomeVsExpensesChart
        totalIncome={totalIncome}
        totalExpenses={totalExpenses}
      />
      <h2>Monthly Trends</h2>
      <MonthlyTrendsChart monthlyData={monthlyData} />
      <h2>Savings</h2>
      <SavingsChart savingsData={savingsData} />
    </div>
  );
};

ChartsPage.propTypes = {
  onIncomeAdded: PropTypes.func,
  onExpenseAdded: PropTypes.func,
};

export default ChartsPage;
