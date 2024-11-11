import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/income';

// Fetch all incomes
export const fetchIncomes = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/all`);
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.error || 'Failed to fetch incomes';
    throw new Error(errorMsg);
  }
};

// Add a new income
export const addIncome = async (incomeData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/new`, incomeData);
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.error || 'Failed to add income';
    throw new Error(errorMsg);
  }
};

// Update an existing income by ID
export const updateIncome = async (id, updatedData) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/update/${id}`,
      updatedData
    );
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.error || 'Failed to update income';
    throw new Error(errorMsg);
  }
};

// Delete an income by ID, including its recurrences
export const deleteIncome = async (id) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/delete/${id}`);
    return response.data;
  } catch (error) {
    const errorMsg =
      error.response?.data?.error ||
      'Failed to delete income and its recurrences';
    throw new Error(errorMsg);
  }
};
