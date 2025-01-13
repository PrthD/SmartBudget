import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import { FaExpandAlt } from 'react-icons/fa';
import 'react-circular-progressbar/dist/styles.css';
import { createSavingsPieChart } from '../../utils/chartHelpers';
import { calculateTotalIncomeInInterval } from '../../utils/incomeHelpers';
import { calculateTotalExpenseInInterval } from '../../utils/expenseHelpers';
import {
  getSavingsTimeframe,
  getGoalAlertColor,
} from '../../utils/savingsGoalHelpers';
import { fetchSavingsGoal } from '../../services/savingsGoalService';
import { notifyError } from '../../utils/notificationService';
import noGoalIllustration from '../../assets/icons/no-goals.svg';
import '../../styles/dashboard/SavingsGoalOverviewCard.css';

const SavingsGoalOverviewCard = ({ incomes, expenses, allSubGoals }) => {
  const [goalId, setGoalId] = useState(null);
  const [goalRatios, setGoalRatios] = useState({});
  const [interval, setIntervalPeriod] = useState('monthly');
  const [goalLoaded, setGoalLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const chartRef = useRef(null);

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

  const handleCardClick = () => {
    if (!goalId) return;
    setShowModal(true);
  };

  const closeModal = (e) => {
    e.stopPropagation();
    setShowModal(false);
  };

  useEffect(() => {
    const loadGoal = async () => {
      try {
        const goalResponse = await fetchSavingsGoal();
        if (goalResponse) {
          setGoalId(goalResponse._id);
          setGoalRatios(goalResponse.goalRatios || {});
          setIntervalPeriod(goalResponse.interval || 'monthly');
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

  useEffect(() => {
    if (!showModal || !chartRef.current) return;

    const breakdownMap = allSubGoals.reduce((map, subGoal) => {
      map[subGoal.name] = {
        allocated: netSavings * (goalRatios[subGoal.name] || 0),
        current: subGoal.currentAmount || 0,
        target: subGoal.targetAmount || 0,
      };
      return map;
    }, {});

    const subGoalNames = Object.keys(breakdownMap);
    const targetValues = subGoalNames.map((name) => breakdownMap[name].target);

    if (chartRef.current._chartInstance) {
      chartRef.current._chartInstance.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    chartRef.current._chartInstance = createSavingsPieChart(
      ctx,
      {
        labels: subGoalNames,
        values: targetValues,
      },
      {},
      breakdownMap
    );
  }, [showModal, goalRatios, allSubGoals, netSavings]);

  if (!goalLoaded) {
    return (
      <div className="savings-goal-card loading-state">
        <p>Loading Savings Distribution...</p>
      </div>
    );
  }

  if (!goalId) {
    return (
      <div
        className={`savings-goal-overview-card empty-state ${
          isHovered ? 'hovered' : ''
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="no-goal-content">
          <img
            src={noGoalIllustration}
            alt="No savings goal illustration"
            className="no-goal-illustration"
          />
          <div className="no-goal-container">
            <h3>No Savings Allocation Found!</h3>
            <p>Create a savings goal to start tracking your progress ✨</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={`savings-goal-overview-card goal-added ${
          isHovered ? 'hovered' : ''
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleCardClick}
      >
        <FaExpandAlt className="enlarge-icon" title="Enlarge" />
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
          <div className="savings-info">
            <h3>
              Savings Overview{' '}
              <span className={`interval-tag ${interval.toLowerCase()}`}>
                {interval.charAt(0).toUpperCase() + interval.slice(1)}
              </span>
            </h3>
            <p>
              <strong>${totalSaved.toFixed(2)}</strong> /
              <strong>${totalTarget.toFixed(2)}</strong> (Target)
            </p>
          </div>
        </div>
      </div>

      {showModal && (
        <div
          className="goal-distribution-overlay"
          onClick={() => setShowModal(false)}
        >
          <div className="goal-distribution-modal" onClick={closeModal}>
            <button className="close-btn" onClick={closeModal} title="Close">
              &times;
            </button>
            <h2>Savings Goal Distribution</h2>
            <canvas ref={chartRef} width="300" height="300" />
          </div>
        </div>
      )}
    </>
  );
};

SavingsGoalOverviewCard.propTypes = {
  incomes: PropTypes.array.isRequired,
  expenses: PropTypes.array.isRequired,
  allSubGoals: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      currentAmount: PropTypes.number,
      targetAmount: PropTypes.number,
    })
  ).isRequired,
};

export default SavingsGoalOverviewCard;
