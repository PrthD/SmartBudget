import React, { useState } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import '../../styles/IncomeForm.css';

const IncomeForm = ({ onIncomeAdded }) => {
  const [source, setSource] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState('once');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const frequencyOptions = ['once', 'weekly', 'biweekly', 'monthly', 'yearly'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!source || !amount || amount <= 0) {
      setError('Please provide a valid source and amount.');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/income', {
        source,
        amount: parseFloat(amount),
        date: date || new Date().toISOString(),
        description,
        frequency,
      });

      onIncomeAdded(response.data);
      setSource('');
      setAmount('');
      setDate('');
      setDescription('');
      setFrequency('once');
      setSuccess('Income added successfully!');
    } catch (err) {
      setError('Failed to add income. Please try again.');
    }
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
        <button type="submit">Add Income</button>
      </form>
      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}
    </div>
  );
};

IncomeForm.propTypes = {
  onIncomeAdded: PropTypes.func.isRequired,
};

export default IncomeForm;
