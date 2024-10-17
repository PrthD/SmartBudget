import React, { useState } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';

import '../styles/ExpenseForm.css';

const ExpenseForm = ({ onExpenseAdded }) => {
  // State to manage form input values
  const [category, setCategory] = useState('');
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Predefined categories
  const predefinedCategories = [
    'Groceries',
    'Transportation',
    'Entertainment',
    'Utilities',
  ];

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Determine which category to send to the backend
    const finalCategory = category === 'custom' ? customCategoryName : category;

    // Client-side validation
    if (!finalCategory || !amount || amount <= 0) {
      setError(
        'Please fill in all required fields and ensure the amount is greater than zero.'
      );
      setSuccess('');
      return;
    }

    try {
      // Send the data to the backend API
      // const response = await axios.post('http://localhost:5000/api/expenses', {
      await axios.post('http://localhost:5000/api/expenses', {
        category: finalCategory,
        amount: parseFloat(amount),
        date: date || new Date().toISOString(),
        description,
      });

      // Trigger data re-fetch via the passed prop
      onExpenseAdded();

      // Clear form and show success message
      setCategory('');
      setCustomCategoryName('');
      setAmount('');
      setDate('');
      setDescription('');
      setError('');
      setSuccess('Expense added successfully!');
    } catch (err) {
      setError('Failed to add expense. Please try again.');
      setSuccess('');
    }
  };

  return (
    <div className="expense-form">
      <h2>Add a New Expense</h2>
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
            placeholder="Add a description (optional)"
          />
        </div>

        {/* Submit Button */}
        <button type="submit">Add Expense</button>
      </form>

      {/* Error Message */}
      {error && <p className="error-message">{error}</p>}

      {/* Success Message */}
      {success && <p className="success-message">{success}</p>}
    </div>
  );
};

ExpenseForm.propTypes = {
  onExpenseAdded: PropTypes.func.isRequired,
};

export default ExpenseForm;
