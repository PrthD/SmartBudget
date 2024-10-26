// Validate savings goal form data
export const validateSavingsData = ({ title, targetAmount }) => {
  if (!title || !targetAmount || targetAmount <= 0) {
    throw new Error(
      'Invalid savings data: title and target amount are required'
    );
  }
};
