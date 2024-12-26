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
      throw new Error('Invalid frequency type provided.');
  }
};

/**
 * Calculate the next recurrence date for a recurring income, considering skipped dates.
 * @param {Object} income - The income object.
 * @returns {Date|null} The next recurrence date or null if not applicable.
 */
export const calculateNextRecurrence = (income) => {
  if (!income.frequency || income.frequency === 'once') {
    return null;
  }

  let nextDate = moment(income.date).tz('America/Edmonton').startOf('day');
  const today = moment().tz('America/Edmonton').startOf('day');
  const futureLimit = today.clone().add(5, 'years');

  const skippedDates = (income.skippedDates || []).map((date) =>
    moment(date).tz('America/Edmonton').startOf('day').format('YYYY-MM-DD')
  );

  while (
    nextDate.isSameOrBefore(today) ||
    skippedDates.includes(nextDate.format('YYYY-MM-DD'))
  ) {
    nextDate = getNextDate(nextDate, income.frequency);
    if (nextDate.isAfter(futureLimit)) {
      return null;
    }
  }

  return nextDate.toDate();
};
