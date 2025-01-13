import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import { FaExpandAlt } from 'react-icons/fa';
import 'react-circular-progressbar/dist/styles.css';
import { createExpensePieChart } from '../../utils/chartHelpers';
import { calculateTotalExpenseInInterval } from '../../utils/expenseHelpers';
import {
  getBudgetAlertColor,
  getTimeframeDates,
  calculateCategoryBreakdown,
} from '../../utils/budgetHelpers';
import { fetchBudget } from '../../services/budgetService';
import { notifyError } from '../../utils/notificationService';
import noBudgetsIllustration from '../../assets/icons/no-budgets.svg';
import '../../styles/dashboard/BudgetOverviewCard.css';

const BudgetOverviewCard = ({ expenses }) => {
  const [budgetId, setBudgetId] = useState(null);
  const [totalBudget, setTotalBudget] = useState(0);
  const [categoryBudgets, setCategoryBudgets] = useState({});
  const [interval, setIntervalPeriod] = useState('monthly');
  const [budgetLoaded, setBudgetLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const chartRef = useRef(null);

  const [startDate, endDate] = getTimeframeDates(interval);

  const totalSpent = calculateTotalExpenseInInterval(
    expenses,
    startDate,
    endDate
  );
  const budgetPercentage =
    totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const alertColor = getBudgetAlertColor(budgetPercentage);

  const handleCardClick = () => {
    if (!budgetId) return;
    setShowModal(true);
  };

  const closeModal = (e) => {
    e.stopPropagation();
    setShowModal(false);
  };

  useEffect(() => {
    const loadBudget = async () => {
      try {
        const budgetResponse = await fetchBudget();
        if (budgetResponse) {
          setBudgetId(budgetResponse._id);
          setTotalBudget(Number(budgetResponse.totalBudget) || 0);
          if (budgetResponse.interval) {
            setIntervalPeriod(budgetResponse.interval);
          }
          const catBuds = budgetResponse.categoryBudgets || {};
          setCategoryBudgets(Object.fromEntries(Object.entries(catBuds)));
        }
      } catch (error) {
        if (!error.message.includes('No budget record found')) {
          notifyError(error.message || 'Failed to load budget information.');
        }
      } finally {
        setBudgetLoaded(true);
      }
    };
    loadBudget();
  }, [expenses]);

  useEffect(() => {
    if (!showModal || !chartRef.current) return;

    const allCats = Object.keys(categoryBudgets);
    const breakdownMap = calculateCategoryBreakdown(expenses, categoryBudgets);
    const nonZeroCategories = [];
    const zeroCategories = [];

    for (const cat of allCats) {
      if (!breakdownMap[cat]) {
        breakdownMap[cat] = { spent: 0, budget: categoryBudgets[cat] || 0 };
      }
      if (breakdownMap[cat].budget > 0) {
        nonZeroCategories.push(cat);
      } else {
        zeroCategories.push(cat);
      }
    }

    const categoryNames = nonZeroCategories;
    const dataBudget = categoryNames.map(
      (cat) => breakdownMap[cat].budget || 0
    );

    if (chartRef.current._chartInstance) {
      chartRef.current._chartInstance.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    chartRef.current._chartInstance = createExpensePieChart(
      ctx,
      {
        labels: categoryNames,
        values: dataBudget,
      },
      {},
      breakdownMap,
      zeroCategories
    );
  }, [showModal, categoryBudgets, expenses]);

  if (!budgetLoaded) {
    return (
      <div className="budget-card loading-state">
        <p>Loading Budget...</p>
      </div>
    );
  }

  if (!budgetId) {
    return (
      <div
        className={`budget-overview-card empty-state ${isHovered ? 'hovered' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="no-budget-content">
          <img
            src={noBudgetsIllustration}
            alt="No budgets illustration"
            className="no-budget-illustration"
          />
          <div className="no-budget-container">
            <h3>Looks like you don’t have a budget yet!</h3>
            <p>Create a budget to start tracking your expenses 🎉</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={`budget-overview-card budget-added ${isHovered ? 'hovered' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleCardClick}
      >
        <FaExpandAlt className="enlarge-icon" title="Enlarge" />
        <div className="card-content">
          <div className="progress-container">
            <CircularProgressbar
              value={budgetPercentage}
              text={`${Math.round(budgetPercentage)}%`}
              styles={buildStyles({
                textColor: '#003366',
                pathColor: alertColor,
                trailColor: '#e6e8f1',
              })}
            />
          </div>
          <div className="expense-info">
            <h3>
              Budget Overview{' '}
              <span className={`interval-tag ${interval.toLowerCase()}`}>
                {interval.charAt(0).toUpperCase() + interval.slice(1)}
              </span>
            </h3>
            <p>
              ${totalSpent.toFixed(2)} / ${totalBudget.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Modal Overlay for the category-based distribution pie chart */}
      {showModal && (
        <div
          className="budget-distribution-overlay"
          onClick={() => setShowModal(false)}
        >
          <div className="budget-distribution-modal" onClick={closeModal}>
            <button className="close-btn" onClick={closeModal} title="Close">
              &times;
            </button>
            <h2>Budget Category Distribution</h2>
            <canvas ref={chartRef} width="300" height="300" />
          </div>
        </div>
      )}
    </>
  );
};

BudgetOverviewCard.propTypes = {
  expenses: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string,
      category: PropTypes.string,
      amount: PropTypes.number.isRequired,
      date: PropTypes.string,
    })
  ).isRequired,
};

export default BudgetOverviewCard;
