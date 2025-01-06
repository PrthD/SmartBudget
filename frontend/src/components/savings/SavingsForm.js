import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  addSavingsGoal,
  updateSavingsGoals,
} from '../../services/savingsService';
import { validateSavingsData } from '../../utils/savingsHelpers';
import '../../styles/savings/SavingsForm.css';
import { FaDollarSign, FaCalendarAlt, FaPencilAlt } from 'react-icons/fa';
import moment from 'moment-timezone';

const TargetAmountInput = ({ value, onChange }) => (
  <div className="form-group input-icon amount">
    <label>Target Amount:</label>
    <div className={`input-container amount ${value ? 'input-has-value' : ''}`}>
      <input
        type="number"
        value={value}
        onChange={onChange}
        required
        min="0"
        step="0.01"
        placeholder="Enter target amount"
        className="styled-input amount-input"
      />
      <FaDollarSign className="icon amount-icon" />
    </div>
  </div>
);

const CurrentAmountInput = ({ value, onChange }) => (
  <div className="form-group input-icon amount">
    <label>Current Savings Amount:</label>
    <div className={`input-container amount ${value ? 'input-has-value' : ''}`}>
      <input
        type="number"
        value={value}
        onChange={onChange}
        min="0"
        step="0.01"
        placeholder="Enter current savings amount"
        className="styled-input amount-input"
      />
      <FaDollarSign className="icon amount-icon" />
    </div>
  </div>
);

const DateInput = ({ value, onChange }) => (
  <div className="form-group input-icon date">
    <label htmlFor="deadline-input">Deadline (Optional):</label>
    <div className={`input-container date ${value ? 'input-has-value' : ''}`}>
      <input
        type="date"
        id="deadline-input"
        value={value}
        onChange={onChange}
        className="styled-input date-input"
      />
      <button
        type="button"
        className="calendar-button"
        onClick={() => {
          document.getElementById('deadline-input').showPicker();
        }}
      >
        <FaCalendarAlt className="icon calendar-icon" />
      </button>
    </div>
  </div>
);

const DescriptionInput = ({ value, onChange }) => (
  <div className="form-group input-icon description">
    <label>Description:</label>
    <div
      className={`input-container description ${
        value ? 'input-has-value' : ''
      }`}
    >
      <textarea
        value={value}
        onChange={onChange}
        placeholder="Add a description"
        className="styled-textarea description-input"
      />
      <FaPencilAlt className="icon description-icon" />
    </div>
  </div>
);

const SavingsForm = ({
  onSavingsAdded = () => {},
  onSavingsUpdated = () => {},
  onValidationError = () => {},
  savingsToEdit = null,
  highlight = false,
  mode,
}) => {
  const formRef = useRef(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: savingsToEdit?.title || '',
    targetAmount: savingsToEdit?.targetAmount || '',
    currentAmount: savingsToEdit?.currentAmount || '',
    deadline: savingsToEdit?.deadline
      ? moment(savingsToEdit.deadline)
          .tz('America/Edmonton')
          .format('YYYY-MM-DD')
      : '',
    description: savingsToEdit?.description || '',
  });

  useEffect(() => {
    if (mode === 'edit' && savingsToEdit) {
      setFormData({
        title: savingsToEdit.title,
        targetAmount: savingsToEdit.targetAmount,
        currentAmount: savingsToEdit.currentAmount || '',
        deadline: savingsToEdit.deadline
          ? moment(savingsToEdit.deadline)
              .tz('America/Edmonton')
              .format('YYYY-MM-DD')
          : '',
        description: savingsToEdit.description,
      });
      setCurrentStep(2);
    }
  }, [savingsToEdit, mode]);

  useEffect(() => {
    if (highlight && formRef.current) {
      formRef.current.focus();
    }
  }, [highlight]);

  const handleInputChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      targetAmount: '',
      currentAmount: '',
      deadline: '',
      description: '',
    });
    setCurrentStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    try {
      const parsedTarget = parseFloat(formData.targetAmount);
      const parsedCurrent = parseFloat(formData.currentAmount) || 0;

      validateSavingsData({
        title: formData.title,
        targetAmount: parsedTarget,
        currentAmount: parsedCurrent,
        deadline: formData.deadline,
      });

      const savingsData = {
        ...formData,
        title: formData.title.trim(),
        targetAmount: parsedTarget,
        currentAmount: parsedCurrent,
        deadline: formData.deadline
          ? moment.tz(formData.deadline, 'America/Edmonton').utc().toDate()
          : null,
        description: formData.description.trim(),
      };

      if (mode === 'add') {
        const newGoal = await addSavingsGoal(savingsData);
        onSavingsAdded(newGoal);
      } else if (mode === 'edit') {
        const updatedGoal = await updateSavingsGoals(
          savingsToEdit._id,
          savingsData
        );
        onSavingsUpdated(updatedGoal);
      }

      resetForm();
    } catch (error) {
      onSavingsAdded(null, error.message);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = (e) => {
    e.preventDefault();
    try {
      if (currentStep === 1) {
        if (!formData.title.trim()) {
          throw new Error('Please enter a title for the savings goal.');
        }
        setCurrentStep(2);
      } else if (currentStep === 2) {
        const tVal = parseFloat(formData.targetAmount);
        const cVal = parseFloat(formData.currentAmount || '0');

        if (isNaN(tVal) || tVal <= 0) {
          throw new Error('Please enter a valid target amount greater than 0.');
        }
        if (isNaN(cVal) || cVal < 0 || cVal > tVal) {
          throw new Error(
            'Current amount must be between 0 and the target amount.'
          );
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
    <div className={`savings-form ${highlight ? 'highlight' : ''}`}>
      <h2>{mode === 'add' ? 'Add New Savings Goal' : 'Edit Savings Goal'}</h2>

      <form onSubmit={handleSubmit}>
        <div ref={formRef} className="collapsible-section">
          {/** Step 1: Title */}
          {currentStep === 1 && (
            <>
              <h3>Enter Goal Title</h3>
              <div className="form-group">
                <label>Goal Title:</label>
                <div className="input-container goal-title">
                  <input
                    type="text"
                    value={formData.title}
                    onChange={handleInputChange('title')}
                    required
                    placeholder="e.g., Emergency Fund"
                    className="styled-input goal-title-input"
                  />
                </div>
              </div>
            </>
          )}

          {/** Step 2: Amounts */}
          {currentStep === 2 && (
            <>
              <h3>Enter Target & Current Amount</h3>
              <TargetAmountInput
                value={formData.targetAmount}
                onChange={handleInputChange('targetAmount')}
              />
              <CurrentAmountInput
                value={formData.currentAmount}
                onChange={handleInputChange('currentAmount')}
              />
            </>
          )}

          {/** Step 3: Deadline & Description */}
          {currentStep === 3 && (
            <>
              <h3>Optional Deadline & Description</h3>
              <DescriptionInput
                value={formData.description}
                onChange={handleInputChange('description')}
              />
              <DateInput
                value={formData.deadline}
                onChange={handleInputChange('deadline')}
              />
            </>
          )}
        </div>

        {/** Navigation Buttons */}
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
            <button type="submit" disabled={loading} className="submit-button">
              {loading
                ? mode === 'add'
                  ? 'Adding...'
                  : 'Updating...'
                : mode === 'add'
                  ? 'Add Goal'
                  : 'Update Goal'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

TargetAmountInput.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onChange: PropTypes.func.isRequired,
};

CurrentAmountInput.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onChange: PropTypes.func.isRequired,
};

DateInput.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

DescriptionInput.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

SavingsForm.propTypes = {
  onSavingsAdded: PropTypes.func.isRequired,
  onSavingsUpdated: PropTypes.func,
  onValidationError: PropTypes.func.isRequired,
  savingsToEdit: PropTypes.object,
  mode: PropTypes.oneOf(['add', 'edit']).isRequired,
  highlight: PropTypes.bool,
};

export default SavingsForm;
