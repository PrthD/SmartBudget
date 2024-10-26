import React, { useState, useMemo, useEffect } from 'react';
import { fetchExpenses } from '../services/expenseService';
import { groupExpensesByCategory } from '../utils/expenseHelpers';
import ExpenseForm from '../components/expenses/ExpenseForm';
// import '../styles/ExpensePage.css';

const ExpensesPage = () => {
  const [expenseData, setExpenseData] = useState([]);
  const [expandedExpense, setExpandedExpense] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const handleExpenseAdded = async () => {
    try {
      setLoading(true);
      const expenses = await fetchExpenses();
      setExpenseData(expenses);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleExpenseAdded();
  }, []);

  const totalExpense = useMemo(
    () =>
      expenseData
        .filter((expense) => new Date(expense.date) <= new Date())
        .reduce((sum, expense) => sum + expense.amount, 0),
    [expenseData]
  );

  const groupedExpenses = useMemo(
    () => groupExpensesByCategory(expenseData),
    [expenseData]
  );

  const toggleExpandExpense = (id) => {
    setExpandedExpense((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="expenses-page">
      <h2>Your Expenses</h2>
      <h3>Total Expenses: ${totalExpense}</h3>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : (
        <>
          {/* Render the Expense Form */}
          <ExpenseForm onExpenseAdded={handleExpenseAdded} />

          {/* Render the Expenses Table */}
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
                            {expandedExpense[expense._id]
                              ? 'Collapse'
                              : 'Expand'}
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
        </>
      )}
    </div>
  );
};

export default ExpensesPage;
