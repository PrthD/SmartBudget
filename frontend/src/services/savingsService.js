import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/savings';

// Fetch all savings goals
export const fetchSavingsGoals = async () => {
  try {
    const response = await axios.get(API_BASE_URL);
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch savings goals');
  }
};

// Add a new savings goal
export const addSavingsGoal = async (goalData) => {
  try {
    const response = await axios.post(API_BASE_URL, goalData);
    return response.data;
  } catch (error) {
    throw new Error('Failed to add savings goal');
  }
};

// Update an existing savings goal by ID
export const updateSavingsGoal = async (id, updatedData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/${id}`, updatedData);
    return response.data;
  } catch (error) {
    throw new Error('Failed to update savings goal');
  }
};

// Delete a savings goal by ID
export const deleteSavingsGoal = async (id) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    throw new Error('Failed to delete savings goal');
  }
};
