import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  addSavingsGoal,
  updateSavingsGoal,
} from '../../services/savingsService';
import { validateSavingsData } from '../../utils/savingsHelpers';
import '../../styles/savings/SavingsForm.css';

const SavingsForm = ({ onSave, goalToEdit, editMode, onUpdate }) => {
  const [title, setTitle] = useState(goalToEdit?.title || '');
  const [targetAmount, setTargetAmount] = useState(
    goalToEdit?.targetAmount || ''
  );
  const [deadline, setDeadline] = useState(goalToEdit?.deadline || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (editMode && goalToEdit) {
      setTitle(goalToEdit.title);
      setTargetAmount(goalToEdit.targetAmount);
      setDeadline(
        goalToEdit.deadline
          ? new Date(goalToEdit.deadline).toISOString().split('T')[0]
          : ''
      );
    }
  }, [goalToEdit, editMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      validateSavingsData({ title, targetAmount });

      if (editMode) {
        const response = await updateSavingsGoal(goalToEdit._id, {
          title,
          targetAmount: parseFloat(targetAmount),
          deadline: deadline ? new Date(deadline).toISOString() : null,
        });
        onUpdate(response.data);
        setMessage('Savings goal updated successfully!');
      } else {
        const response = await addSavingsGoal({
          title,
          targetAmount: parseFloat(targetAmount),
          deadline: deadline ? new Date(deadline).toISOString() : null,
        });
        onSave(response.data);
        setMessage('Savings goal added successfully!');
      }
    } catch (error) {
      setMessage(error.message || 'An error occurred');
    } finally {
      setLoading(false);
      setTitle('');
      setTargetAmount('');
      setDeadline('');
    }
  };

  return (
    <div className="savings-form">
      <h2>{editMode ? 'Edit Savings Goal' : 'Add a New Savings Goal'}</h2>
      <form onSubmit={handleSubmit}>
        {/* Goal Title Input */}
        <div className="form-group">
          <label htmlFor="title">Goal Title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="e.g., Emergency Fund"
          />
        </div>

        {/* Goal Amount Input */}
        <div className="form-group">
          <label htmlFor="targetAmount">Target Amount</label>
          <input
            type="number"
            id="targetAmount"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            required
            min="0"
            placeholder="e.g., 5000"
          />
        </div>

        {/* Goal Deadline Input */}
        <div className="form-group">
          <label htmlFor="deadline">Deadline (Optional)</label>
          <input
            type="date"
            id="deadline"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading
            ? editMode
              ? 'Updating...'
              : 'Adding...'
            : editMode
              ? 'Update Goal'
              : 'Add Goal'}
        </button>
      </form>
      {message && <p className="message">{message}</p>}
    </div>
  );
};

SavingsForm.propTypes = {
  onSave: PropTypes.func.isRequired,
  goalToEdit: PropTypes.object,
  editMode: PropTypes.bool,
  onUpdate: PropTypes.func,
};

SavingsForm.defaultProps = {
  goalToEdit: null,
  editMode: false,
  onUpdate: () => {},
};

export default SavingsForm;
