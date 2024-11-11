import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { addIncome, updateIncome } from '../../services/incomeService';
import { validateIncomeData } from '../../utils/incomeHelpers';
import '../../styles/IncomeForm.css';

const IncomeForm = ({ onIncomeAdded, incomeToEdit, onIncomeUpdated, mode }) => {
  const [source, setSource] = useState(incomeToEdit?.source || '');
  const [amount, setAmount] = useState(incomeToEdit?.amount || '');
  const [date, setDate] = useState(incomeToEdit?.date || '');
  const [description, setDescription] = useState(
    incomeToEdit?.description || ''
  );
  const [frequency, setFrequency] = useState(incomeToEdit?.frequency || 'once');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const frequencyOptions = ['once', 'weekly', 'biweekly', 'monthly', 'yearly'];

  useEffect(() => {
    if (mode === 'edit' && incomeToEdit) {
      setSource(incomeToEdit.source);
      setAmount(incomeToEdit.amount);
      setDate(
        incomeToEdit.date
          ? new Date(incomeToEdit.date).toISOString().split('T')[0]
          : ''
      );
      setDescription(incomeToEdit.description);
      setFrequency(incomeToEdit.frequency);
    }
  }, [incomeToEdit, mode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      validateIncomeData({ source, amount });

      const incomeData = {
        source: source.trim(),
        amount: parseFloat(amount),
        date: date
          ? new Date(date).toISOString().split('T')[0]
          : new Date().toLocaleDateString('en-CA'),
        description: description.trim(),
        frequency,
      };

      if (mode === 'add') {
        const response = await addIncome(incomeData);
        onIncomeAdded(response.data);
        setMessage('Income added successfully!');
      } else if (mode === 'edit') {
        const response = await updateIncome(incomeToEdit._id, incomeData);
        onIncomeUpdated(response.data);
        setMessage('Income updated successfully!');
      }

      setSource('');
      setAmount('');
      setDate('');
      setDescription('');
      setFrequency('once');
    } catch (error) {
      setMessage(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="income-form">
      <h2>{mode === 'add' ? 'Add a New Income' : 'Edit Income'}</h2>
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
          {loading
            ? mode === 'add'
              ? 'Adding...'
              : 'Updating...'
            : mode === 'add'
              ? 'Add Income'
              : 'Update Income'}
        </button>
      </form>
      {message && <p className="message">{message}</p>}
    </div>
  );
};

IncomeForm.propTypes = {
  onIncomeAdded: PropTypes.func.isRequired,
  onIncomeUpdated: PropTypes.func,
  incomeToEdit: PropTypes.object,
  mode: PropTypes.oneOf(['add', 'edit']).isRequired,
};

IncomeForm.defaultProps = {
  onIncomeAdded: () => {},
  onIncomeUpdated: () => {},
  incomeToEdit: null,
};

export default IncomeForm;
