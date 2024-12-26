import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { addIncome, updateIncome } from '../../services/incomeService';
import { validateIncomeData } from '../../utils/incomeHelpers';
import {
  FaDollarSign,
  FaCalendarAlt,
  FaPencilAlt,
  FaRedoAlt,
} from 'react-icons/fa';
import '../../styles/incomes/IncomeForm.css';
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

const IncomeForm = ({
  onIncomeAdded = () => {},
  onIncomeUpdated = () => {},
  onValidationError = () => {},
  incomeToEdit = null,
  highlight = false,
  mode,
}) => {
  const formRef = useRef(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    source: incomeToEdit?.source || '',
    amount: incomeToEdit?.amount || '',
    date: incomeToEdit?.date
      ? moment(incomeToEdit.date).tz('America/Edmonton').format('YYYY-MM-DD')
      : new Date().toLocaleDateString('en-CA'),
    description: incomeToEdit?.description || '',
    frequency: incomeToEdit?.frequency || 'once',
  });

  const frequencyOptions = ['once', 'weekly', 'biweekly', 'monthly', 'yearly'];

  useEffect(() => {
    if (mode === 'edit' && incomeToEdit) {
      setFormData({
        source: incomeToEdit.source,
        amount: incomeToEdit.amount,
        date: incomeToEdit.date
          ? moment(incomeToEdit.date)
              .tz('America/Edmonton')
              .format('YYYY-MM-DD')
          : '',
        description: incomeToEdit.description,
        frequency: incomeToEdit.frequency,
      });
      setCurrentStep(2);
    }
  }, [incomeToEdit, mode]);

  useEffect(() => {
    if (highlight && formRef.current) {
      formRef.current.focus();
    }
  }, [highlight]);

  const handleInputChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (currentStep !== 3 && mode !== 'edit') {
      return;
    }

    setLoading(true);

    try {
      validateIncomeData({ source: formData.source, amount: formData.amount });

      const incomeData = {
        ...formData,
        amount: parseFloat(formData.amount),
        date: formData.date
          ? moment.tz(formData.date, 'America/Edmonton').utc().toDate()
          : new Date(),
        description: formData.description.trim(),
        frequency: formData.frequency,
      };

      if (mode === 'add') {
        const newIncome = await addIncome(incomeData);
        onIncomeAdded(newIncome);
      } else if (mode === 'edit') {
        const updatedIncome = await updateIncome(incomeToEdit._id, incomeData);
        onIncomeUpdated(updatedIncome);
      }

      resetForm();
    } catch (error) {
      onIncomeAdded(null, error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      source: '',
      amount: '',
      date: new Date().toLocaleDateString('en-CA'),
      description: '',
      frequency: 'once',
    });
    setCurrentStep(1);
  };

  const nextStep = () => {
    try {
      if (currentStep === 1) {
        if (!formData.source.trim()) {
          throw new Error('Please enter a valid source.');
        }
        setCurrentStep(2);
      } else if (currentStep === 2) {
        if (!formData.amount || formData.amount <= 0) {
          throw new Error('Please enter a valid amount greater than 0.');
        }
        if (!formData.date) {
          throw new Error('Please select a valid date.');
        }
        setCurrentStep(3);
      }
    } catch (error) {
      onValidationError(error.message);
    }
  };

  const previousStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  return (
    <div className={`income-form ${highlight ? 'highlight' : ''}`}>
      <h2>{mode === 'add' ? 'Add a New Income' : 'Edit Income'}</h2>

      <form onSubmit={handleSubmit}>
        <div ref={formRef} className="collapsible-section">
          {currentStep === 1 && (
            <>
              <h3>Enter Income Source</h3>
              <div className="form-group">
                <label htmlFor="source">Source:</label>
                <input
                  type="text"
                  id="source"
                  value={formData.source}
                  onChange={handleInputChange('source')}
                  placeholder="Enter income source"
                  required
                  className="styled-input source-input"
                />
              </div>
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
            <button type="button" onClick={previousStep}>
              Previous
            </button>
          )}
          {currentStep < 3 ? (
            <button type="button" onClick={nextStep}>
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
                  ? 'Add Income'
                  : 'Update Income'}
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

IncomeForm.propTypes = {
  onIncomeAdded: PropTypes.func.isRequired,
  onIncomeUpdated: PropTypes.func,
  onValidationError: PropTypes.func.isRequired,
  incomeToEdit: PropTypes.object,
  mode: PropTypes.oneOf(['add', 'edit']).isRequired,
  highlight: PropTypes.bool,
};

export default IncomeForm;
