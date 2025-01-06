import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FaSortAmountDown, FaSortAmountUp } from 'react-icons/fa';
import '../../styles/savings/SavingsSort.css';

const SavingsSort = ({ onSortChange }) => {
  const [sortField, setSortField] = useState('deadline');
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
    <div className="savings-sort">
      <div className="sort-field">
        <label>Sort by:</label>
        <select
          value={sortField}
          onChange={(e) => handleSortFieldChange(e.target.value)}
        >
          <option value="deadline">Deadline</option>
          <option value="targetAmount">Target Amount</option>
          <option value="currentAmount">Current Amount</option>
          <option value="title">Title</option>
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

SavingsSort.propTypes = {
  onSortChange: PropTypes.func.isRequired,
};

export default SavingsSort;
