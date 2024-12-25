import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/budget';

/**
 * Fetch budget information (GET /api/budget).
 */
export const fetchBudget = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}`);
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
export const createBudget = async (categoryBudgets) => {
  try {
    const response = await axios.post(API_BASE_URL, categoryBudgets);
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
export const updateBudget = async (budgetId, categoryBudgets) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/${budgetId}`,
      categoryBudgets
    );
    return response.data;
  } catch (error) {
    const errorMsg =
      error.response?.data?.error || 'Failed to update budget information.';
    throw new Error(errorMsg);
  }
};
