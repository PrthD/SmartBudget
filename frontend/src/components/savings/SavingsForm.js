import React, { useState } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';

const SavingsForm = ({ onSave }) => {
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!title || !targetAmount) {
      setError('Please provide a valid title and target amount.');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/savings', {
        title,
        targetAmount: parseFloat(targetAmount),
        deadline: deadline ? new Date(deadline).toISOString() : null,
      });

      onSave(response.data);
      setTitle('');
      setTargetAmount('');
      setDeadline('');
      setSuccess('Savings goal added successfully!');
    } catch (error) {
      setError('Failed to add savings goal. Please try again.');
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

        <button type="submit">Save Goal</button>
      </form>

      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}
    </div>
  );
};

SavingsForm.propTypes = {
  onSave: PropTypes.func.isRequired,
};

export default SavingsForm;
