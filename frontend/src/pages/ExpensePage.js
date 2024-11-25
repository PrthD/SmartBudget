// Import necessary modules and components
import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  fetchExpenses,
  deleteExpense,
  skipNextRecurrence,
} from '../services/expenseService';
import {
  calculateTotalExpense,
  groupExpensesByCategory,
  calculateNextRecurrence,
} from '../utils/expenseHelpers';
import ExpenseForm from '../components/expenses/ExpenseForm';
import ExpenseSort from '../components/expenses/ExpenseSort';
import NavBar from '../components/common/NavBar';
import Chart from 'react-apexcharts';
import ExpenseCard from '../components/expenses/ExpenseCard';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import noExpensesIllustration from '../assets/icons/no-expenses.svg';
import '../styles/ExpensePage.css';
import moment from 'moment-timezone';

const ExpensesPage = () => {
  const [expenseData, setExpenseData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedExpense, setExpandedExpense] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState(null);
  const [highlightForm, setHighlightForm] = useState(false);
  const [isExpensesListVisible, setIsExpensesListVisible] = useState(true);
  const [sortedExpenses, setSortedExpenses] = useState([]);

  const formSectionRef = useRef(null);

  useEffect(() => {
    if (expenseData.length > 0) {
      const sorted = sortExpenses(expenseData, 'date', 'desc');
      setSortedExpenses(sorted);
    } else {
      setSortedExpenses([]);
    }
  }, [expenseData]);

  // Fetch initial expenses from the server
  const fetchInitialExpenses = async () => {
    try {
      setLoading(true);
      const expenses = await fetchExpenses();

      const formattedExpenses = expenses.map((expense) => ({
        ...expense,
        date: moment(expense.date).tz('America/Edmonton').format('YYYY-MM-DD'),
        frequency: expense.frequency || 'once',
        nextRecurrence: expense.nextRecurrence
          ? moment(expense.nextRecurrence)
              .tz('America/Edmonton')
              .format('YYYY-MM-DD')
          : null,
      }));

      setExpenseData(formattedExpenses);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle adding a new expense
  const handleExpenseAdded = async (newExpense) => {
    if (newExpense.frequency && newExpense.frequency !== 'once') {
      // For recurring expenses, re-fetch expenses to get future instances
      setLoading(true);
      await fetchInitialExpenses();
      setLoading(false);
    } else {
      // For one-time expenses, just add the new expense to the state
      setExpenseData((prevExpenses) => [...prevExpenses, newExpense]);
    }
  };

  // Handle editing an expense
  const handleEditExpense = (expense) => {
    setEditMode(true);
    setExpenseToEdit(expense);

    if (formSectionRef.current) {
      formSectionRef.current.scrollIntoView({ behavior: 'smooth' });
      const firstInput = formSectionRef.current.querySelector(
        'input, select, textarea'
      );
      if (firstInput) {
        firstInput.focus();
      }
    }

    setHighlightForm(true);

    setTimeout(() => {
      setHighlightForm(false);
    }, 2000);
  };

  // Handle updating an expense
  const handleExpenseUpdated = async (updatedExpense) => {
    if (updatedExpense.frequency && updatedExpense.frequency !== 'once') {
      // For recurring expenses, re-fetch expenses to get updated future instances
      setLoading(true);
      await fetchInitialExpenses();
      setLoading(false);
    } else {
      // For one-time expenses, just update the existing expense in the state
      setExpenseData((prevExpenses) =>
        prevExpenses.map((expense) =>
          expense._id === updatedExpense._id ? updatedExpense : expense
        )
      );
    }
    setEditMode(false);
    setExpenseToEdit(null);
  };

  // Handle deleting an expense
  const handleDeleteExpense = async (id) => {
    try {
      setLoading(true);
      // Optimistically update the UI
      setExpenseData((prevExpenses) =>
        prevExpenses.filter(
          (expense) => expense._id !== id && expense.originalExpenseId !== id
        )
      );
      await deleteExpense(id);
    } catch (error) {
      setError(error.message);
      // Re-fetch expenses in case of error
      await fetchInitialExpenses();
    } finally {
      setLoading(false);
    }
  };

  // Handle skipping the next recurrence date for a recurring expense
  const handleSkipNextRecurrence = async (expenseId, dateToSkip) => {
    try {
      setLoading(true);

      // Call the service to skip the next recurrence
      await skipNextRecurrence(expenseId, dateToSkip);

      // Update local state
      setExpenseData((prevExpenses) =>
        prevExpenses.map((expense) => {
          if (expense._id === expenseId) {
            // Add dateToSkip to skippedDates
            const updatedSkippedDates = [
              ...(expense.skippedDates || []),
              dateToSkip,
            ];

            // Recalculate nextRecurrence
            const nextRecurrence = calculateNextRecurrence({
              ...expense,
              skippedDates: updatedSkippedDates,
            });

            return {
              ...expense,
              skippedDates: updatedSkippedDates,
              nextRecurrence: nextRecurrence
                ? moment(nextRecurrence)
                    .tz('America/Edmonton')
                    .format('YYYY-MM-DD')
                : null,
            };
          }
          return expense;
        })
      );
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate total expenses and group by category
  const totalExpense = useMemo(
    () => calculateTotalExpense(expenseData),
    [expenseData]
  );

  const groupedExpenses = useMemo(
    () => groupExpensesByCategory(expenseData),
    [expenseData]
  );

  const toggleExpandExpense = (id) => {
    setExpandedExpense((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const sortExpenses = (expenses, field, order) => {
    return [...expenses].sort((a, b) => {
      let comparison = 0;
      if (field === 'amount') {
        comparison = a.amount - b.amount;
      } else if (field === 'date') {
        comparison = new Date(a.date) - new Date(b.date);
      } else if (field === 'category') {
        comparison = a.category.localeCompare(b.category);
      }
      return order === 'asc' ? comparison : -comparison;
    });
  };

  const handleSortChange = (field, order) => {
    const sorted = sortExpenses(expenseData, field, order);
    setSortedExpenses(sorted);
  };

  /* TODO: Replace the hardcoded budget value with a dynamic value */
  const budget = 10000;
  const percentage = (totalExpense / budget) * 100;

  return (
    <div className="expenses-page">
      <NavBar />

      {/* Total Expenses Card with Circular Progress Bar */}
      <div className="total-expenses-card">
        <div className="card-content">
          <div className="progress-container">
            <CircularProgressbar
              value={percentage}
              text={`${Math.round(percentage)}%`}
              styles={buildStyles({
                textColor: '#003366',
                pathColor: '#004c99',
                trailColor: '#e6e8f1',
              })}
            />
          </div>
          <div className="expense-info">
            <h3>Total Expenses</h3>
            <p>
              ${totalExpense.toFixed(2)} / ${budget}
            </p>
          </div>
        </div>
      </div>

      <div
        className={`split-screen-container ${
          groupedExpenses.length === 0 ? 'centered' : ''
        }`}
      >
        {/* Form Section */}
        <div
          className={`form-section ${
            groupedExpenses.length === 0 ? 'centered-horizontal' : ''
          }`}
          ref={formSectionRef}
        >
          <ExpenseForm
            onExpenseAdded={handleExpenseAdded}
            onExpenseUpdated={handleExpenseUpdated}
            mode={editMode ? 'edit' : 'add'}
            expenseToEdit={expenseToEdit}
            highlight={highlightForm}
          />
          {loading && <p>Loading...</p>}
          {error && <p className="error-message">{error}</p>}
        </div>

        {/* Overview Section - Single Graph Card */}
        {groupedExpenses.length > 0 && (
          <div className="overview-section">
            <Chart
              options={{
                chart: {
                  type: 'pie',
                  toolbar: {
                    show: false,
                  },
                },
                labels: groupedExpenses.map((exp) => exp.category),
                legend: {
                  position: 'bottom',
                  labels: {
                    colors: ['#000000'],
                    useSeriesColors: false,
                  },
                },
              }}
              series={groupedExpenses.map((exp) => exp.amount)}
              type="pie"
              width="450"
            />
          </div>
        )}
      </div>

      {/* Expenses List Section */}
      <div className="expenses-list">
        <h3
          className="collapsible-header"
          onClick={() => setIsExpensesListVisible(!isExpensesListVisible)}
        >
          Your Expenses{' '}
          {isExpensesListVisible ? <FaChevronUp /> : <FaChevronDown />}
        </h3>
        {isExpensesListVisible && (
          <ExpenseSort onSortChange={handleSortChange} />
        )}
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="error-message">{error}</p>
        ) : (
          <CSSTransition
            in={isExpensesListVisible}
            timeout={300}
            classNames="expenses-list-transition"
            unmountOnExit
          >
            <div className="expense-cards-container">
              {sortedExpenses.length > 0 ? (
                <TransitionGroup component={null}>
                  {sortedExpenses.map((expense) => (
                    <CSSTransition
                      key={expense._id}
                      timeout={500}
                      classNames="expense-card-transition"
                    >
                      <ExpenseCard
                        key={expense._id}
                        expense={expense}
                        onEdit={() => handleEditExpense(expense)}
                        onDelete={() => handleDeleteExpense(expense._id)}
                        onExpand={() => toggleExpandExpense(expense._id)}
                        expanded={expandedExpense[expense._id]}
                        onSkipNextRecurrence={(expenseId, dateToSkip) =>
                          handleSkipNextRecurrence(expenseId, dateToSkip)
                        }
                      />
                    </CSSTransition>
                  ))}
                </TransitionGroup>
              ) : (
                <div className="no-expenses-container">
                  <img
                    src={noExpensesIllustration}
                    alt="No expenses illustration"
                    className="no-expenses-illustration"
                  />
                  <p>
                    No expenses recorded yet. Start by adding your first
                    expense!
                  </p>
                </div>
              )}
            </div>
          </CSSTransition>
        )}
      </div>
    </div>
  );
};

export default ExpensesPage;
