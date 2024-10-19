import React, { useMemo, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import '../styles/Dashboard.css';
import IncomeVsExpensesChart from '../components/charts/IncomeVsExpensesChart';
import MonthlyTrendsChart from '../components/charts/MonthlyTrendsChart';
import SavingsChart from '../components/charts/SavingsChart';

const Dashboard = ({ incomeData, expenseData }) => {
  const [recurringExpenses, setRecurringExpenses] = useState([]);

  useEffect(() => {
    const fetchRecurringExpenses = async () => {
      try {
        const response = await axios.get(
          'http://localhost:5000/api/expenses?recurring=true'
        );
        setRecurringExpenses(response.data);
      } catch (error) {
        console.error('Error fetching recurring expenses:', error);
      }
    };
    fetchRecurringExpenses();
  }, []);

  const handleViewDetails = (expense) => {
    const detailedInstances = recurringExpenses.filter(
      (exp) =>
        exp.category === expense.category && exp.frequency === expense.frequency
    );
    console.log(detailedInstances); // Here you can show this in a modal or expanded view
  };

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

  const groupedRecurringExpenses = useMemo(() => {
    const grouped = {};
    recurringExpenses.forEach((expense) => {
      const key = `${expense.category}-${expense.frequency}`;
      if (!grouped[key]) {
        grouped[key] = { ...expense, count: 0 };
      }
      grouped[key].count += 1;
    });
    return Object.values(grouped);
  }, [recurringExpenses]);

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

      {/* Recurring Expenses Table */}
      <div className="recurring-expenses">
        <h2>Recurring Expenses</h2>
        {groupedRecurringExpenses.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Amount</th>
                <th>Frequency</th>
                <th>Starting Date</th>
                <th>Instances</th> {/* Number of recurring instances */}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {groupedRecurringExpenses.map((expense) => (
                <tr key={`${expense.category}-${expense.frequency}`}>
                  <td>{expense.category}</td>
                  <td>${expense.amount}</td>
                  <td>
                    {expense.frequency.charAt(0).toUpperCase() +
                      expense.frequency.slice(1)}
                  </td>
                  <td>{new Date(expense.date).toLocaleDateString()}</td>
                  <td>{expense.count} times</td>{' '}
                  {/* Display how many times it's recurring */}
                  <td>
                    <button onClick={() => handleViewDetails(expense)}>
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No recurring expenses</p>
        )}
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
