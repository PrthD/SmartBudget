import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { MdPercent } from 'react-icons/md';
import '../../styles/savings/SavingsGoalModal.css';
import { notifyError } from '../../utils/notificationService';
import {
  sortGoalsByDeadlineThenName,
  SAVINGS_INTERVALS,
  getSavingsTimeframe,
} from '../../utils/savingsGoalHelpers';
import { calculateTotalIncomeInInterval } from '../../utils/incomeHelpers';
import { calculateTotalExpenseInInterval } from '../../utils/expenseHelpers';

const SavingsGoalModal = ({
  subGoals = [],
  incomes = [],
  expenses = [],
  defaultInterval = 'monthly',
  onClose,
  onSave,
}) => {
  const [ratioStrings, setRatioStrings] = useState({});
  const [interval, setInterval] = useState(defaultInterval);
  const [currentNetSavings, setCurrentNetSavings] = useState(0);
  const [leftover, setLeftover] = useState(0);

  useEffect(() => {
    const newRatioStrings = {};
    subGoals.forEach((g) => {
      const displayPercent = g.ratio != null ? (g.ratio * 100).toFixed(2) : '0';
      newRatioStrings[g.name] = displayPercent;
    });
    setRatioStrings(newRatioStrings);
    setInterval(defaultInterval);
  }, [subGoals, defaultInterval]);

  useEffect(() => {
    const [startDate, endDate] = getSavingsTimeframe(interval);
    const inc = calculateTotalIncomeInInterval(incomes, startDate, endDate);
    const exp = calculateTotalExpenseInInterval(expenses, startDate, endDate);
    setCurrentNetSavings(inc - exp);
  }, [interval, incomes, expenses]);

  useEffect(() => {
    let sumOfDecimalRatios = 0;
    for (const val of Object.values(ratioStrings)) {
      const numericVal = parseFloat(val || '0') / 100;
      sumOfDecimalRatios += Number.isNaN(numericVal) ? 0 : numericVal;
    }

    let newLeftover = currentNetSavings * (1 - sumOfDecimalRatios);

    const EPSILON = 1e-9;
    if (Math.abs(newLeftover) < EPSILON) {
      newLeftover = 0;
    }

    setLeftover(newLeftover);
  }, [ratioStrings, currentNetSavings]);

  const handleRatioChange = (goalName, newValue) => {
    if (/^\d*\.?\d*$/.test(newValue)) {
      const numericVal = parseFloat(newValue || '0');
      if (numericVal > 100) return;
      setRatioStrings((prev) => ({
        ...prev,
        [goalName]: newValue,
      }));
    }
  };

  const handleSave = () => {
    if (currentNetSavings < 0) {
      notifyError(
        'Net savings is negative for this interval. Distribution is not possible.'
      );
      return;
    }

    let sumOfDecimalRatios = 0;
    for (const val of Object.values(ratioStrings)) {
      sumOfDecimalRatios += parseFloat(val || '0') / 100;
    }

    let newLeftover = currentNetSavings * (1 - sumOfDecimalRatios);
    const EPSILON = 1e-9;
    if (Math.abs(newLeftover) < EPSILON) {
      newLeftover = 0;
    }

    if (newLeftover < -EPSILON) {
      notifyError('You allocated more than your available net savings!');
      return;
    }

    if (Math.abs(sumOfDecimalRatios - 1) > 0.0001) {
      notifyError(
        'Ratios must sum to 100%. Adjust your allocations accordingly.'
      );
      return;
    }

    const updatedSubGoals = subGoals.map((g) => {
      const decimalRatio = parseFloat(ratioStrings[g.name] || '0') / 100;
      return { ...g, ratio: decimalRatio };
    });

    onSave(updatedSubGoals, interval);
    onClose();
  };

  const sortedGoals = useMemo(() => {
    return sortGoalsByDeadlineThenName(subGoals);
  }, [subGoals]);

  const disableInputs = currentNetSavings < 0;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div
        className="modal-content budget-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 className="modal-title">Distribute Your Savings</h3>
          <button className="close-btn" onClick={onClose} title="Close">
            &times;
          </button>
        </div>

        {/* Interval Selector */}
        <div className="budget-interval-container">
          <label htmlFor="savings-interval" className="budget-interval-label">
            Interval:
          </label>
          <select
            id="savings-interval"
            value={interval}
            onChange={(e) => setInterval(e.target.value)}
            className="budget-interval-select"
          >
            {SAVINGS_INTERVALS.map((iv) => (
              <option key={iv} value={iv}>
                {iv.charAt(0).toUpperCase() + iv.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Display net savings & leftover */}
        <div className="net-savings-info">
          <div className="net-savings-row">
            <span className="net-savings-label">Interval Net Savings:</span>
            <span
              className={`net-savings-value ${
                currentNetSavings < 0 ? 'negative-amount' : ''
              }`}
            >
              ${currentNetSavings.toFixed(2)}
            </span>
          </div>
          <div className="net-savings-row">
            <span className="net-savings-label">Left to distribute:</span>
            <span
              className={`net-savings-value ${
                leftover < 0 ? 'negative-amount' : ''
              }`}
            >
              ${leftover.toFixed(2)}
            </span>
          </div>
          {disableInputs && (
            <p className="negative-warning">
              Net savings is negative. You cannot allocate negative funds.
            </p>
          )}
        </div>

        {/* Sub-goals list */}
        <div className="budgets-list">
          {sortedGoals.map((g) => {
            const val = ratioStrings[g.name] || '';
            return (
              <div key={g.name} className="budget-item">
                <div className="category-label">{g.name}:</div>
                <div
                  className={`input-container budget-input-container ${
                    val ? 'input-has-value' : ''
                  }`}
                >
                  <MdPercent className="icon budget-icon" />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="styled-input budget-input"
                    value={val}
                    disabled={disableInputs}
                    onChange={(e) => handleRatioChange(g.name, e.target.value)}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="modal-actions">
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="save-btn"
            onClick={handleSave}
            disabled={subGoals.length === 0 || disableInputs}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

SavingsGoalModal.propTypes = {
  subGoals: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      deadline: PropTypes.string,
      ratio: PropTypes.number,
    })
  ),
  incomes: PropTypes.array,
  expenses: PropTypes.array,
  defaultInterval: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
};

export default SavingsGoalModal;
