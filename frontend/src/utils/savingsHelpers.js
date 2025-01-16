import moment from 'moment-timezone';

/**
 * Validate the savings doc data object.
 */
export const validateSavingsData = ({
  title,
  targetAmount,
  currentAmount,
  deadline,
}) => {
  if (!title || typeof title !== 'string' || title.trim() === '') {
    const errorMsg =
      'Validation failed: Title is required and must be a non-empty string.';
    console.warn(errorMsg);
    throw new Error(errorMsg);
  }

  if (typeof targetAmount !== 'number' || targetAmount <= 0) {
    const errorMsg =
      'Validation failed: Target amount must be a positive number.';
    console.warn(errorMsg);
    throw new Error(errorMsg);
  }

  if (
    currentAmount != null &&
    (typeof currentAmount !== 'number' ||
      currentAmount < 0 ||
      currentAmount > targetAmount)
  ) {
    const errorMsg =
      'Validation failed: Current amount cannot exceed target and cannot be negative.';
    console.warn(errorMsg);
    throw new Error(errorMsg);
  }

  if (deadline) {
    const currentDate = moment().tz('America/Edmonton').startOf('day');
    const deadlineDate = moment(deadline).tz('America/Edmonton').startOf('day');
    if (!deadlineDate.isValid()) {
      const errorMsg = 'Validation failed: Deadline must be a valid date.';
      console.warn(errorMsg);
      throw new Error(errorMsg);
    }
    if (deadlineDate.isBefore(currentDate)) {
      const errorMsg = 'Validation failed: Deadline cannot be a past date.';
      console.warn(errorMsg);
      throw new Error(errorMsg);
    }
  }
};

/**
 * Format savings data by formatting dates and setting default current amount.
 */
export const formatSavingsData = (savingsGoals) => {
  return savingsGoals.map((goal) => {
    const formattedDeadline =
      goal.deadline && moment(goal.deadline).isValid()
        ? moment(goal.deadline).tz('America/Edmonton').format('YYYY-MM-DD')
        : null;

    return {
      ...goal,
      deadline: formattedDeadline,
      currentAmount: goal.currentAmount || 0,
    };
  });
};

/**
 * Filter savings goals based on a search query.
 */
export const filterSavingsGoals = (savingsGoals, query) => {
  if (!query) return savingsGoals;

  const keywords = query.toLowerCase().split(/\s+/);

  return savingsGoals.filter((goal) =>
    keywords.every((keyword) => {
      const parsedKeyword = Number(keyword);
      return (
        goal.title.toLowerCase().includes(keyword) ||
        (goal.description || '').toLowerCase().includes(keyword) ||
        (!isNaN(parsedKeyword) &&
          (goal.targetAmount === parsedKeyword ||
            goal.currentAmount === parsedKeyword)) ||
        (goal.deadline && goal.deadline.includes(keyword))
      );
    })
  );
};

/**
 * Compare two values based on the field type.
 */
const compareSavingsValues = (field, a, b) => {
  let valueA = a[field];
  let valueB = b[field];

  if (field === 'targetAmount' || field === 'currentAmount') {
    return valueA - valueB;
  } else if (field === 'deadline') {
    if (!valueA && !valueB) return 0;
    if (!valueA) return 1;
    if (!valueB) return -1;
    return moment(valueA).diff(moment(valueB));
  } else if (field === 'title' || field === 'description') {
    return String(valueA || '')
      .toLowerCase()
      .localeCompare(String(valueB || '').toLowerCase());
  }
  return 0;
};

/**
 * Sort an array of savings goals based on multiple fields and orders.
 */
export const sortSavingsGoalsByFields = (items, fields, orders = []) => {
  return [...items].sort((a, b) => {
    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];
      const order = orders[i] || 'asc';
      const comparison = compareSavingsValues(field, a, b);
      if (comparison !== 0) {
        return order === 'asc' ? comparison : -comparison;
      }
    }
    return 0;
  });
};
