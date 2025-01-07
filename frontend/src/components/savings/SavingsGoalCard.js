import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import { FaTrash } from 'react-icons/fa';
import 'react-circular-progressbar/dist/styles.css';
import {
  notifyError,
  notifySuccess,
  showSavingsGoalSuccessAlert,
} from '../../utils/notificationService';
import { confirmAction } from '../../utils/confirmationService';
import {
  fetchSavingsGoal,
  createSavingsGoal,
  updateSavingsGoal,
  deleteSavingsGoal,
} from '../../services/savingsGoalService';
import { calculateTotalIncomeInInterval } from '../../utils/incomeHelpers';
import { calculateTotalExpenseInInterval } from '../../utils/expenseHelpers';
import {
  getSavingsTimeframe,
  getGoalAlertColor,
  getAlertKey,
} from '../../utils/savingsGoalHelpers';
import SavingsGoalModal from '../savings/SavingsGoalModal';
import noGoalIllustration from '../../assets/icons/no-goals.svg';
import '../../styles/savings/SavingsGoalCard.css';

const SavingsGoalCard = ({ incomes, expenses, allSubGoals }) => {
  const [goalId, setGoalId] = useState(null);
  const [goalRatios, setGoalRatios] = useState({});
  const [interval, setIntervalPeriod] = useState('monthly');
  const [showModal, setShowModal] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [goalLoaded, setGoalLoaded] = useState(false);

  const hasAnySubGoals = allSubGoals && allSubGoals.length > 0;
  const intervals = ['weekly', 'biweekly', 'monthly', 'yearly'];

  /* Calculate total income and expense for the selected interval */
  const [startDate, endDate] = getSavingsTimeframe(interval);
  const intervalIncome = calculateTotalIncomeInInterval(
    incomes,
    startDate,
    endDate
  );
  const intervalExpense = calculateTotalExpenseInInterval(
    expenses,
    startDate,
    endDate
  );
  const netSavings = intervalIncome - intervalExpense;

  const handleIntervalCycle = () => {
    const currentIndex = intervals.indexOf(interval);
    const nextIndex = (currentIndex + 1) % intervals.length;
    setIntervalPeriod(intervals[nextIndex]);
  };

  /* Calculate total saved and target amounts for all sub-goals */
  const totalSaved = allSubGoals.reduce((acc, g) => {
    const ratioDecimal = goalRatios[g.name] || 0;
    const currentAmount = g.currentAmount || 0;
    const allocated = netSavings * ratioDecimal;
    return acc + currentAmount + allocated;
  }, 0);

  const totalTarget = allSubGoals.reduce((acc, g) => {
    const parsedTarget = parseFloat(g.targetAmount ?? 0);
    return acc + (Number.isNaN(parsedTarget) ? 0 : parsedTarget);
  }, 0);

  const progressPercentage =
    totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;
  const alertColor = getGoalAlertColor(progressPercentage);

  /* UseEffect for triggering success alerts */
  const alertKey = getAlertKey(goalRatios, incomes, expenses, totalTarget);
  useEffect(() => {
    if (totalTarget > 0 && totalSaved >= totalTarget) {
      if (!localStorage.getItem(alertKey)) {
        showSavingsGoalSuccessAlert(
          '🎉 Congratulations! You have achieved your savings goal!'
        );
        localStorage.setItem(alertKey, 'true');
      }
    }
  }, [alertKey, totalSaved, totalTarget]);

  useEffect(() => {
    const loadGoal = async () => {
      try {
        const goalResponse = await fetchSavingsGoal();
        if (goalResponse) {
          setGoalId(goalResponse._id);
          setGoalRatios(goalResponse.goalRatios || {});
          setIntervalPeriod(goalResponse.interval || 'monthly');
        } else {
          console.warn('No savings distribution found.');
        }
      } catch (error) {
        if (!error.message.includes('No savings distribution found')) {
          notifyError(
            error.message || 'Failed to load savings distribution information.'
          );
        }
      } finally {
        setGoalLoaded(true);
      }
    };

    loadGoal();
  }, []);

  const handleCreateOrEditGoal = () => {
    if (!hasAnySubGoals) return;
    setShowModal(true);
  };

  const handleModalSave = async (updatedSubGoals, newInterval) => {
    const totalAllocation = updatedSubGoals.reduce(
      (acc, g) => acc + g.ratio,
      0
    );
    if (totalAllocation <= 0) {
      notifyError('Total allocation cannot be zero. Please set valid amounts.');
      return;
    }

    const newGoalRatios = {};
    updatedSubGoals.forEach((g) => {
      newGoalRatios[g.name] = g.ratio;
    });

    try {
      if (!goalId) {
        const created = await createSavingsGoal(newGoalRatios, newInterval);
        setGoalId(created._id);
        setGoalRatios(created.goalRatios || {});
        setIntervalPeriod(created.interval || 'monthly');
        notifySuccess('Savings distribution created successfully!');
      } else {
        const result = await updateSavingsGoal(
          goalId,
          newGoalRatios,
          newInterval
        );
        const updatedDoc = result.updatedGoal;
        setGoalRatios(updatedDoc.goalRatios || {});
        setIntervalPeriod(updatedDoc.interval || 'monthly');
        notifySuccess('Savings distribution updated successfully!');
      }
      setIsHovered(false);
      setShowModal(false);
    } catch (error) {
      notifyError(error.message || 'Failed to save savings distribution.');
    }
  };

  const handleDeleteGoal = async () => {
    const confirmed = await confirmAction(
      'Delete Savings Distribution?',
      'Are you sure you want to delete your savings distribution? This action cannot be undone.'
    );
    if (!confirmed) return;

    try {
      if (goalId) {
        await deleteSavingsGoal(goalId);
        notifySuccess('Savings distribution deleted successfully.');
        setGoalId(null);
        setGoalRatios({});
        setIntervalPeriod('monthly');
      }
    } catch (error) {
      notifyError(error.message || 'Failed to delete savings distribution.');
    }
  };

  if (!goalLoaded) {
    return (
      <div className="savings-goal-card loading-state">
        <p>Loading Savings Distribution...</p>
      </div>
    );
  }

  if (!hasAnySubGoals) {
    return (
      <div className="savings-goal-card no-goals" onClick={handleIntervalCycle}>
        <div className="no-goals-content">
          <h3 className="current-savings">
            Current Savings{' '}
            <span className={`interval-tag ${interval.toLowerCase()}`}>
              {interval.charAt(0).toUpperCase() + interval.slice(1)}
            </span>
          </h3>
          <p
            className={`savings-summary ${netSavings < 0 ? 'negative-amount' : ''}`}
          >
            You have <strong>${netSavings.toFixed(2)}</strong> in total savings
            for this interval.
          </p>
          <p className="no-goals-message">
            Create your first savings goal to start distributing your savings.
          </p>
        </div>
      </div>
    );
  }

  if (!goalId) {
    return (
      <div
        className={`savings-goal-card empty-state ${isHovered ? 'hovered' : ''}`}
        onClick={handleCreateOrEditGoal}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleCreateOrEditGoal()}
      >
        <div className="pencil-icon">&#9998;</div>
        <div className="no-goal-content">
          <img
            src={noGoalIllustration}
            alt="No savings distribution illustration"
            className="no-goal-illustration"
          />
          <div className="no-goal-container">
            <h3>No Savings Distribution Found!</h3>
            <p>
              You can create a personalized distribution to allocate your total
              savings among different goals. Click here to get started ✨
            </p>
          </div>
        </div>

        {showModal && (
          <SavingsGoalModal
            subGoals={allSubGoals.map((g) => ({
              ...g,
              ratio: goalRatios[g.name] ?? 0,
            }))}
            incomes={incomes}
            expenses={expenses}
            defaultInterval={interval}
            onClose={() => setShowModal(false)}
            onSave={handleModalSave}
          />
        )}
      </div>
    );
  }

  return (
    <div
      className={`savings-goal-card goal-added ${isHovered ? 'hovered' : ''}`}
      onClick={handleCreateOrEditGoal}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleCreateOrEditGoal()}
    >
      <div className="pencil-icon">&#9998;</div>
      <div className="card-content">
        <div className="progress-container">
          <CircularProgressbar
            value={progressPercentage}
            text={`${Math.round(progressPercentage)}%`}
            styles={buildStyles({
              textColor: '#003366',
              pathColor: alertColor,
              trailColor: '#e6e8f1',
            })}
          />
        </div>

        <div className="goal-info">
          <h3>
            Savings Overview{' '}
            <span className={`interval-tag ${interval.toLowerCase()}`}>
              {interval.charAt(0).toUpperCase() + interval.slice(1)}
            </span>
          </h3>
          <p>
            Savings: <strong>${totalSaved.toFixed(2)}</strong> /
            <strong>${totalTarget.toFixed(2)}</strong> (Target)
          </p>
        </div>
      </div>

      <button
        className="delete-icon-btn"
        onClick={(e) => {
          e.stopPropagation();
          handleDeleteGoal();
        }}
        title="Delete Savings Distribution"
      >
        <FaTrash />
      </button>

      {showModal && (
        <SavingsGoalModal
          subGoals={allSubGoals.map((g) => ({
            ...g,
            ratio: goalRatios[g.name] ?? 0,
          }))}
          incomes={incomes}
          expenses={expenses}
          defaultInterval={interval}
          onClose={() => setShowModal(false)}
          onSave={handleModalSave}
        />
      )}
    </div>
  );
};

SavingsGoalCard.propTypes = {
  incomes: PropTypes.array.isRequired,
  expenses: PropTypes.array.isRequired,
  allSubGoals: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      deadline: PropTypes.string,
      ratio: PropTypes.number,
      currentAmount: PropTypes.number,
      targetAmount: PropTypes.number,
    })
  ).isRequired,
};

export default SavingsGoalCard;
