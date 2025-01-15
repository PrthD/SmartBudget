import axios from 'axios';
import { getToken } from './authService';

const API_BASE_URL = 'http://localhost:5000/api/income-goal';

const getAuthConfig = () => {
  const token = getToken();
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
  };
};

/**
 * Fetch the existing income goal (GET /api/income-goal).
 */
export const fetchIncomeGoal = async () => {
  try {
    const response = await axios.get(API_BASE_URL, getAuthConfig());
    return response.data;
  } catch (error) {
    const errorMsg =
      error.response?.data?.error || 'Failed to fetch income goal information.';
    throw new Error(errorMsg);
  }
};

/**
 * Create a new income goal (POST /api/income-goal).
 */
export const createIncomeGoal = async (sourceGoals, interval = 'monthly') => {
  try {
    const response = await axios.post(
      API_BASE_URL,
      {
        sourceGoals,
        interval,
      },
      getAuthConfig()
    );
    return response.data;
  } catch (error) {
    const errorMsg =
      error.response?.data?.error || 'Failed to create new income goal.';
    throw new Error(errorMsg);
  }
};

/**
 * Update an existing income goal (PUT /api/income-goal/:id).
 */
export const updateIncomeGoal = async (goalId, sourceGoals, interval) => {
  try {
    const payload = {};
    if (sourceGoals) payload.sourceGoals = sourceGoals;
    if (interval) payload.interval = interval;

    const response = await axios.put(
      `${API_BASE_URL}/${goalId}`,
      payload,
      getAuthConfig()
    );
    return response.data;
  } catch (error) {
    const errorMsg =
      error.response?.data?.error || 'Failed to update income goal.';
    throw new Error(errorMsg);
  }
};

/**
 * Permanently delete an income goal (DELETE /api/income-goal/:id).
 */
export const deleteIncomeGoal = async (goalId) => {
  try {
    const response = await axios.delete(
      `${API_BASE_URL}/${goalId}`,
      getAuthConfig()
    );
    return response.data;
  } catch (error) {
    const errorMsg =
      error.response?.data?.error || 'Failed to delete income goal.';
    throw new Error(errorMsg);
  }
};
