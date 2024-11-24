import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { FaChevronDown } from 'react-icons/fa';
import '../../styles/CustomDropdown.css';

const CustomDropdown = ({ value, onChange, options, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleOptionClick = (option) => {
    onChange(option);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div
      className="custom-dropdown form-group input-icon frequency"
      ref={dropdownRef}
    >
      <label>{label}</label>
      <div
        className={`dropdown-toggle ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {value.charAt(0).toUpperCase() + value.slice(1)}
        <FaChevronDown className="dropdown-icon" />
      </div>
      {isOpen && (
        <div className="dropdown-menu">
          {options.map((option) => (
            <div
              key={option}
              className={`dropdown-item ${option === value ? 'selected' : ''}`}
              onClick={() => handleOptionClick(option)}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

CustomDropdown.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(PropTypes.string).isRequired,
  label: PropTypes.string,
};

export default CustomDropdown;
