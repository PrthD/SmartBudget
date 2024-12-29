import moment from 'moment-timezone';

// Frequency constants
export const FREQUENCY = {
  ONCE: 'once',
  WEEKLY: 'weekly',
  BIWEEKLY: 'biweekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
};

/**
 * Calculate the next date based on the provided frequency.
 * @param {moment.Moment} currentDate - The current date as a moment object.
 * @param {string} frequency - Frequency for the recurrence.
 * @returns {moment.Moment} The calculated next date as a moment object.
 */
export const getNextDate = (currentDate, frequency) => {
  switch (frequency) {
    case FREQUENCY.WEEKLY:
      return currentDate.clone().add(1, 'week');
    case FREQUENCY.BIWEEKLY:
      return currentDate.clone().add(2, 'weeks');
    case FREQUENCY.MONTHLY:
      return currentDate.clone().add(1, 'month');
    case FREQUENCY.YEARLY:
      return currentDate.clone().add(1, 'year');
    default:
      throw new Error(`Invalid frequency type provided: ${frequency}`);
  }
};

/**
 * Calculate the next recurrence date for a recurring expense, considering skipped dates
 * and ensuring that if the original date is in the future, we move to the recurrence *after* that date.
 * @param {Object} expense - The expense object.
 * @returns {Date|null} The next recurrence date or null if not applicable.
 */
export const calculateNextRecurrence = (expense) => {
  if (!expense.frequency || expense.frequency === FREQUENCY.ONCE) {
    return null;
  }

  let nextDate = moment(expense.date).tz('America/Edmonton').startOf('day');
  const today = moment().tz('America/Edmonton').startOf('day');
  const futureLimit = today.clone().add(5, 'years');

  if (nextDate.isSameOrAfter(today, 'day')) {
    nextDate = getNextDate(nextDate, expense.frequency);
  }

  const skippedDates = (expense.skippedDates || []).map((date) =>
    moment(date).tz('America/Edmonton').startOf('day').format('YYYY-MM-DD')
  );

  while (
    nextDate.isSameOrBefore(today) ||
    skippedDates.includes(nextDate.format('YYYY-MM-DD'))
  ) {
    nextDate = getNextDate(nextDate, expense.frequency);
    if (nextDate.isAfter(futureLimit)) {
      return null;
    }
  }

  return nextDate.toDate();
};
