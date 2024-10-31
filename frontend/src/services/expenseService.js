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

// Delete an expense by ID
export const deleteExpense = async (id) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/delete/${id}`);
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.error || 'Failed to delete expense';
    throw new Error(errorMsg);
  }
};
