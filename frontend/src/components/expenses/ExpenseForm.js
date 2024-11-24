import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { addExpense, updateExpense } from '../../services/expenseService';
import { validateExpenseData } from '../../utils/expenseHelpers';
import {
  FaShoppingCart,
  FaBus,
  FaFilm,
  FaBolt,
  FaPlusCircle,
  FaDollarSign,
  FaCalendarAlt,
  FaPencilAlt,
  FaRedoAlt,
} from 'react-icons/fa';
import '../../styles/ExpenseForm.css';
import moment from 'moment-timezone';

// Input Component for Amount
const AmountInput = ({ value, onChange, placeholder = 'Enter amount' }) => (
  <div className="form-group input-icon amount">
    <label>Amount:</label>
    <div className={`input-container amount ${value ? 'input-has-value' : ''}`}>
      <input
        type="number"
        value={value}
        onChange={onChange}
        required
        min="0"
        step="0.01"
        placeholder={placeholder}
        className="styled-input amount-input"
      />
      <FaDollarSign className="icon amount-icon" />
    </div>
  </div>
);

// Input Component for Date
const DateInput = ({ value, onChange }) => (
  <div className="form-group input-icon date">
    <label htmlFor="date-input">Date:</label>
    <div className={`input-container date ${value ? 'input-has-value' : ''}`}>
      <input
        type="date"
        id="date-input"
        value={value}
        onChange={onChange}
        required
        className="styled-input date-input"
      />
      <button
        type="button"
        className="calendar-button"
        onClick={() => {
          document.getElementById('date-input').showPicker();
        }}
      >
        <FaCalendarAlt className="icon calendar-icon" />
      </button>
    </div>
  </div>
);

// Input Component for Description
const DescriptionInput = ({
  value,
  onChange,
  placeholder = 'Add a description',
}) => (
  <div className="form-group input-icon description">
    <label>Description:</label>
    <div
      className={`input-container description ${value ? 'input-has-value' : ''}`}
    >
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="styled-textarea description-input"
      />
      <FaPencilAlt className="icon description-icon" />
    </div>
  </div>
);

// Frequency Select Component
const FrequencySelect = ({ value, onChange, options }) => (
  <div className="form-group input-icon frequency">
    <label>Frequency:</label>
    <div className="input-container input-has-value frequency">
      <select
        value={value}
        onChange={onChange}
        className="styled-select frequency-select"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option.charAt(0).toUpperCase() + option.slice(1)}
          </option>
        ))}
      </select>
      <FaRedoAlt className="icon frequency-icon" />
    </div>
  </div>
);

const ExpenseForm = ({
  onExpenseAdded = () => {},
  onExpenseUpdated = () => {},
  expenseToEdit = null,
  highlight = false,
  mode,
}) => {
  const formRef = useRef(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const [formData, setFormData] = useState({
    category: expenseToEdit?.category || '',
    customCategoryName: expenseToEdit?.customCategoryName || '',
    amount: expenseToEdit?.amount || '',
    date: expenseToEdit?.date
      ? moment(expenseToEdit.date).tz('America/Edmonton').format('YYYY-MM-DD')
      : new Date().toLocaleDateString('en-CA'),
    description: expenseToEdit?.description || '',
    frequency: expenseToEdit?.frequency || 'once',
    originalExpenseId: expenseToEdit?.originalExpenseId || '',
  });

  const predefinedCategories = [
    { name: 'Groceries', icon: <FaShoppingCart /> },
    { name: 'Transportation', icon: <FaBus /> },
    { name: 'Entertainment', icon: <FaFilm /> },
    { name: 'Utilities', icon: <FaBolt /> },
  ];
  const frequencyOptions = ['once', 'weekly', 'biweekly', 'monthly', 'yearly'];

  useEffect(() => {
    if (mode === 'edit' && expenseToEdit) {
      setFormData({
        category: expenseToEdit.customCategory
          ? 'custom'
          : expenseToEdit.category,
        customCategoryName: expenseToEdit.customCategory
          ? expenseToEdit.category
          : '',
        amount: expenseToEdit.amount,
        date: expenseToEdit.date
          ? moment(expenseToEdit.date)
              .tz('America/Edmonton')
              .format('YYYY-MM-DD')
          : '',
        description: expenseToEdit.description,
        frequency: expenseToEdit.frequency,
        originalExpenseId: expenseToEdit.originalExpenseId || '',
      });
      setCurrentStep(2);
    }
  }, [expenseToEdit, mode]);

  useEffect(() => {
    if (highlight && formRef.current) {
      formRef.current.focus();
    }
  }, [highlight]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('');
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleInputChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (currentStep !== 3 && mode !== 'edit') {
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const finalCategory =
        formData.category === 'custom'
          ? formData.customCategoryName.trim()
          : formData.category;
      validateExpenseData({ category: finalCategory, amount: formData.amount });

      const expenseData = {
        ...formData,
        category: finalCategory,
        customCategory: formData.category === 'custom',
        amount: parseFloat(formData.amount),
        date: formData.date
          ? moment.tz(formData.date, 'America/Edmonton').utc().toDate()
          : new Date(),
        description: formData.description.trim(),
        frequency: formData.frequency,
        isOriginal: true,
      };

      if (mode === 'add') {
        const newExpense = await addExpense(expenseData);
        onExpenseAdded(newExpense);
        setMessage('Expense added successfully!');
        setIsError(false);
      } else if (mode === 'edit') {
        const updatedExpense = await updateExpense(
          expenseToEdit._id,
          expenseData
        );
        onExpenseUpdated(updatedExpense);
        setMessage('Expense updated successfully!');
        setIsError(false);
      }

      resetForm();
    } catch (error) {
      console.error('Error adding/updating expense:', error);
      setMessage(error.message || 'An error occurred');
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      category: '',
      customCategoryName: '',
      amount: '',
      date: new Date().toLocaleDateString('en-CA'),
      description: '',
      frequency: 'once',
      originalExpenseId: '',
    });
    setCurrentStep(1);
  };

  const nextStep = () => {
    try {
      if (currentStep === 1) {
        if (
          formData.category === 'custom' &&
          !formData.customCategoryName.trim()
        ) {
          throw new Error('Please enter a custom category name.');
        } else if (!formData.category && mode !== 'edit') {
          throw new Error('Please select a category.');
        }
        setCurrentStep(2);
      } else if (currentStep === 2) {
        if (!formData.amount || formData.amount <= 0) {
          throw new Error('Please enter a valid amount greater than 0.');
        }
        setCurrentStep(3);
      }
    } catch (error) {
      setMessage(error.message);
      setIsError(true);
    }
  };

  const previousStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  return (
    <div className={`expense-form ${highlight ? 'highlight' : ''}`}>
      <h2>{mode === 'add' ? 'Add a New Expense' : 'Edit Expense'}</h2>

      {message && (
        <p className={`message ${isError ? 'error' : 'success'}`}>{message}</p>
      )}

      <form onSubmit={handleSubmit}>
        <div ref={formRef} className="collapsible-section">
          {currentStep === 1 && (
            <>
              <h3>Choose a Category</h3>
              <div className="form-group">
                <label>Category:</label>
                <div className="category-picker">
                  {predefinedCategories.map((cat) => (
                    <div
                      key={cat.name}
                      className={`category-card ${formData.category === cat.name ? 'selected' : ''}`}
                      onClick={() =>
                        setFormData({ ...formData, category: cat.name })
                      }
                    >
                      {cat.icon}
                      <span>{cat.name}</span>
                    </div>
                  ))}
                  <div
                    className={`category-card ${formData.category === 'custom' ? 'selected' : ''}`}
                    onClick={() =>
                      setFormData({ ...formData, category: 'custom' })
                    }
                  >
                    <FaPlusCircle />
                    <span>Custom</span>
                  </div>
                </div>
              </div>
              {formData.category === 'custom' && (
                <div className="form-group input-icon custom-category">
                  <label>Custom Category Name:</label>
                  <div className="input-container custom-category">
                    <input
                      type="text"
                      value={formData.customCategoryName}
                      onChange={handleInputChange('customCategoryName')}
                      required
                      placeholder="Enter custom category name"
                      className="styled-input custom-category-input"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {currentStep === 2 && (
            <>
              <h3>Enter Amount and Date</h3>
              <AmountInput
                value={formData.amount}
                onChange={handleInputChange('amount')}
              />
              <DateInput
                value={formData.date}
                onChange={handleInputChange('date')}
              />
            </>
          )}

          {currentStep === 3 && (
            <>
              <h3>Enter Description and Frequency</h3>
              <DescriptionInput
                value={formData.description}
                onChange={handleInputChange('description')}
              />
              <FrequencySelect
                value={formData.frequency}
                onChange={handleInputChange('frequency')}
                options={frequencyOptions}
              />
            </>
          )}
        </div>

        <div className="form-navigation-buttons">
          {currentStep > 1 && (
            <button key="previous" type="button" onClick={previousStep}>
              Previous
            </button>
          )}
          {currentStep < 3 ? (
            <button
              key="next"
              type="button"
              onClick={nextStep}
              disabled={
                (currentStep === 1 && !formData.category) ||
                (currentStep === 2 && (!formData.amount || !formData.date))
              }
            >
              Next
            </button>
          ) : (
            <button
              key="submit"
              type="submit"
              disabled={loading}
              className="submit-button"
            >
              {loading
                ? mode === 'add'
                  ? 'Adding...'
                  : 'Updating...'
                : mode === 'add'
                  ? 'Add Expense'
                  : 'Update Expense'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

AmountInput.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  iconHovered: PropTypes.bool,
};

DateInput.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  iconHovered: PropTypes.bool,
};

DescriptionInput.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  iconHovered: PropTypes.bool,
};

FrequencySelect.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(PropTypes.string).isRequired,
  iconHovered: PropTypes.bool,
};

ExpenseForm.propTypes = {
  onExpenseAdded: PropTypes.func.isRequired,
  onExpenseUpdated: PropTypes.func,
  expenseToEdit: PropTypes.object,
  mode: PropTypes.oneOf(['add', 'edit']).isRequired,
  highlight: PropTypes.bool,
};

export default ExpenseForm;
