import React, { useState, useMemo, useEffect, useRef, useContext } from 'react';
import {
  fetchExpenses,
  deleteExpense,
  skipNextRecurrence,
} from '../services/expenseService';
import {
  formatExpenseData,
  calculateTotalExpense,
  groupExpensesByCategory,
  calculateNextRecurrence,
  filterExpenses,
  sortByFields,
} from '../utils/expenseHelpers';
import ExpenseForm from '../components/expenses/ExpenseForm';
import ExpenseSearch from '../components/expenses/ExpenseSearch';
import ExpenseSort from '../components/expenses/ExpenseSort';
import NavBar from '../components/common/NavBar';
import Chart from 'react-apexcharts';
import ExpenseCard from '../components/expenses/ExpenseCard';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import noExpensesIllustration from '../assets/icons/no-expenses.svg';
import '../styles/expenses/ExpensePage.css';
import moment from 'moment-timezone';
import { LoadingContext } from '../contexts/LoadingContext';
import { notifyError, notifySuccess } from '../utils/notificationService';

const ExpensesPage = () => {
  const [expenseData, setExpenseData] = useState([]);
  const [expandedExpense, setExpandedExpense] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState(null);
  const [highlightForm, setHighlightForm] = useState(false);
  const [isExpensesListVisible, setIsExpensesListVisible] = useState(true);
  const [sortedExpenses, setSortedExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);

  const { setLoading } = useContext(LoadingContext);

  const formSectionRef = useRef(null);

  useEffect(() => {
    fetchInitialExpenses();
  }, []);

  useEffect(() => {
    setFilteredExpenses(sortedExpenses);
  }, [sortedExpenses]);

  useEffect(() => {
    if (expenseData.length > 0) {
      const sorted = sortByFields(expenseData, ['date'], ['desc']);
      setSortedExpenses(sorted);
    } else {
      setSortedExpenses([]);
    }
  }, [expenseData]);

  const fetchInitialExpenses = async () => {
    try {
      setLoading(true);
      const expenses = await fetchExpenses();

      const formattedExpenses = formatExpenseData(expenses);

      setExpenseData(formattedExpenses);
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || 'Failed to fetch expenses.';
      notifyError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleExpenseAdded = async (newExpense, error = null) => {
    if (error) {
      notifyError(error);
      return;
    }
    try {
      setLoading(true);
      if (newExpense.frequency && newExpense.frequency !== 'once') {
        await fetchInitialExpenses();
      } else {
        setExpenseData((prevExpenses) => [...prevExpenses, newExpense]);
      }
      notifySuccess('Expense added successfully!');
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || 'Failed to add expense.';
      notifyError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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

  const handleExpenseUpdated = async (updatedExpense, error = null) => {
    if (error) {
      notifyError(error);
      return;
    }
    try {
      setLoading(true);
      if (updatedExpense.frequency && updatedExpense.frequency !== 'once') {
        await fetchInitialExpenses();
      } else {
        setExpenseData((prevExpenses) =>
          prevExpenses.map((expense) =>
            expense._id === updatedExpense._id ? updatedExpense : expense
          )
        );
      }
      notifySuccess('Expense updated successfully!');
      setEditMode(false);
      setExpenseToEdit(null);
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || 'Failed to update expense.';
      notifyError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    try {
      setLoading(true);
      setExpenseData((prevExpenses) =>
        prevExpenses.filter(
          (expense) => expense._id !== id && expense.originalExpenseId !== id
        )
      );
      await deleteExpense(id);
      notifySuccess('Expense deleted successfully.');
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || 'Failed to delete expense.';
      notifyError(errorMessage);
      await fetchInitialExpenses();
    } finally {
      setLoading(false);
    }
  };

  const handleSkipNextRecurrence = async (expenseId, dateToSkip) => {
    try {
      setLoading(true);

      await skipNextRecurrence(expenseId, dateToSkip);

      setExpenseData((prevExpenses) =>
        prevExpenses.map((expense) => {
          if (expense._id === expenseId) {
            const updatedSkippedDates = [
              ...(expense.skippedDates || []),
              dateToSkip,
            ];

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
      notifySuccess('Next recurrence skipped successfully.');
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || 'Failed to skip next recurrence.';
      notifyError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query) => {
    const filtered = filterExpenses(sortedExpenses, query);
    setFilteredExpenses(filtered);
  };

  const handleSortChange = (field, order) => {
    const sorted = sortByFields(
      expenseData,
      [field, 'date', 'amount'],
      [order]
    );
    setSortedExpenses(sorted);
  };

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

  /* TODO: Replace the hardcoded budget value with a dynamic value */
  const budget = 10000;
  const percentage = (totalExpense / budget) * 100;

  const noExpensesMessage =
    expenseData.length === 0
      ? 'No expenses recorded yet. Start by adding your first expense!'
      : 'No expenses match your search.';

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
          <>
            <ExpenseSearch onSearch={handleSearch} />
            <ExpenseSort onSortChange={handleSortChange} />
          </>
        )}
        <CSSTransition
          in={isExpensesListVisible}
          timeout={300}
          classNames="expenses-list-transition"
          unmountOnExit
        >
          <div className="expense-cards-container">
            {filteredExpenses.length > 0 ? (
              <TransitionGroup component={null}>
                {filteredExpenses.map((expense) => (
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
                      expanded={!!expandedExpense[expense._id]}
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
                <p>{noExpensesMessage}</p>
              </div>
            )}
          </div>
        </CSSTransition>
      </div>
    </div>
  );
};

export default ExpensesPage;
