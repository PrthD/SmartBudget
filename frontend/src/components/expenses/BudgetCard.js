import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { notifyError, notifySuccess } from '../../utils/notificationService';
import {
  fetchBudget,
  updateBudget,
  createBudget,
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
        notifySuccess('Category budgets updated successfully!');
      }
      setShowModal(false);
    } catch (error) {
      notifyError(error.message || 'Failed to save category budgets.');
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
        <img
          src={noBudgetsIllustration}
          alt="No budgets illustration"
          className="no-budget-illustration"
        />
        <div className="no-budget-container">
          <h3>No Budget Found</h3>
          <p>Click to create your first budget!</p>
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
      className={`budget-card ${isHovered ? 'hovered' : ''}`}
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
