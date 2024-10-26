import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import SavingsForm from '../components/savings/SavingsForm';
// import '../styles/SavingsPage.css';

const SavingsPage = ({ onSavingsGoalAdded }) => {
  const [incomeData, setIncomeData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);
  const [savingsGoals, setSavingsGoals] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const incomes = await axios.get('http://localhost:5000/api/income');
        const expenses = await axios.get('http://localhost:5000/api/expense');
        const savingsGoalsResponse = await axios.get(
          'http://localhost:5000/api/savings'
        );
        setIncomeData(incomes.data);
        setExpenseData(expenses.data);
        setSavingsGoals(savingsGoalsResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();

    if (onSavingsGoalAdded) onSavingsGoalAdded();
  }, [onSavingsGoalAdded]);

  const handleSaveGoal = (goal) => {
    if (!goal || !goal.title || !goal.targetAmount) {
      console.error('Invalid goal data', goal);
      return;
    }
    setSavingsGoals((prevGoals) => [...prevGoals, goal]);
  };

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

  return (
    <div className="savings-page">
      <h2>Your Savings</h2>
      <h3>Total Savings: ${totalSavings}</h3>

      {/* Render the Savings Form */}
      <h2>Your Savings Goals</h2>
      <SavingsForm onSave={handleSaveGoal} />

      {/* Render the Savings Goals Table */}
      {savingsGoals.length > 0 ? (
        savingsGoals.map((goal, index) => (
          <div key={index} className="savings-goal">
            <h3>{goal.title}</h3>
            <p>Target Amount: ${goal.targetAmount}</p>
            <p>Current Amount: ${totalSavings}</p>
            {goal.deadline && (
              <p>
                Deadline:{' '}
                {new Date(goal.deadline).toLocaleDateString(undefined, {
                  timeZone: 'UTC',
                })}
              </p>
            )}
          </div>
        ))
      ) : (
        <p>No savings goals set yet.</p>
      )}
    </div>
  );
};

SavingsPage.propTypes = {
  onSavingsGoalAdded: PropTypes.func,
};

export default SavingsPage;
