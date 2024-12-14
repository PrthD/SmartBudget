import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/expense';

// Fetch all expenses
export const fetchExpenses = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/all`);
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.error || 'Failed to fetch expenses';
    throw new Error(errorMsg);
  }
};

// Add a new expense
export const addExpense = async (expenseData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/new`, expenseData);
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.error || 'Failed to add expense';
    throw new Error(errorMsg);
  }
};

// Update an existing expense by ID
export const updateExpense = async (id, updatedData) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/update/${id}`,
      updatedData
    );
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.error || 'Failed to update expense';
    throw new Error(errorMsg);
  }
};

// Delete an expense by ID, including its recurrences
export const deleteExpense = async (id) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/delete/${id}`);
    return response.data;
  } catch (error) {
    const errorMsg =
      error.response?.data?.error ||
      'Failed to delete expense and its recurrences';
    throw new Error(errorMsg);
  }
};

// Skip the next recurrence of a recurring expense
export const skipNextRecurrence = async (id, dateToSkip) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/skip-next/${id}`, {
      dateToSkip,
    });
    return response.data;
  } catch (error) {
    const errorMsg =
      error.response?.data?.error || 'Failed to skip next recurrence';
    throw new Error(errorMsg);
  }
};

// Fetch budget information
export const fetchBudget = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/budget`);
    return response.data;
  } catch (error) {
    const errorMsg =
      error.response?.data?.error || 'Failed to fetch budget information.';
    throw new Error(errorMsg);
  }
};

// Update budget information
export const updateBudget = async (budgetData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/budget`, budgetData);
    return response.data;
  } catch (error) {
    const errorMsg =
      error.response?.data?.error || 'Failed to update budget information.';
    throw new Error(errorMsg);
  }
};
