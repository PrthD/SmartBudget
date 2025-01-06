import React, { useState } from 'react';
import PropTypes from 'prop-types';
import '../../styles/savings/SavingsSearch.css';
import { FaSearch, FaTimes } from 'react-icons/fa';

const SavingsSearch = ({ onSearch }) => {
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
    <div className="savings-search">
      <input
        type="text"
        placeholder="Search savings goals..."
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

SavingsSearch.propTypes = {
  onSearch: PropTypes.func.isRequired,
};

export default SavingsSearch;
