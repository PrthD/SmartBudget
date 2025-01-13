import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import { FaExpandAlt } from 'react-icons/fa';
import 'react-circular-progressbar/dist/styles.css';
import { createIncomePieChart } from '../../utils/chartHelpers';
import { calculateTotalIncomeInInterval } from '../../utils/incomeHelpers';
import {
  getGoalAlertColor,
  getTimeframeDates,
  calculateSourceBreakdown,
} from '../../utils/incomeGoalHelpers';
import { fetchIncomeGoal } from '../../services/incomeGoalService';
import { notifyError } from '../../utils/notificationService';
import noGoalsIllustration from '../../assets/icons/no-goals.svg';
import '../../styles/dashboard/GoalOverviewCard.css';

const GoalOverviewCard = ({ incomes }) => {
  const [goalId, setGoalId] = useState(null);
  const [totalGoal, setTotalGoal] = useState(0);
  const [sourceGoals, setSourceGoals] = useState({});
  const [interval, setIntervalPeriod] = useState('monthly');
  const [goalLoaded, setGoalLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const chartRef = useRef(null);

  const [startDate, endDate] = getTimeframeDates(interval);

  const totalIncome = calculateTotalIncomeInInterval(
    incomes,
    startDate,
    endDate
  );
  const goalPercentage = totalGoal > 0 ? (totalIncome / totalGoal) * 100 : 0;
  const alertColor = getGoalAlertColor(goalPercentage);

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
        const goalResponse = await fetchIncomeGoal();
        if (goalResponse) {
          setGoalId(goalResponse._id);
          setTotalGoal(Number(goalResponse.totalGoal) || 0);
          if (goalResponse.interval) {
            setIntervalPeriod(goalResponse.interval);
          }
          setSourceGoals(goalResponse.sourceGoals || {});
        }
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
    if (!showModal || !chartRef.current) return;

    const allSources = Object.keys(sourceGoals);
    const breakdownMap = calculateSourceBreakdown(incomes, sourceGoals);

    const nonZeroSources = [];
    const zeroSources = [];

    for (const source of allSources) {
      if (!breakdownMap[source]) {
        breakdownMap[source] = { earned: 0, goal: sourceGoals[source] || 0 };
      }
      if (breakdownMap[source].goal > 0) {
        nonZeroSources.push(source);
      } else {
        zeroSources.push(source);
      }
    }

    const sourceNames = nonZeroSources;
    const dataGoals = sourceNames.map(
      (source) => breakdownMap[source].goal || 0
    );

    if (chartRef.current._chartInstance) {
      chartRef.current._chartInstance.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    chartRef.current._chartInstance = createIncomePieChart(
      ctx,
      {
        labels: sourceNames,
        values: dataGoals,
      },
      {},
      breakdownMap,
      zeroSources
    );
  }, [showModal, sourceGoals, incomes]);

  if (!goalLoaded) {
    return (
      <div className="goal-card loading-state">
        <p>Loading Income Goal...</p>
      </div>
    );
  }

  if (!goalId) {
    return (
      <div
        className={`goal-overview-card empty-state ${isHovered ? 'hovered' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="no-goal-content">
          <img
            src={noGoalsIllustration}
            alt="No income goals illustration"
            className="no-goal-illustration"
          />
          <div className="no-goal-container">
            <h3>Looks like you don’t have an income goal yet!</h3>
            <p>Create an income goal to track your progress 🎯</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={`goal-overview-card goal-added ${isHovered ? 'hovered' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleCardClick}
      >
        <FaExpandAlt className="enlarge-icon" title="Enlarge" />
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
          <div className="income-info">
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
      </div>

      {/* Modal Overlay for the source-based distribution pie chart */}
      {showModal && (
        <div
          className="goal-distribution-overlay"
          onClick={() => setShowModal(false)}
        >
          <div className="goal-distribution-modal" onClick={closeModal}>
            <button className="close-btn" onClick={closeModal} title="Close">
              &times;
            </button>
            <h2>Income Source Distribution</h2>
            <canvas ref={chartRef} width="300" height="300" />
          </div>
        </div>
      )}
    </>
  );
};

GoalOverviewCard.propTypes = {
  incomes: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string,
      source: PropTypes.string,
      amount: PropTypes.number.isRequired,
      date: PropTypes.string,
    })
  ).isRequired,
};

export default GoalOverviewCard;
