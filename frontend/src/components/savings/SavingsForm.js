import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { addSavingsGoal } from '../../services/savingsService';
import { validateSavingsData } from '../../utils/savingsHelpers';

const SavingsForm = ({ onSave }) => {
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      validateSavingsData({ title, targetAmount });

      const response = await addSavingsGoal({
        title,
        targetAmount: parseFloat(targetAmount),
        deadline: deadline ? new Date(deadline).toISOString() : null,
      });
      onSave(response.data);
      setMessage('Savings goal added successfully!');
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
      <h2>Add a New Savings Goal</h2>
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
          {loading ? 'Adding...' : 'Add Expense'}
        </button>
      </form>
      {message && <p className="message">{message}</p>}
    </div>
  );
};

SavingsForm.propTypes = {
  onSave: PropTypes.func.isRequired,
};

export default SavingsForm;
