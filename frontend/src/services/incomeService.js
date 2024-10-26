import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/income';

export const fetchIncomes = async () => {
  try {
    const response = await axios.get(API_BASE_URL);
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch incomes');
  }
};

export const addIncome = async (incomeData) => {
  try {
    const response = await axios.post(API_BASE_URL, incomeData);
    return response.data;
  } catch (error) {
    throw new Error('Failed to add income');
  }
};
