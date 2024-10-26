import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/savings';

export const fetchSavingsGoals = async () => {
  try {
    const response = await axios.get(API_BASE_URL);
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch savings goals');
  }
};

export const addSavingsGoal = async (goalData) => {
  try {
    const response = await axios.post(API_BASE_URL, goalData);
    return response.data;
  } catch (error) {
    throw new Error('Failed to add savings goal');
  }
};
