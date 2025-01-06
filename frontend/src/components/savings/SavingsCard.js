import React from 'react';
import PropTypes from 'prop-types';
import { FaEdit, FaTrash, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { CSSTransition } from 'react-transition-group';
import '../../styles/savings/SavingsCard.css';
import moment from 'moment-timezone';
import { confirmAction } from '../../utils/confirmationService';

const SavingsCard = ({ savings, onEdit, onDelete, onExpand, expanded }) => {
  const handleExpandClick = () => {
    onExpand();
  };

  const handleDeleteClick = async () => {
    const confirmed = await confirmAction(
      'Are you sure you want to delete this savings goal?',
      'This action cannot be undone.'
    );
    if (confirmed) {
      onDelete();
    }
  };

  return (
    <div className={`savings-card ${expanded ? 'expanded' : ''}`}>
      <div className="savings-card-header">
        <div className="savings-title">{savings.title}</div>
        <div className="savings-target-amount">
          Target: ${savings.targetAmount.toFixed(2)}
        </div>
        <div className="savings-actions">
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
        <div className="savings-card-details">
          {expanded && (
            <>
              <p>
                <strong>Current Amount:</strong> $
                {savings.currentAmount.toFixed(2)}
              </p>
              <p>
                <strong>Deadline:</strong>{' '}
                {savings.deadline
                  ? moment(savings.deadline)
                      .tz('America/Edmonton')
                      .format('YYYY-MM-DD')
                  : 'No deadline set.'}
              </p>
              <p>
                <strong>Description:</strong>{' '}
                {savings.description || 'No description provided.'}
              </p>
            </>
          )}
        </div>
      </CSSTransition>
    </div>
  );
};

SavingsCard.propTypes = {
  savings: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    targetAmount: PropTypes.number.isRequired,
    currentAmount: PropTypes.number.isRequired,
    deadline: PropTypes.string,
    description: PropTypes.string,
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onExpand: PropTypes.func.isRequired,
  expanded: PropTypes.bool.isRequired,
};

export default SavingsCard;
