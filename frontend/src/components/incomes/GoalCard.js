import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import { FaTrash } from 'react-icons/fa';
import 'react-circular-progressbar/dist/styles.css';
import {
  notifyError,
  notifySuccess,
  showGoalSuccessAlert,
} from '../../utils/notificationService';
import { confirmAction } from '../../utils/confirmationService';
import {
  fetchIncomeGoal,
  updateIncomeGoal,
  createIncomeGoal,
  deleteIncomeGoal,
} from '../../services/incomeGoalService';
import { calculateTotalIncomeInInterval } from '../../utils/incomeHelpers';
import {
  getGoalAlertColor,
  getTimeframeDates,
  mergeSourceGoals,
} from '../../utils/incomeGoalHelpers';
import SourceGoalModal from './SourceGoalModal';
import noGoalsIllustration from '../../assets/icons/no-goals.svg';
import '../../styles/expenses/BudgetCard.css';

const GoalCard = ({ incomes }) => {
  const [goalId, setGoalId] = useState(null);
  const [totalGoal, setTotalGoal] = useState(0);
  const [sourceGoals, setSourceGoals] = useState({});
  const [interval, setIntervalPeriod] = useState('monthly');
  const [showModal, setShowModal] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [goalLoaded, setGoalLoaded] = useState(false);

  const [startDate, endDate] = getTimeframeDates(interval);
  const totalIncome = calculateTotalIncomeInInterval(
    incomes,
    startDate,
    endDate
  );
  const goalPercentage = totalGoal > 0 ? (totalIncome / totalGoal) * 100 : 0;
  const alertColor = getGoalAlertColor(goalPercentage);

  useEffect(() => {
    const loadGoal = async () => {
      try {
        const goalResponse = await fetchIncomeGoal();
        setGoalId(goalResponse._id);
        setTotalGoal(Number(goalResponse.totalGoal) || 0);

        if (goalResponse.interval) {
          setIntervalPeriod(goalResponse.interval);
        }

        const merged = mergeSourceGoals(goalResponse.sourceGoals, incomes);
        setSourceGoals(merged);
      } catch (error) {
        if (!error.message.includes('No income goal record found')) {
          notifyError(
            error.message || 'Failed to load income goal information.'
          );
        }
      } finally {
        setGoalLoaded(true);
      }
    };

    loadGoal();
  }, [incomes]);

  useEffect(() => {
    if (goalPercentage >= 100) {
      showGoalSuccessAlert(
        'Congratulations! You have achieved 100% or more of your income goal! 🎉'
      );
    }
  }, [goalPercentage]);

  const handleCreateOrEditGoal = () => {
    const merged = mergeSourceGoals(sourceGoals, incomes);
    setSourceGoals(merged);
    setShowModal(true);
  };

  const handleModalSave = async (updatedSourceGoals, selectedInterval) => {
    const anyInvalid = Object.values(updatedSourceGoals).some(
      (val) => val === null || val === undefined || val < 0 || Number.isNaN(val)
    );
    if (anyInvalid) {
      notifyError('Please ensure all goals are non-negative amounts.');
      return;
    }

    try {
      if (!goalId) {
        const created = await createIncomeGoal(
          updatedSourceGoals,
          selectedInterval
        );
        setGoalId(created._id);
        setTotalGoal(Number(created.totalGoal) || 0);
        setSourceGoals({ ...created.sourceGoals });
        setIntervalPeriod(created.interval || 'monthly');
        notifySuccess('Income goal created successfully!');
      } else {
        const result = await updateIncomeGoal(
          goalId,
          updatedSourceGoals,
          selectedInterval
        );
        const updatedDoc = result.updatedGoal;
        setTotalGoal(Number(updatedDoc.totalGoal) || 0);
        setSourceGoals({ ...updatedDoc.sourceGoals });
        setIntervalPeriod(updatedDoc.interval || 'monthly');
        notifySuccess('Income goal updated successfully!');
      }
      setIsHovered(false);
      setShowModal(false);
    } catch (error) {
      notifyError(error.message || 'Failed to save income goal.');
    }
  };

  const handleDeleteGoal = async () => {
    const confirmed = await confirmAction(
      'Delete Income Goal',
      'Are you sure you want to delete your income goal? This action cannot be undone.'
    );

    if (!confirmed) return;

    try {
      if (goalId) {
        await deleteIncomeGoal(goalId);
        notifySuccess('Income goal deleted successfully.');
        setGoalId(null);
        setTotalGoal(0);
        setSourceGoals({});
        setIntervalPeriod('monthly');
      }
    } catch (error) {
      notifyError(error.message || 'Failed to delete income goal.');
    }
  };

  if (!goalLoaded) {
    return (
      <div className="budget-card loading-state">
        <p>Loading Income Goal...</p>
      </div>
    );
  }

  if (!goalId) {
    return (
      <div
        className={`goal-card empty-state ${isHovered ? 'hovered' : ''}`}
        onClick={handleCreateOrEditGoal}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleCreateOrEditGoal()}
      >
        <div className="pencil-icon">&#9998;</div>
        <div className="no-budget-content">
          <img
            src={noGoalsIllustration}
            alt="No income goals illustration"
            className="no-goal-illustration"
          />
          <div className="no-budget-container">
            <h3>Looks like you don’t have an income goal yet!</h3>
            <p>Start by setting up your income goals now 🎯</p>
          </div>
        </div>

        {showModal && (
          <SourceGoalModal
            sourceGoals={sourceGoals}
            incomes={incomes}
            onClose={() => setShowModal(false)}
            onSave={handleModalSave}
          />
        )}
      </div>
    );
  }

  return (
    <div
      className={`goal-card goal-added ${isHovered ? 'hovered' : ''}`}
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
            value={goalPercentage}
            text={`${Math.round(goalPercentage)}%`}
            styles={buildStyles({
              textColor: '#003366',
              pathColor: alertColor,
              trailColor: '#e6e8f1',
            })}
          />
        </div>
        <div className="expense-info">
          <h3>
            Income Goal Overview{' '}
            <span className={`interval-tag ${interval.toLowerCase()}`}>
              {interval.charAt(0).toUpperCase() + interval.slice(1)}
            </span>
          </h3>
          <p>
            ${totalIncome.toFixed(2)} / ${totalGoal.toFixed(2)}
          </p>
        </div>
      </div>
      <button
        className="delete-icon-btn"
        onClick={(e) => {
          e.stopPropagation();
          handleDeleteGoal();
        }}
        title="Delete Income Goal"
      >
        <FaTrash />
      </button>

      {showModal && (
        <SourceGoalModal
          sourceGoals={sourceGoals}
          incomes={incomes}
          onClose={() => setShowModal(false)}
          onSave={handleModalSave}
        />
      )}
    </div>
  );
};

GoalCard.propTypes = {
  incomes: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      source: PropTypes.string.isRequired,
      amount: PropTypes.number.isRequired,
      date: PropTypes.string,
      description: PropTypes.string,
      frequency: PropTypes.string,
      skippedDates: PropTypes.array,
      createdAt: PropTypes.string,
      updatedAt: PropTypes.string,
    })
  ).isRequired,
};

export default GoalCard;
