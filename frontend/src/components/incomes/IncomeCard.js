import React from 'react';
import PropTypes from 'prop-types';
import { FaEdit, FaTrash, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { CSSTransition } from 'react-transition-group';
import '../../styles/incomes/IncomeCard.css';
import moment from 'moment-timezone';
import { confirmAction } from '../../utils/confirmationService';

const IncomeCard = ({
  income,
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
      'Are you sure you want to delete this income?',
      'This action cannot be undone.'
    );
    if (confirmed) {
      onDelete();
    }
  };

  return (
    <div className={`income-card ${expanded ? 'expanded' : ''}`}>
      <div className="income-card-header">
        <div className="income-source">
          <span className="source-name">{income.source}</span>
        </div>
        <div className="income-amount">${income.amount.toFixed(2)}</div>
        <div className="income-actions">
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
        <div className="income-card-details">
          {expanded && (
            <>
              <p>
                <strong>Date:</strong>{' '}
                {moment(income.date)
                  .tz('America/Edmonton')
                  .format('YYYY-MM-DD')}
              </p>
              <p>
                <strong>Description:</strong>{' '}
                {income.description || 'No description provided.'}
              </p>
              <p>
                <strong>Frequency:</strong>{' '}
                {income.frequency
                  ? income.frequency.charAt(0).toUpperCase() +
                    income.frequency.slice(1)
                  : 'N/A'}
              </p>

              {income.frequency !== 'once' && income.nextRecurrence && (
                <>
                  <p>
                    <strong>Next Recurrence On:</strong> {income.nextRecurrence}
                  </p>
                  <button
                    className="skip-next-btn"
                    onClick={() =>
                      onSkipNextRecurrence(income._id, income.nextRecurrence)
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

IncomeCard.propTypes = {
  income: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    source: PropTypes.string.isRequired,
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
    isOriginal: PropTypes.bool,
    originalIncomeId: PropTypes.string,
    nextRecurrence: PropTypes.string,
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onExpand: PropTypes.func.isRequired,
  expanded: PropTypes.bool.isRequired,
  onSkipNextRecurrence: PropTypes.func,
};

export default IncomeCard;
