import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/expense';

export const fetchExpenses = async () => {
  try {
    const response = await axios.get(API_BASE_URL);
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch expenses');
  }
};

export const addExpense = async (expenseData) => {
  try {
    const response = await axios.post(API_BASE_URL, expenseData);
    return response.data;
  } catch (error) {
    throw new Error('Failed to add expense');
  }
};
