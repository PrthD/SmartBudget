import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import '../../styles/expenses/CategoryBudgetModal.css';
import {
  FaShoppingCart,
  FaBus,
  FaFilm,
  FaBolt,
  FaPlusCircle,
  FaDollarSign,
} from 'react-icons/fa';
import { notifyError } from '../../utils/notificationService';
import { sortCategoryBudgets } from '../../utils/budgetHelpers';

const CategoryBudgetModal = ({
  categoryBudgets,
  expenses,
  onClose,
  onSave,
}) => {
  const predefinedCategories = [
    { name: 'Groceries', icon: <FaShoppingCart /> },
    { name: 'Transportation', icon: <FaBus /> },
    { name: 'Entertainment', icon: <FaFilm /> },
    { name: 'Utilities', icon: <FaBolt /> },
  ];

  const [budgets, setBudgets] = useState({});
  const [newCategoryName, setNewCategoryName] = useState('');
  const [interval, setInterval] = useState('monthly');
  const [addedCategories, setAddedCategories] = useState([]);

  useEffect(() => {
    const mergedBudgets = { ...categoryBudgets };

    predefinedCategories.forEach((cat) => {
      if (!mergedBudgets[cat.name]) {
        mergedBudgets[cat.name] = 0;
      }
    });

    setBudgets(mergedBudgets);
  }, [categoryBudgets]);

  const categoryCreatedAtMap = useMemo(() => {
    const map = {};
    expenses.forEach((exp) => {
      const cat = exp.category;
      if (!map[cat]) {
        map[cat] = exp.createdAt;
      } else {
        if (new Date(exp.createdAt) < new Date(map[cat])) {
          map[cat] = exp.createdAt;
        }
      }
    });
    return map;
  }, [expenses]);

  const handleBudgetChange = (category, value) => {
    if (/^\d*\.?\d*$/.test(value)) {
      setBudgets((prev) => ({
        ...prev,
        [category]: value,
      }));
    }
  };

  const handleAddNewCategory = () => {
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) {
      notifyError('Category name cannot be empty.');
      return;
    }
    if (!budgets[trimmedName]) {
      setBudgets((prev) => ({
        ...prev,
        [trimmedName]: 0,
      }));
      setAddedCategories((prev) => [...prev, trimmedName]);
    }
    setNewCategoryName('');
  };

  const handleSave = () => {
    const sanitizedBudgets = Object.fromEntries(
      Object.entries(budgets).map(([category, value]) => [
        category,
        parseFloat(value) || 0,
      ])
    );

    const anyInvalid = Object.values(sanitizedBudgets).some(
      (val) => val < 0 || Number.isNaN(val)
    );
    if (anyInvalid) {
      notifyError('Please ensure all budgets are non-negative amounts.');
      return;
    }

    const total = Object.values(sanitizedBudgets).reduce(
      (sum, val) => sum + val,
      0
    );
    if (total === 0) {
      notifyError('Budget cannot be 0. Please set a valid amount.');
      return;
    }

    onSave(sanitizedBudgets, interval);
    onClose();
  };

  const sortedCategories = useMemo(() => {
    return sortCategoryBudgets(
      budgets,
      predefinedCategories,
      addedCategories,
      categoryCreatedAtMap
    );
  }, [budgets, predefinedCategories, addedCategories, categoryCreatedAtMap]);

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div
        className="modal-content budget-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 className="modal-title">Set Category Budgets</h3>
          <button className="close-btn" onClick={onClose} title="Close">
            &times;
          </button>
        </div>

        {/* Interval Selector */}
        <div className="budget-interval-container">
          <label htmlFor="budget-interval" className="budget-interval-label">
            Budget Interval:
          </label>
          <select
            id="budget-interval"
            value={interval}
            onChange={(e) => setInterval(e.target.value)}
            className="budget-interval-select"
          >
            <option value="weekly">Weekly</option>
            <option value="biweekly">Biweekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>

        {/* Add new category row */}
        <div className="new-category-row">
          <label htmlFor="new-category-input" className="category-label">
            New Category
          </label>
          <input
            id="new-category-input"
            type="text"
            placeholder="Enter category name..."
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            className="styled-input new-category-input"
          />
          <button
            className="add-category-icon-btn"
            onClick={handleAddNewCategory}
            title="Add Category"
          >
            <FaPlusCircle />
          </button>
        </div>

        {/* Display each category in budgets */}
        <div className="budgets-list">
          {sortedCategories.length > 0 ? (
            sortedCategories.map((category) => {
              const value = budgets[category] || '';
              const categoryIcon =
                predefinedCategories.find((cat) => cat.name === category)
                  ?.icon || null;

              return (
                <div
                  key={category}
                  className="budget-item form-group input-icon"
                >
                  <div className="category-label">
                    {categoryIcon && (
                      <span className="category-icon">{categoryIcon}</span>
                    )}
                    {category}:
                  </div>
                  <div
                    className={`input-container budget-input-container ${
                      value ? 'input-has-value' : ''
                    }`}
                  >
                    <FaDollarSign className="icon budget-icon" />
                    <input
                      type="number"
                      className="styled-input budget-input"
                      value={value}
                      onChange={(e) =>
                        handleBudgetChange(category, e.target.value)
                      }
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <p className="no-budgets-message">No categories available.</p>
          )}
        </div>

        <div className="modal-actions">
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="save-btn" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

CategoryBudgetModal.propTypes = {
  categoryBudgets: PropTypes.object.isRequired,
  expenses: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string,
      category: PropTypes.string,
      customCategory: PropTypes.bool,
      amount: PropTypes.number,
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
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
};

export default CategoryBudgetModal;
