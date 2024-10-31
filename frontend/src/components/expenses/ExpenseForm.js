import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { addExpense, updateExpense } from '../../services/expenseService';
import { validateExpenseData } from '../../utils/expenseHelpers';
import '../../styles/ExpenseForm.css';

const ExpenseForm = ({
  onExpenseAdded,
  expenseToEdit,
  onExpenseUpdated,
  mode,
}) => {
  const [category, setCategory] = useState(expenseToEdit?.category || '');
  const [customCategoryName, setCustomCategoryName] = useState(
    expenseToEdit?.customCategoryName || ''
  );
  const [amount, setAmount] = useState(expenseToEdit?.amount || '');
  const [date, setDate] = useState(expenseToEdit?.date || '');
  const [description, setDescription] = useState(
    expenseToEdit?.description || ''
  );
  const [frequency, setFrequency] = useState(
    expenseToEdit?.frequency || 'once'
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const predefinedCategories = [
    'Groceries',
    'Transportation',
    'Entertainment',
    'Utilities',
  ];
  const frequencyOptions = ['once', 'weekly', 'biweekly', 'monthly', 'yearly'];

  useEffect(() => {
    if (mode === 'edit' && expenseToEdit) {
      // Populate fields if in edit mode
      setCategory(
        expenseToEdit.customCategory ? 'custom' : expenseToEdit.category
      );
      setCustomCategoryName(
        expenseToEdit.customCategory ? expenseToEdit.category : ''
      );
      setAmount(expenseToEdit.amount);
      setDate(
        expenseToEdit.date
          ? new Date(expenseToEdit.date).toISOString().split('T')[0]
          : ''
      );
      setDescription(expenseToEdit.description);
      setFrequency(expenseToEdit.frequency);
    }
  }, [expenseToEdit, mode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const finalCategory =
        category === 'custom' ? customCategoryName.trim() : category;
      validateExpenseData({ category: finalCategory, amount });

      const expenseData = {
        category: finalCategory,
        customCategory: category === 'custom',
        amount: parseFloat(amount),
        date: date
          ? new Date(date).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        description: description.trim(),
        frequency,
      };

      if (mode === 'add') {
        const response = await addExpense(expenseData);
        onExpenseAdded(response.data);
        setMessage('Expense added successfully!');
      } else if (mode === 'edit') {
        const response = await updateExpense(expenseToEdit._id, expenseData);
        onExpenseUpdated(response.data);
        setMessage('Expense updated successfully!');
      }

      setCategory('');
      setCustomCategoryName('');
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
    <div className="expense-form">
      <h2>{mode === 'add' ? 'Add a New Expense' : 'Edit Expense'}</h2>
      <form onSubmit={handleSubmit}>
        {/* Category Input */}
        <div className="form-group">
          <label htmlFor="category">Category:</label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          >
            <option value="">Select a Category</option>
            {predefinedCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
            <option value="custom">Custom Category</option>
          </select>
        </div>

        {/* Custom Category Input (Visible only if "Custom Category" is selected) */}
        {category === 'custom' && (
          <div className="form-group">
            <label htmlFor="customCategoryName">Custom Category Name:</label>
            <input
              type="text"
              id="customCategoryName"
              value={customCategoryName}
              onChange={(e) => setCustomCategoryName(e.target.value)}
              required
              placeholder="Enter custom category name"
            />
          </div>
        )}

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
              ? 'Add Expense'
              : 'Update Expense'}
        </button>
      </form>
      {message && <p className="message">{message}</p>}
    </div>
  );
};

ExpenseForm.propTypes = {
  onExpenseAdded: PropTypes.func.isRequired,
  onExpenseUpdated: PropTypes.func,
  expenseToEdit: PropTypes.object,
  mode: PropTypes.oneOf(['add', 'edit']).isRequired,
};

ExpenseForm.defaultProps = {
  onExpenseAdded: () => {},
  onExpenseUpdated: () => {},
  expenseToEdit: null,
};

export default ExpenseForm;
