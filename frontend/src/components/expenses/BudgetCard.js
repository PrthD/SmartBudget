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
import {
  calculateTotalExpense,
  groupExpensesByCategory,
} from '../../utils/expenseHelpers';
import { getBudgetAlertColor } from '../../utils/budgetHelpers';
import CategoryBudgetModal from './CategoryBudgetModal';
import noBudgetsIllustration from '../../assets/icons/no-budgets.svg';
import '../../styles/expenses/BudgetCard.css';

const BudgetCard = ({ expenses }) => {
  const [budgetId, setBudgetId] = useState(null);
  const [totalBudget, setTotalBudget] = useState(0);
  const [categoryBudgets, setCategoryBudgets] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [budgetLoaded, setBudgetLoaded] = useState(false);

  useEffect(() => {
    const loadBudget = async () => {
      try {
        const budgetResponse = await fetchBudget();
        setBudgetId(budgetResponse._id);
        setTotalBudget(Number(budgetResponse.totalBudget) || 0);

        const groupedCategories = groupExpensesByCategory(expenses);
        const combined = { ...budgetResponse.categoryBudgets };
        groupedCategories.forEach(({ category }) => {
          if (!combined[category]) {
            combined[category] = 0;
          }
        });
        setCategoryBudgets(combined);
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
    if (budgetId) {
      setShowModal(true);
      return;
    }

    setCategoryBudgets({});
    setShowModal(true);
  };

  const handleModalSave = async (updatedCategoryBudgets) => {
    const total = Object.values(updatedCategoryBudgets).reduce(
      (sum, val) => sum + val,
      0
    );

    if (total === 0) {
      notifyError('Budget cannot be 0. Please set a valid amount.');
      return;
    }

    try {
      if (!budgetId) {
        const created = await createBudget({
          categoryBudgets: updatedCategoryBudgets,
        });

        setBudgetId(created._id);
        setTotalBudget(Number(created.totalBudget) || 0);
        setCategoryBudgets({ ...created.categoryBudgets });
        notifySuccess('Budget created successfully!');
      } else {
        const result = await updateBudget(budgetId, {
          categoryBudgets: updatedCategoryBudgets,
        });
        const updatedDoc = result.updatedBudget;
        setTotalBudget(Number(updatedDoc.totalBudget) || 0);
        setCategoryBudgets({ ...updatedDoc.categoryBudgets });
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
            onClose={() => setShowModal(false)}
            onSave={handleModalSave}
          />
        )}
      </div>
    );
  }

  const totalSpent = calculateTotalExpense(expenses);
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
          <h3>Budget Overview</h3>
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
      amount: PropTypes.number.isRequired,
      category: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export default BudgetCard;
