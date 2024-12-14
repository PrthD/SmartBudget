import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { notifyError, notifySuccess } from '../../utils/notificationService';
import { fetchBudget, updateBudget } from '../../services/expenseService';
import {
  calculateTotalExpense,
  getBudgetAlertColor,
  groupExpensesByCategory,
} from '../../utils/expenseHelpers';
import CategoryBudgetModal from './CategoryBudgetModal';
import '../../styles/expenses/BudgetCard.css';

const BudgetCard = ({ expenses }) => {
  const [totalBudget, setTotalBudget] = useState(0);
  const [categoryBudgets, setCategoryBudgets] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const loadBudget = async () => {
      try {
        const { totalBudget, categoryBudgets: fetchedCategoryBudgets } =
          await fetchBudget();

        const groupedCategories = groupExpensesByCategory(expenses);

        const combinedBudgets = groupedCategories.reduce((acc, category) => {
          acc[category.category] =
            fetchedCategoryBudgets[category.category] || 0;
          return acc;
        }, {});

        setTotalBudget(Number(totalBudget) || 0);
        setCategoryBudgets(combinedBudgets);
      } catch (error) {
        notifyError('Failed to load budget information.');
      }
    };

    loadBudget();
  }, [expenses]);

  const handleModalSave = async (updatedCategoryBudgets) => {
    try {
      await updateBudget({ categoryBudgets: updatedCategoryBudgets });

      const { totalBudget, categoryBudgets: fetchedCategoryBudgets } =
        await fetchBudget();

      setTotalBudget(totalBudget);
      setCategoryBudgets(fetchedCategoryBudgets);

      setShowModal(false);
      notifySuccess('Category budgets updated successfully!');
    } catch (error) {
      notifyError('Failed to update category budgets.');
    }
  };

  const totalSpent = calculateTotalExpense(expenses);
  const budgetPercentage =
    totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const alertColor = getBudgetAlertColor(budgetPercentage);

  return (
    <div
      className={`budget-card ${isHovered ? 'hovered' : ''}`}
      onClick={() => setShowModal(true)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && setShowModal(true)}
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
