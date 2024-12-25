import React, { useState, useEffect } from 'react';
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

const CategoryBudgetModal = ({ categoryBudgets, onClose, onSave }) => {
  const predefinedCategories = [
    { name: 'Groceries', icon: <FaShoppingCart /> },
    { name: 'Transportation', icon: <FaBus /> },
    { name: 'Entertainment', icon: <FaFilm /> },
    { name: 'Utilities', icon: <FaBolt /> },
  ];

  const [budgets, setBudgets] = useState({});
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    const mergedBudgets = { ...categoryBudgets };

    predefinedCategories.forEach((cat) => {
      if (!mergedBudgets[cat.name]) {
        mergedBudgets[cat.name] = 0;
      }
    });

    setBudgets(mergedBudgets);
  }, [categoryBudgets]);

  const handleBudgetChange = (category, value) => {
    const numericValue = Number(value);
    if (isNaN(numericValue) || numericValue < 0) return;
    setBudgets((prevBudgets) => ({
      ...prevBudgets,
      [category]: numericValue,
    }));
  };

  const handleAddNewCategory = () => {
    if (!newCategoryName.trim()) return;
    const catName = newCategoryName.trim();
    if (!budgets[catName]) {
      setBudgets((prev) => ({
        ...prev,
        [catName]: 0,
      }));
    }
    setNewCategoryName('');
  };

  const handleSave = () => {
    onSave(budgets);
    onClose();
  };

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

        <div className="budgets-list">
          {/* Display each category in budgets */}
          {Object.keys(budgets).length > 0 ? (
            Object.entries(budgets).map(([category, value]) => {
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
                      value={value || ''}
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
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
};

export default CategoryBudgetModal;
