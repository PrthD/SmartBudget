import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000',
});

export const fetchExpenses = async () => {
  try {
    const response = await API.get('/expense');
    return response.data;
  } catch (error) {
    console.error('Error fetching expenses:', error);
    throw error;
  }
};

export const fetchIncome = async () => {
  try {
    const response = await API.get('/income');
    return response.data;
  } catch (error) {
    console.error('Error fetching income:', error);
    throw error;
  }
};
