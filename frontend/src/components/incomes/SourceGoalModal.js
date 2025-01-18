import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import '../../styles/expenses/CategoryBudgetModal.css';
import { FaPlusCircle, FaDollarSign } from 'react-icons/fa';
import { notifyError } from '../../utils/notificationService';
import { sortSourceGoals } from '../../utils/incomeGoalHelpers';

const SourceGoalModal = ({ sourceGoals, incomes, onClose, onSave }) => {
  const [goals, setGoals] = useState({});
  const [newSourceName, setNewSourceName] = useState('');
  const [interval, setInterval] = useState('monthly');
  const [addedSources, setAddedSources] = useState([]);

  useEffect(() => {
    setGoals({ ...sourceGoals });
  }, [sourceGoals]);

  const sourceCreatedAtMap = useMemo(() => {
    const map = {};
    incomes.forEach((inc) => {
      const src = inc.source;
      if (!map[src]) {
        map[src] = inc.createdAt;
      } else {
        if (new Date(inc.createdAt) < new Date(map[src])) {
          map[src] = inc.createdAt;
        }
      }
    });
    return map;
  }, [incomes]);

  const handleGoalChange = (source, value) => {
    if (/^\d*\.?\d*$/.test(value)) {
      setGoals((prev) => ({
        ...prev,
        [source]: value,
      }));
    }
  };

  const handleAddNewSource = () => {
    const trimmedName = newSourceName.trim();
    if (!trimmedName) {
      notifyError('Source name cannot be empty.');
      return;
    }

    if (!goals[trimmedName]) {
      setGoals((prev) => ({
        ...prev,
        [trimmedName]: 0,
      }));
      setAddedSources((prev) => [...prev, trimmedName]);
    }
    setNewSourceName('');
  };

  const handleSave = () => {
    const sanitizedGoals = Object.fromEntries(
      Object.entries(goals).map(([src, val]) => [src, parseFloat(val) || 0])
    );

    const anyInvalid = Object.values(sanitizedGoals).some(
      (num) => num < 0 || Number.isNaN(num)
    );
    if (anyInvalid) {
      notifyError('Please ensure all goals are non-negative amounts.');
      return;
    }

    const total = Object.values(sanitizedGoals).reduce((sum, n) => sum + n, 0);
    if (total === 0) {
      notifyError('The total goal cannot be 0. Please set a valid amount.');
      return;
    }

    onSave(sanitizedGoals, interval);
    onClose();
  };

  const sortedSources = useMemo(() => {
    return sortSourceGoals(goals, addedSources, sourceCreatedAtMap);
  }, [goals, addedSources, sourceCreatedAtMap]);

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div
        className="modal-content budget-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 className="modal-title">Set Source Goals</h3>
          <button className="close-btn" onClick={onClose} title="Close">
            &times;
          </button>
        </div>

        {/* Interval Selector */}
        <div className="budget-interval-container">
          <label htmlFor="goal-interval" className="budget-interval-label">
            Goal Interval:
          </label>
          <select
            id="goal-interval"
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

        {/* Add new source row */}
        <div className="new-category-row">
          <label htmlFor="new-source-input" className="category-label">
            New Source
          </label>
          <input
            id="new-source-input"
            type="text"
            placeholder="Enter source name..."
            value={newSourceName}
            onChange={(e) => setNewSourceName(e.target.value)}
            className="styled-input new-category-input"
          />
          <button
            className="add-category-icon-btn"
            onClick={handleAddNewSource}
            title="Add Source"
          >
            <FaPlusCircle />
          </button>
        </div>

        {/* Display each source goal */}
        <div className="budgets-list">
          {sortedSources.length > 0 ? (
            sortedSources.map((source) => {
              const value = goals[source] || '';

              return (
                <div key={source} className="budget-item">
                  <div className="category-label">{source}:</div>
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
                      onChange={(e) => handleGoalChange(source, e.target.value)}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <p className="no-budgets-message">
              No income sources found. Click the{' '}
              <FaPlusCircle aria-label="Add Source" /> button above to add a new
              income source.
            </p>
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

SourceGoalModal.propTypes = {
  sourceGoals: PropTypes.object.isRequired,
  incomes: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string,
      source: PropTypes.string,
      amount: PropTypes.number,
      date: PropTypes.string,
      description: PropTypes.string,
      frequency: PropTypes.string,
      skippedDates: PropTypes.array,
      createdAt: PropTypes.string,
      updatedAt: PropTypes.string,
    })
  ).isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
};

export default SourceGoalModal;
