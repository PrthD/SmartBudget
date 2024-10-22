import React, { useMemo, useEffect, useState } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import '../styles/Dashboard.css';
import IncomeVsExpensesChart from '../components/charts/IncomeVsExpensesChart';
import MonthlyTrendsChart from '../components/charts/MonthlyTrendsChart';
import SavingsChart from '../components/charts/SavingsChart';
import SavingsForm from '../components/savings/SavingsForm';

const Dashboard = ({
  incomeData,
  expenseData,
  onIncomeAdded,
  onExpenseAdded,
}) => {
  const [expandedIncome, setExpandedIncome] = useState({});
  const [expandedExpense, setExpandedExpense] = useState({});
  const [savingsGoals, setSavingsGoals] = useState([]);

  useEffect(() => {
    const fetchSavingsGoals = async () => {
      try {
        const response = await axios.get(
          'http://localhost:5000/api/savings-goals'
        );
        setSavingsGoals(response.data);
      } catch (error) {
        console.error('Error fetching savings goals:', error);
      }
    };

    fetchSavingsGoals();

    if (onIncomeAdded) onIncomeAdded();
    if (onExpenseAdded) onExpenseAdded();
  }, [onIncomeAdded, onExpenseAdded]);

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

  const groupedIncomes = useMemo(() => {
    const grouped = {};
    incomeData.forEach((income) => {
      const key = `${income.source}-${income.frequency}`;
      if (income.isOriginal) {
        if (!grouped[key]) {
          grouped[key] = { ...income, futureInstances: [] };
        }
      } else {
        if (grouped[key]) {
          grouped[key].futureInstances.push(income);
        }
      }
    });
    return Object.values(grouped);
  }, [incomeData]);

  const groupedExpenses = useMemo(() => {
    const grouped = {};
    expenseData.forEach((expense) => {
      const key = `${expense.category}-${expense.frequency}`;
      if (expense.isOriginal) {
        if (!grouped[key]) {
          grouped[key] = { ...expense, futureInstances: [] };
        }
      } else {
        if (grouped[key]) {
          grouped[key].futureInstances.push(expense);
        }
      }
    });
    return Object.values(grouped);
  }, [expenseData]);

  const toggleExpandIncome = (id) => {
    setExpandedIncome((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleExpandExpense = (id) => {
    setExpandedExpense((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSaveGoal = (goal) => {
    if (!goal || !goal.title || !goal.targetAmount) {
      console.error('Invalid goal data', goal);
      return;
    }
    setSavingsGoals((prevGoals) => [...prevGoals, goal]);
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

      {/* Savings Form */}
      <SavingsForm onSave={handleSaveGoal} />

      {/* Your Savings Goals */}
      <div className="savings-goals">
        <h2>Your Savings Goals</h2>
        {savingsGoals.length > 0 ? (
          savingsGoals.map((goal, index) => (
            <div key={index} className="savings-goal">
              <h3>{goal.title}</h3>
              <p>Target Amount: ${goal.targetAmount}</p>
              <p>Current Amount: ${savings}</p>
              {goal.deadline && (
                <p>Deadline: {new Date(goal.deadline).toLocaleDateString()}</p>
              )}
            </div>
          ))
        ) : (
          <p>No savings goals set yet.</p>
        )}
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

      {/* Your Incomes Table */}
      <div className="your-incomes">
        <h2>Your Incomes</h2>
        {groupedIncomes.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Source</th>
                <th>Amount</th>
                <th>Frequency</th>
                <th>Date Added</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {groupedIncomes.map((income) => (
                <React.Fragment key={income._id}>
                  <tr>
                    <td>{income.source}</td>
                    <td>${income.amount}</td>
                    <td>{income.frequency}</td>
                    <td>{new Date(income.date).toLocaleDateString()}</td>
                    <td>{income.description || ''}</td>
                    <td>
                      {income.frequency !== 'once' && (
                        <button onClick={() => toggleExpandIncome(income._id)}>
                          {expandedIncome[income._id] ? 'Collapse' : 'Expand'}
                        </button>
                      )}
                    </td>
                  </tr>

                  {/* Collapsible section for future recurring instances */}
                  {expandedIncome[income._id] &&
                    income.futureInstances.length > 0 &&
                    income.futureInstances.map((instance) => (
                      <tr key={instance._id}>
                        <td colSpan="2">
                          Recurring on:{' '}
                          {new Date(instance.date).toLocaleDateString()}
                        </td>
                        <td colSpan="2">Amount: ${instance.amount}</td>
                      </tr>
                    ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No recurring incomes</p>
        )}
      </div>

      {/* Your Expenses Table */}
      <div className="your-expenses">
        <h2>Your Expenses</h2>
        {groupedExpenses.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Amount</th>
                <th>Frequency</th>
                <th>Date Added</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {groupedExpenses.map((expense) => (
                <React.Fragment key={expense._id}>
                  <tr>
                    <td>{expense.category}</td>
                    <td>${expense.amount}</td>
                    <td>{expense.frequency}</td>
                    <td>{new Date(expense.date).toLocaleDateString()}</td>
                    <td>{expense.description || ''}</td>
                    <td>
                      {expense.frequency !== 'once' && (
                        <button
                          onClick={() => toggleExpandExpense(expense._id)}
                        >
                          {expandedExpense[expense._id] ? 'Collapse' : 'Expand'}
                        </button>
                      )}
                    </td>
                  </tr>

                  {/* Collapsible section for future recurring instances */}
                  {expandedExpense[expense._id] &&
                    expense.futureInstances.length > 0 &&
                    expense.futureInstances.map((instance) => (
                      <tr key={instance._id}>
                        <td colSpan="2">
                          Recurring on:{' '}
                          {new Date(instance.date).toLocaleDateString()}
                        </td>
                        <td colSpan="2">Amount: ${instance.amount}</td>
                      </tr>
                    ))}
                </React.Fragment>
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
  onIncomeAdded: PropTypes.func,
  onExpenseAdded: PropTypes.func,
};

export default Dashboard;
