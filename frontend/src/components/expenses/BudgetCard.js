import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import { FaTrash } from 'react-icons/fa';
import 'react-circular-progressbar/dist/styles.css';
import { notifyError, notifySuccess } from '../../utils/notificationService';
import { confirmAction } from '../../utils/confirmationService';
import {
  fetchBudget,
  updateBudget,
  createBudget,
  deleteBudget,
} from '../../services/budgetService';
import { calculateTotalExpenseInInterval } from '../../utils/expenseHelpers';
import {
  getBudgetAlertColor,
  getTimeframeDates,
  mergeBudgetCategories,
} from '../../utils/budgetHelpers';
import CategoryBudgetModal from './CategoryBudgetModal';
import noBudgetsIllustration from '../../assets/icons/no-budgets.svg';
import '../../styles/expenses/BudgetCard.css';

const BudgetCard = ({ expenses }) => {
  const [budgetId, setBudgetId] = useState(null);
  const [totalBudget, setTotalBudget] = useState(0);
  const [categoryBudgets, setCategoryBudgets] = useState({});
  const [interval, setIntervalPeriod] = useState('monthly');
  const [showModal, setShowModal] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [budgetLoaded, setBudgetLoaded] = useState(false);

  useEffect(() => {
    const loadBudget = async () => {
      try {
        const budgetResponse = await fetchBudget();
        setBudgetId(budgetResponse._id);
        setTotalBudget(Number(budgetResponse.totalBudget) || 0);

        if (budgetResponse.interval) {
          setIntervalPeriod(budgetResponse.interval);
        }

        const merged = mergeBudgetCategories(
          budgetResponse.categoryBudgets,
          expenses
        );
        setCategoryBudgets(merged);
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

  const handleCreateOrEditBudget = () => {
    const merged = mergeBudgetCategories(categoryBudgets, expenses);
    setCategoryBudgets(merged);
    setShowModal(true);
  };

  const handleModalSave = async (updatedCategoryBudgets, selectedInterval) => {
    const anyInvalid = Object.values(updatedCategoryBudgets).some(
      (val) => val === null || val === undefined || val < 0 || Number.isNaN(val)
    );
    if (anyInvalid) {
      notifyError('Please ensure all budgets are non-negative amounts.');
      return;
    }

    try {
      if (!budgetId) {
        const created = await createBudget(
          updatedCategoryBudgets,
          selectedInterval
        );
        setBudgetId(created._id);
        setTotalBudget(Number(created.totalBudget) || 0);
        setCategoryBudgets({ ...created.categoryBudgets });
        setIntervalPeriod(created.interval || 'monthly');
        notifySuccess('Budget created successfully!');
      } else {
        const result = await updateBudget(
          budgetId,
          updatedCategoryBudgets,
          selectedInterval
        );
        const updatedDoc = result.updatedBudget;
        setTotalBudget(Number(updatedDoc.totalBudget) || 0);
        setCategoryBudgets({ ...updatedDoc.categoryBudgets });
        setIntervalPeriod(updatedDoc.interval || 'monthly');
        notifySuccess('Budget updated successfully!');
      }
      setIsHovered(false);
      setShowModal(false);
    } catch (error) {
      notifyError(error.message || 'Failed to save budget.');
    }
  };

  const handleDeleteBudget = async () => {
    const confirmed = await confirmAction(
      'Delete Budget',
      'Are you sure you want to delete your budget? This action cannot be undone.'
    );

    if (!confirmed) return;

    try {
      if (budgetId) {
        await deleteBudget(budgetId);
        notifySuccess('Budget deleted successfully.');
        setBudgetId(null);
        setTotalBudget(0);
        setCategoryBudgets({});
        setIntervalPeriod('monthly');
      }
    } catch (error) {
      notifyError(error.message || 'Failed to delete budget.');
    }
  };

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
        className={`budget-card empty-state ${isHovered ? 'hovered' : ''}`}
        onClick={handleCreateOrEditBudget}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleCreateOrEditBudget()}
      >
        <div className="pencil-icon">&#9998;</div>
        <div className="no-budget-content">
          <img
            src={noBudgetsIllustration}
            alt="No budgets illustration"
            className="no-budget-illustration"
          />
          <div className="no-budget-container">
            <h3>Looks like you don’t have a budget yet!</h3>
            <p>Get started by creating your budget now 🎉</p>
          </div>
        </div>

        {showModal && (
          <CategoryBudgetModal
            categoryBudgets={categoryBudgets}
            expenses={expenses}
            onClose={() => setShowModal(false)}
            onSave={handleModalSave}
          />
        )}
      </div>
    );
  }

  const [startDate, endDate] = getTimeframeDates(interval);
  const totalSpent = calculateTotalExpenseInInterval(
    expenses,
    startDate,
    endDate
  );
  const budgetPercentage =
    totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const alertColor = getBudgetAlertColor(budgetPercentage);

  return (
    <div
      className={`budget-card budget-added ${isHovered ? 'hovered' : ''}`}
      onClick={handleCreateOrEditBudget}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleCreateOrEditBudget()}
    >
      <div className="pencil-icon">&#9998;</div>
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
      <button
        className="delete-icon-btn"
        onClick={(e) => {
          e.stopPropagation();
          handleDeleteBudget();
        }}
        title="Delete Budget"
      >
        <FaTrash />
      </button>

      {showModal && (
        <CategoryBudgetModal
          categoryBudgets={categoryBudgets}
          expenses={expenses}
          onClose={() => setShowModal(false)}
          onSave={handleModalSave}
        />
      )}
    </div>
  );
};

BudgetCard.propTypes = {
  expenses: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      category: PropTypes.string.isRequired,
      customCategory: PropTypes.bool,
      amount: PropTypes.number.isRequired,
      date: PropTypes.string,
      description: PropTypes.string,
      frequency: PropTypes.string,
      isOriginal: PropTypes.bool,
      originalExpenseId: PropTypes.string,
      skippedDates: PropTypes.array,
      createdAt: PropTypes.string,
      updatedAt: PropTypes.string,
    })
  ).isRequired,
};

export default BudgetCard;
