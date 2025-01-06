import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  fetchSavingsGoals,
  deleteSavingsGoals,
} from '../services/savingsService';
import { fetchIncomes } from '../services/incomeService';
import { fetchExpenses } from '../services/expenseService';
import {
  formatSavingsData,
  filterSavingsGoals,
  sortSavingsGoalsByFields,
} from '../utils/savingsHelpers';
import SavingsForm from '../components/savings/SavingsForm';
import SavingsSearch from '../components/savings/SavingsSearch';
import SavingsSort from '../components/savings/SavingsSort';
import NavBar from '../components/common/NavBar';
import SavingsCard from '../components/savings/SavingsCard';
import SavingsGoalCard from '../components/savings/SavingsGoalCard';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import noSavingsGoalsIllustration from '../assets/icons/no-savings.svg';
import '../styles/savings/SavingsPage.css';
import { LoadingContext } from '../contexts/LoadingContext';
import { notifyError, notifySuccess } from '../utils/notificationService';

const SavingsPage = () => {
  const [incomeData, setIncomeData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);
  const [savingsData, setSavingsData] = useState([]);

  const [expandedSavings, setExpandedSavings] = useState({});
  const [sortedSavings, setSortedSavings] = useState([]);
  const [filteredSavings, setFilteredSavings] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState(null);
  const [highlightForm, setHighlightForm] = useState(false);
  const [isSavingsListVisible, setIsSavingsListVisible] = useState(true);
  const [errorNotified, setErrorNotified] = useState(false);

  const { setLoading } = useContext(LoadingContext);
  const formSectionRef = useRef(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    setFilteredSavings(sortedSavings);
  }, [sortedSavings]);

  useEffect(() => {
    if (savingsData.length > 0) {
      const sorted = sortSavingsGoalsByFields(
        savingsData,
        ['deadline'],
        ['asc']
      );
      setSortedSavings(sorted);
    } else {
      setSortedSavings([]);
    }
  }, [savingsData]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [sGoals, incomes, expenses] = await Promise.all([
        fetchSavingsGoals(),
        fetchIncomes(),
        fetchExpenses(),
      ]);

      const formatted = formatSavingsData(sGoals);

      setIncomeData(incomes);
      setExpenseData(expenses);
      setSavingsData(formatted);
      setErrorNotified(false);
    } catch (error) {
      if (!errorNotified) {
        const errorMessage =
          error.response?.data?.error || 'Failed to load savings data.';
        notifyError(errorMessage);
        setErrorNotified(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleValidationError = (message) => {
    notifyError(message);
  };

  const handleSavingsGoalAdded = async (newGoal) => {
    try {
      setLoading(true);
      setSavingsData((prev) => [...prev, newGoal]);
      notifySuccess('Savings goal added successfully!');
      setErrorNotified(false);
    } catch (error) {
      if (!errorNotified) {
        notifyError(
          error.response?.data?.error || 'Failed to add savings goal.'
        );
        setErrorNotified(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditGoal = (goal) => {
    setEditMode(true);
    setGoalToEdit(goal);

    if (formSectionRef.current) {
      formSectionRef.current.scrollIntoView({ behavior: 'smooth' });
      const firstInput = formSectionRef.current.querySelector(
        'input, select, textarea'
      );
      if (firstInput) firstInput.focus();
    }
    setHighlightForm(true);
    setTimeout(() => setHighlightForm(false), 2000);
  };

  const handleSavingsGoalUpdated = async (updatedGoal) => {
    try {
      setLoading(true);
      setSavingsData((prev) =>
        prev.map((g) => (g._id === updatedGoal._id ? updatedGoal : g))
      );
      notifySuccess('Savings goal updated successfully!');
      setEditMode(false);
      setGoalToEdit(null);
      setErrorNotified(false);
    } catch (error) {
      if (!errorNotified) {
        notifyError(
          error.response?.data?.error || 'Failed to update savings goal.'
        );
        setErrorNotified(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSavingsGoal = async (id) => {
    try {
      setLoading(true);
      setSavingsData((prev) => prev.filter((goal) => goal._id !== id));
      await deleteSavingsGoals(id);
      notifySuccess('Savings goal deleted successfully.');
      setErrorNotified(false);
    } catch (error) {
      if (!errorNotified) {
        notifyError(
          error.response?.data?.error || 'Failed to delete savings goal.'
        );
        setErrorNotified(true);
      }
      await fetchInitialData();
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query) => {
    const filtered = filterSavingsGoals(sortedSavings, query);
    setFilteredSavings(filtered);
  };

  const handleSortChange = (field, order) => {
    const sorted = sortSavingsGoalsByFields(
      savingsData,
      [field, 'deadline'],
      [order]
    );
    setSortedSavings(sorted);
  };

  const toggleExpandSavings = (id) => {
    setExpandedSavings((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const noSavingsMessage =
    savingsData.length === 0
      ? 'No savings goals yet! Start planning your financial goals 🚀'
      : 'No savings goals match your search. Try adjusting your filters.';

  return (
    <div className="savings-page">
      <NavBar />

      {/* Single ratio-based distribution card for "SavingsGoal" */}
      <div className="goal-card-wrapper">
        <SavingsGoalCard
          incomes={incomeData}
          expenses={expenseData}
          allSubGoals={savingsData
            .filter((g) => g && g.title)
            .map((g) => ({
              name: g.title,
              deadline: g.deadline,
              currentAmount: g.currentAmount,
              targetAmount: g.targetAmount,
              ratio: 0,
            }))}
        />
      </div>

      <div className="split-screen-container">
        {/* Form Section for adding/editing individual "Savings" docs */}
        <div className="form-section" ref={formSectionRef}>
          <SavingsForm
            onSavingsAdded={handleSavingsGoalAdded}
            onSavingsUpdated={handleSavingsGoalUpdated}
            onValidationError={handleValidationError}
            mode={editMode ? 'edit' : 'add'}
            savingsToEdit={goalToEdit}
            highlight={highlightForm}
          />
        </div>

        {/* Overview Section: A bar-like visualization of each savings doc's progress */}
        {savingsData.length > 0 && (
          <div className="overview-card detailed">
            <h3>Savings Progress Overview</h3>
            <div className="progress-bar-container">
              {savingsData.map((goal, index) => {
                const curr = goal.currentAmount ?? 0;
                const tgt = goal.targetAmount > 0 ? goal.targetAmount : 1;
                const ratio = Math.min(curr / tgt, 1);

                return (
                  <div
                    key={goal._id}
                    className="progress-bar-segment"
                    style={{
                      '--ratio': ratio || 0.1,
                      '--segment-hue': (index * 70) % 360,
                    }}
                  >
                    <span className="progress-bar-percentage">
                      {`${goal.title}: ${(ratio * 100).toFixed(1)}% ($${curr.toFixed(2)} / $${goal.targetAmount.toFixed(2)})`}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="progress-bar-legend">
              {savingsData.map((goal, index) => (
                <div key={goal._id} className="legend-item">
                  <span
                    className="legend-color"
                    style={{
                      backgroundColor: `hsl(${(index * 70) % 360}, 70%, 50%)`,
                    }}
                  ></span>
                  <span className="legend-label">{goal.title}</span>
                </div>
              ))}
            </div>
            {savingsData.some((goal) => goal.currentAmount === 0) && (
              <p className="progress-bar-empty-message">
                Some goals have no progress yet. Start saving today!
              </p>
            )}
          </div>
        )}
      </div>

      {/* List of "Savings" docs */}
      <div className="savings-list">
        <h3
          className="collapsible-header"
          onClick={() => setIsSavingsListVisible(!isSavingsListVisible)}
        >
          Your Savings Goals{' '}
          {isSavingsListVisible ? <FaChevronUp /> : <FaChevronDown />}
        </h3>

        {isSavingsListVisible && (
          <>
            <SavingsSearch onSearch={handleSearch} />
            <SavingsSort onSortChange={handleSortChange} />
          </>
        )}

        <CSSTransition
          in={isSavingsListVisible}
          timeout={300}
          classNames="savings-list-transition"
          unmountOnExit
        >
          <div className="savings-cards-container">
            {filteredSavings.length > 0 ? (
              <TransitionGroup component={null}>
                {filteredSavings.map((goal) => (
                  <CSSTransition
                    key={goal._id}
                    timeout={500}
                    classNames="savings-card-transition"
                  >
                    <SavingsCard
                      key={goal._id}
                      savings={goal}
                      onEdit={() => handleEditGoal(goal)}
                      onDelete={() => handleDeleteSavingsGoal(goal._id)}
                      onExpand={() => toggleExpandSavings(goal._id)}
                      expanded={!!expandedSavings[goal._id]}
                    />
                  </CSSTransition>
                ))}
              </TransitionGroup>
            ) : (
              <div className="no-savings-container">
                <img
                  src={noSavingsGoalsIllustration}
                  alt="No savings illustration"
                  className="no-savings-illustration"
                />
                <p>{noSavingsMessage}</p>
              </div>
            )}
          </div>
        </CSSTransition>
      </div>
    </div>
  );
};

export default SavingsPage;
