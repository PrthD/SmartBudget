import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000', // The backend URL
});

export const fetchExpenses = async () => {
  try {
    const response = await API.get('/expenses');
    return response.data;
  } catch (error) {
    console.error('Error fetching expenses:', error);
  }
};
