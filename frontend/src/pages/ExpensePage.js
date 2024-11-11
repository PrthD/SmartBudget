import React, { useState, useMemo, useEffect } from 'react';
import { fetchExpenses, deleteExpense } from '../services/expenseService';
import {
  calculateTotalExpense,
  groupExpensesByCategory,
} from '../utils/expenseHelpers';
import ExpenseForm from '../components/expenses/ExpenseForm';
import '../styles/ExpensePage.css';

const ExpensesPage = () => {
  const [expenseData, setExpenseData] = useState([]);
  const [expandedExpense, setExpandedExpense] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const handleExpenseAdded = async () => {
    try {
      setLoading(true);
      const updatedExpenses = await fetchExpenses();
      setExpenseData(updatedExpenses);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditExpense = (expense) => {
    setEditMode(true);
    setExpenseToEdit(expense);
  };

  const handleExpenseUpdated = async () => {
    try {
      setLoading(true);
      const updatedExpenses = await fetchExpenses();
      setExpenseData(updatedExpenses);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
      setEditMode(false);
      setExpenseToEdit(null);
    }
  };

  const handleDeleteExpense = async (id) => {
    try {
      setLoading(true);
      await deleteExpense(id);
      await handleExpenseAdded();
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
    () => calculateTotalExpense(expenseData),
    [expenseData]
  );

  const groupedExpenses = useMemo(
    () => groupExpensesByCategory(expenseData),
    [expenseData]
  );

  const toggleExpandExpense = (key) => {
    setExpandedExpense((prev) => ({ ...prev, [key]: !prev[key] }));
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
          <ExpenseForm
            onExpenseAdded={handleExpenseAdded}
            onExpenseUpdated={handleExpenseUpdated}
            expenseToEdit={expenseToEdit}
            mode={editMode ? 'edit' : 'add'}
          />

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
                  <React.Fragment
                    key={`${expense.category}-${expense.frequency}`}
                  >
                    <tr>
                      <td>{expense.category}</td>
                      <td>${expense.amount}</td>
                      <td>{expense.frequency}</td>
                      <td>
                        {new Date(expense.date).toLocaleDateString(undefined, {
                          timeZone: 'UTC',
                        })}
                      </td>
                      <td>{expense.description || ''}</td>
                      <td>
                        <div
                          style={{
                            display: 'flex',
                            gap: '10px',
                            justifyContent: 'center',
                          }}
                        >
                          <button onClick={() => handleEditExpense(expense)}>
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(expense._id)}
                          >
                            Delete
                          </button>
                          {expense.frequency !== 'once' && (
                            <button
                              onClick={() =>
                                toggleExpandExpense(
                                  `${expense.category}-${expense.frequency}`
                                )
                              }
                            >
                              {expandedExpense[
                                `${expense.category}-${expense.frequency}`
                              ]
                                ? 'Collapse'
                                : 'Expand'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Collapsible section for future recurring instances */}
                    {expandedExpense[
                      `${expense.category}-${expense.frequency}`
                    ] &&
                      expense.futureInstances.length > 0 &&
                      expense.futureInstances.map((instance) => (
                        <tr key={instance._id}>
                          <td colSpan="2">
                            Recurring on:{' '}
                            {new Date(instance.date).toLocaleDateString(
                              undefined,
                              { timeZone: 'UTC' }
                            )}
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
