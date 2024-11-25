import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FaSortAmountDown, FaSortAmountUp } from 'react-icons/fa';
import '../../styles/ExpenseSort.css';

const ExpenseSort = ({ onSortChange }) => {
  const [sortField, setSortField] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  const handleSortFieldChange = (field) => {
    setSortField(field);
    onSortChange(field, sortOrder);
  };

  const handleSortOrderToggle = () => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newOrder);
    onSortChange(sortField, newOrder);
  };

  return (
    <div className="expense-sort">
      <div className="sort-field">
        <label>Sort by:</label>
        <select
          value={sortField}
          onChange={(e) => handleSortFieldChange(e.target.value)}
        >
          <option value="date">Date</option>
          <option value="amount">Amount</option>
          <option value="category">Category</option>
        </select>
      </div>
      <div className="sort-actions">
        <button className="sort-order-btn" onClick={handleSortOrderToggle}>
          {sortOrder === 'asc' ? (
            <FaSortAmountUp className="sort-icon" />
          ) : (
            <FaSortAmountDown className="sort-icon" />
          )}
        </button>
      </div>
    </div>
  );
};

ExpenseSort.propTypes = {
  onSortChange: PropTypes.func.isRequired,
};

export default ExpenseSort;
