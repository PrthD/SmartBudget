import React, { useEffect, useState, useMemo } from 'react';
import { fetchIncomes } from '../services/incomeService';
import { fetchExpenses } from '../services/expenseService';
import { fetchSavingsGoals } from '../services/savingsService';
import { calculateTotalIncome } from '../utils/incomeHelpers';
import { calculateTotalExpense } from '../utils/expenseHelpers';
import SavingsForm from '../components/savings/SavingsForm';
// import '../styles/SavingsPage.css';

const SavingsPage = () => {
  const [incomeData, setIncomeData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const incomes = await fetchIncomes();
        const expenses = await fetchExpenses();
        const goals = await fetchSavingsGoals();
        setIncomeData(incomes);
        setExpenseData(expenses);
        setSavingsGoals(goals);
      } catch (error) {
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSavingsGoalAdded = async () => {
    try {
      setLoading(true);
      const goals = await fetchSavingsGoals();
      setSavingsGoals(goals);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const totalIncome = useMemo(
    () => calculateTotalIncome(incomeData),
    [incomeData]
  );

  const totalExpense = useMemo(
    () => calculateTotalExpense(expenseData),
    [expenseData]
  );

  const totalSavings = totalIncome - totalExpense;

  return (
    <div className="savings-page">
      <h2>Your Savings</h2>
      <h3>Total Savings: ${totalSavings}</h3>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : (
        <>
          {/* Render the Savings Form */}
          <SavingsForm onSave={handleSavingsGoalAdded} />
          <h2>Your Savings Goals</h2>

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
        </>
      )}
    </div>
  );
};

export default SavingsPage;
