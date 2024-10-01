import React, { useState } from 'react';
import axios from 'axios';

import '../styles/ExpenseForm.css';

const ExpenseForm = () => {
  // State to manage form input values
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Predefined categories (can be replaced with API categories or custom ones)
  const predefinedCategories = [
    'Groceries',
    'Transportation',
    'Entertainment',
    'Utilities',
  ];

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation
    if (!category || !amount || amount <= 0) {
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
        category,
        amount: parseFloat(amount),
        date: date || new Date().toISOString(),
        description,
      });

      // Clear form and show success message
      setCategory('');
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

export default ExpenseForm;
