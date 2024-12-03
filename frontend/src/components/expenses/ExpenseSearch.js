import React, { useState } from 'react';
import PropTypes from 'prop-types';
import '../../styles/expenses/ExpenseSearch.css';
import { FaSearch, FaTimes } from 'react-icons/fa';

const ExpenseSearch = ({ onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleInputChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch(query);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    onSearch('');
  };

  return (
    <div className="expense-search">
      <input
        type="text"
        placeholder="Search expenses..."
        value={searchQuery}
        onChange={handleInputChange}
        className="search-input"
      />
      {searchQuery ? (
        <FaTimes className="search-icon" onClick={handleClearSearch} />
      ) : (
        <FaSearch className="search-icon" />
      )}
    </div>
  );
};

ExpenseSearch.propTypes = {
  onSearch: PropTypes.func.isRequired,
};

export default ExpenseSearch;
