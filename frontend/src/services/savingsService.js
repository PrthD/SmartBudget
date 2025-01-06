import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/savings';

/**
 * Fetch all savings docs (GET /api/savings).
 */
export const fetchSavingsGoals = async () => {
  try {
    const response = await axios.get(API_BASE_URL);
    return response.data;
  } catch (error) {
    const errorMsg =
      error.response?.data?.error || 'Failed to fetch savings goals.';
    throw new Error(errorMsg);
  }
};

/**
 * Add a new savings doc (POST /api/savings).
 */
export const addSavingsGoal = async (goalData) => {
  try {
    const response = await axios.post(API_BASE_URL, goalData);
    return response.data;
  } catch (error) {
    const errorMsg =
      error.response?.data?.error || 'Failed to add new savings goal.';
    throw new Error(errorMsg);
  }
};

/**
 * Update an existing savings doc by ID (PUT /api/savings/:id).
 */
export const updateSavingsGoals = async (id, updatedData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/${id}`, updatedData);
    return response.data;
  } catch (error) {
    const errorMsg =
      error.response?.data?.error || 'Failed to update savings goal.';
    throw new Error(errorMsg);
  }
};

/**
 * Delete a savings doc by ID (DELETE /api/savings/:id).
 */
export const deleteSavingsGoals = async (id) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    const errorMsg =
      error.response?.data?.error || 'Failed to delete savings goal.';
    throw new Error(errorMsg);
  }
};
