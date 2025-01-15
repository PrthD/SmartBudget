import axios from 'axios';
import { getToken } from './authService';

const API_BASE_URL = 'http://localhost:5000/api/budget';

const getAuthConfig = () => {
  const token = getToken();
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
  };
};

/**
 * Fetch budget information (GET /api/budget).
 */
export const fetchBudget = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}`, getAuthConfig());
    return response.data;
  } catch (error) {
    const errorMsg =
      error.response?.data?.error || 'Failed to fetch budget information.';
    throw new Error(errorMsg);
  }
};

/**
 * Create a new budget record (POST /api/budget).
 */
export const createBudget = async (categoryBudgets, interval = 'monthly') => {
  try {
    const response = await axios.post(
      API_BASE_URL,
      {
        categoryBudgets,
        interval,
      },
      getAuthConfig()
    );
    return response.data;
  } catch (error) {
    const errorMsg =
      error.response?.data?.error || 'Failed to create new budget.';
    throw new Error(errorMsg);
  }
};

/**
 * Update budget information (PUT /api/budget/:id).
 */
export const updateBudget = async (budgetId, categoryBudgets, interval) => {
  try {
    const payload = {};
    if (categoryBudgets) payload.categoryBudgets = categoryBudgets;
    if (interval) payload.interval = interval;

    const response = await axios.put(
      `${API_BASE_URL}/${budgetId}`,
      payload,
      getAuthConfig()
    );
    return response.data;
  } catch (error) {
    const errorMsg =
      error.response?.data?.error || 'Failed to update budget information.';
    throw new Error(errorMsg);
  }
};

/**
 * Permanently delete a budget record (DELETE /api/budget/:id).
 */
export const deleteBudget = async (budgetId) => {
  try {
    const response = await axios.delete(
      `${API_BASE_URL}/${budgetId}`,
      getAuthConfig()
    );
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.error || 'Failed to delete budget.';
    throw new Error(errorMsg);
  }
};
