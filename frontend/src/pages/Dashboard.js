import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/Dashboard.css';
import IncomeVsExpensesChart from '../components/charts/IncomeVsExpensesChart';
import MonthlyTrendsChart from '../components/charts/MonthlyTrendsChart';
import SavingsChart from '../components/charts/SavingsChart';

const Dashboard = () => {
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [savings, setSavings] = useState(0);
  const [incomeData, setIncomeData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [savingsData, setSavingsData] = useState([]);
  const [recommendations, setRecommendations] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const incomeResponse = await axios.get(
          'http://localhost:5000/api/income'
        );
        setIncomeData(incomeResponse.data);
        const totalIncome = incomeResponse.data.reduce(
          (sum, income) => sum + income.amount,
          0
        );
        setTotalIncome(totalIncome);

        const expensesResponse = await axios.get(
          'http://localhost:5000/api/expenses'
        );
        setExpenseData(expensesResponse.data);
        const totalExpenses = expensesResponse.data.reduce(
          (sum, expense) => sum + expense.amount,
          0
        );
        setTotalExpenses(totalExpenses);

        setSavings(totalIncome - totalExpenses);

        // Generate monthly data from the fetched income and expense data
        const monthlyData = generateMonthlyData(
          incomeResponse.data,
          expensesResponse.data
        );
        setMonthlyData(monthlyData);

        // Generate savings data from total income and expenses
        const savingsData = generateSavingsData(monthlyData);
        setSavingsData(savingsData);

        // Fetch AI recommendations (optional)
        const aiResponse = await axios.post(
          'http://localhost:5000/api/ai/recommendation',
          {
            questionIndex: 0,
            totalExpenses,
            totalIncome,
            savings: totalIncome - totalExpenses,
          }
        );
        setRecommendations(aiResponse.data.data);
      } catch (error) {
        console.error('Error fetching data:', error.message);
      }
    };

    fetchData();
  }, []);

  // Function to generate monthly trend data
  const generateMonthlyData = (incomeData, expenseData) => {
    // Generate monthly totals for income and expenses based on the data
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

      {/* AI Recommendations */}
      <div className="recommendations">
        <h2>AI Budget Recommendations</h2>
        <p>{recommendations}</p>
      </div>

      {/* Render Chart Components */}
      <div className="charts">
        {/* Pass incomeData and expenseData as props to IncomeVsExpensesChart */}
        <IncomeVsExpensesChart
          totalIncome={totalIncome}
          totalExpenses={totalExpenses}
          incomeData={incomeData} // Use these props if needed in the chart
          expenseData={expenseData} // Use these props if needed in the chart
        />
        {/* Pass monthlyData as prop to MonthlyTrendsChart */}
        <MonthlyTrendsChart monthlyData={monthlyData} />
        {/* Pass savingsData as prop to SavingsChart */}
        <SavingsChart savingsData={savingsData} />
      </div>
    </div>
  );
};

export default Dashboard;
