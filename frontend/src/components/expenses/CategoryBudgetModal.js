import React, { useState } from 'react';
import PropTypes from 'prop-types';
import '../../styles/expenses/CategoryBudgetModal.css';

const CategoryBudgetModal = ({ categoryBudgets, onClose, onSave }) => {
  const [budgets, setBudgets] = useState(categoryBudgets || {});

  const handleBudgetChange = (category, value) => {
    const numericValue = Number(value);
    if (isNaN(numericValue) || numericValue < 0) return;
    setBudgets((prevBudgets) => ({
      ...prevBudgets,
      [category]: numericValue,
    }));
  };

  const handleSave = () => {
    onSave(budgets);
    onClose();
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Set Category Budgets</h3>
          <button className="close-btn" onClick={onClose} title="Close">
            &times;
          </button>
        </div>
        <div className="budgets-list">
          {Object.keys(budgets).length > 0 ? (
            Object.entries(budgets).map(([category, value]) => (
              <div key={category} className="budget-item">
                <span className="category-label">{category}:</span>
                <input
                  type="number"
                  className="budget-input"
                  value={value || ''}
                  onChange={(e) => handleBudgetChange(category, e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
            ))
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
