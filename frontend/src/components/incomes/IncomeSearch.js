import React, { useState } from 'react';
import PropTypes from 'prop-types';
import '../../styles/incomes/IncomeSearch.css';
import { FaSearch, FaTimes } from 'react-icons/fa';

const IncomeSearch = ({ onSearch }) => {
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
    <div className="income-search">
      <input
        type="text"
        placeholder="Search incomes..."
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

IncomeSearch.propTypes = {
  onSearch: PropTypes.func.isRequired,
};

export default IncomeSearch;
