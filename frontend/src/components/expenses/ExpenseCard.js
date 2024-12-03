import React from 'react';
import PropTypes from 'prop-types';
import { FaEdit, FaTrash, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { CSSTransition } from 'react-transition-group';
import '../../styles/expenses/ExpenseCard.css';
import moment from 'moment-timezone';
import { confirmAction } from '../../utils/confirmationService';

const ExpenseCard = ({
  expense,
  onEdit,
  onDelete,
  onExpand,
  expanded,
  onSkipNextRecurrence,
}) => {
  const handleExpandClick = () => {
    onExpand();
  };

  const handleDeleteClick = async () => {
    const confirmed = await confirmAction(
      'Are you sure you want to delete this expense?',
      'This action cannot be undone.'
    );
    if (confirmed) {
      onDelete();
    }
  };

  return (
    <div className={`expense-card ${expanded ? 'expanded' : ''}`}>
      <div className="expense-card-header">
        <div className="expense-category">
          <span className="category-name">{expense.category}</span>
          {expense.customCategory && <span className="custom-tag">Custom</span>}
        </div>
        <div className="expense-amount">${expense.amount.toFixed(2)}</div>
        <div className="expense-actions">
          <button className="edit-btn" onClick={onEdit}>
            <FaEdit />
          </button>
          <button className="delete-btn" onClick={handleDeleteClick}>
            <FaTrash />
          </button>
          <button className="expand-btn" onClick={handleExpandClick}>
            {expanded ? <FaChevronUp /> : <FaChevronDown />}
          </button>
        </div>
      </div>
      <CSSTransition
        in={expanded}
        timeout={300}
        classNames="card-details-transition"
        unmountOnExit
      >
        <div className="expense-card-details">
          {expanded && (
            <>
              <p>
                <strong>Date:</strong>{' '}
                {moment(expense.date)
                  .tz('America/Edmonton')
                  .format('YYYY-MM-DD')}
              </p>
              <p>
                <strong>Description:</strong>{' '}
                {expense.description || 'No description provided.'}
              </p>
              <p>
                <strong>Frequency:</strong>{' '}
                {expense.frequency
                  ? expense.frequency.charAt(0).toUpperCase() +
                    expense.frequency.slice(1)
                  : 'N/A'}
              </p>

              {expense.frequency !== 'once' && expense.nextRecurrence && (
                <>
                  <p>
                    <strong>Next Recurrence On:</strong>{' '}
                    {expense.nextRecurrence}
                  </p>
                  <button
                    className="skip-next-btn"
                    onClick={() =>
                      onSkipNextRecurrence(expense._id, expense.nextRecurrence)
                    }
                  >
                    Skip Next Recurrence
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </CSSTransition>
    </div>
  );
};

ExpenseCard.propTypes = {
  expense: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    amount: PropTypes.number.isRequired,
    date: PropTypes.string.isRequired,
    description: PropTypes.string,
    frequency: PropTypes.oneOf([
      'once',
      'weekly',
      'biweekly',
      'monthly',
      'yearly',
    ]),
    customCategory: PropTypes.bool,
    isOriginal: PropTypes.bool,
    originalExpenseId: PropTypes.string,
    nextRecurrence: PropTypes.string,
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onExpand: PropTypes.func.isRequired,
  expanded: PropTypes.bool.isRequired,
  onSkipNextRecurrence: PropTypes.func,
};

export default ExpenseCard;
