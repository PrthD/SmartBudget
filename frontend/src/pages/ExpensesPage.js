import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import ExpenseForm from '../components/expenses/ExpenseForm';
// import '../styles/ExpensePage.css';

const ExpensesPage = ({ onExpenseAdded }) => {
  const [expenseData, setExpenseData] = useState([]);
  const [expandedExpense, setExpandedExpense] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const expenses = await axios.get('http://localhost:5000/api/expense');
        setExpenseData(expenses.data);
      } catch (error) {
        console.error('Error fetching expenses:', error);
      }
    };

    fetchData();

    if (onExpenseAdded) onExpenseAdded();
  }, [onExpenseAdded]);

  const totalExpenses = useMemo(
    () =>
      expenseData
        .filter((expense) => new Date(expense.date) <= new Date())
        .reduce((sum, expense) => sum + expense.amount, 0),
    [expenseData]
  );

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

  const toggleExpandExpense = (id) => {
    setExpandedExpense((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="expenses-page">
      <h2>Your Expenses</h2>
      <h3>Total Expenses: ${totalExpenses}</h3>

      {/* Render the Expense Form */}
      <ExpenseForm onExpenseAdded={onExpenseAdded} />

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
                      <button onClick={() => toggleExpandExpense(expense._id)}>
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
  );
};

ExpensesPage.propTypes = {
  onExpenseAdded: PropTypes.func,
};

export default ExpensesPage;
