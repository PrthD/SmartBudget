import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/users';

/**
 * Register (signup) a new user.
 * @param {string} name
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Object>} The newly created user plus token.
 */
export const registerUser = async (name, email, password) => {
  const response = await axios.post(`${API_BASE_URL}/register`, {
    name,
    email,
    password,
  });
  const data = response.data;
  saveTokenToLocalStorage(data.token);
  return data;
};

/**
 * Login with email & password.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Object>} The user plus token.
 */
export const loginUser = async (email, password) => {
  const response = await axios.post(`${API_BASE_URL}/login`, {
    email,
    password,
  });
  const data = response.data;
  saveTokenToLocalStorage(data.token);
  return data;
};

/**
 * Logout: remove token from localStorage.
 */
export const logoutUser = () => {
  localStorage.removeItem('jwtToken');
};

/**
 * Save JWT token in localStorage.
 */
const saveTokenToLocalStorage = (token) => {
  localStorage.setItem('jwtToken', token);
};

/**
 * Retrieve token from localStorage.
 */
export const getToken = () => {
  return localStorage.getItem('jwtToken') || null;
};
