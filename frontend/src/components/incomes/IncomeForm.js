import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { addIncome } from '../../services/incomeService';
import { validateIncomeData } from '../../utils/incomeHelpers';
import '../../styles/IncomeForm.css';

const IncomeForm = ({ onIncomeAdded }) => {
  const [source, setSource] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState('once');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const frequencyOptions = ['once', 'weekly', 'biweekly', 'monthly', 'yearly'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      validateIncomeData({ source, amount });

      const response = await addIncome({
        source,
        amount: parseFloat(amount),
        date: date || new Date().toISOString(),
        description,
        frequency,
      });
      onIncomeAdded(response.data);
      setMessage('Income added successfully!');
    } catch (error) {
      setMessage(error.message || 'An error occurred');
    }
    setLoading(false);
    setSource('');
    setAmount('');
    setDate('');
    setDescription('');
    setFrequency('once');
  };

  return (
    <div className="income-form">
      <h2>Add a New Income</h2>
      <form onSubmit={handleSubmit}>
        {/* Source Input */}
        <div className="form-group">
          <label htmlFor="source">Source:</label>
          <input
            type="text"
            id="source"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            required
            placeholder="e.g., Salary, Freelance"
          />
        </div>

        {/* Amount Input */}
        <div className="form-group">
          <label htmlFor="amount">Amount:</label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            min="0"
            step="0.01"
            placeholder="Enter amount"
          />
        </div>

        {/* Date Input */}
        <div className="form-group">
          <label htmlFor="date">Date:</label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        {/* Description Input */}
        <div className="form-group">
          <label htmlFor="description">Description:</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description"
          />
        </div>
        {/* Frequency Selection */}
        <div className="form-group">
          <label htmlFor="frequency">Frequency</label>
          <select
            id="frequency"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
          >
            {frequencyOptions.map((option) => (
              <option key={option} value={option}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Adding...' : 'Add Income'}
        </button>
      </form>
      {message && <p className="message">{message}</p>}
    </div>
  );
};

IncomeForm.propTypes = {
  onIncomeAdded: PropTypes.func.isRequired,
};

export default IncomeForm;
