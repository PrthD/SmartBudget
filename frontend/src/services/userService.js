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
 * Fetch the logged-in user's details.
 * @returns {Promise<Object>} User details including `isFirstTimeLogin`.
 */
export const fetchUserDetails = async () => {
  try {
    const token = getToken();
    const response = await axios.get(`${API_BASE_URL}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error(
      'Error fetching user details:',
      error.response?.data || error.message
    );
    throw new Error(
      error.response?.data?.error || 'Failed to fetch user details'
    );
  }
};

/**
 * Update the user's `isFirstTimeLogin` field to false.
 * @returns {Promise<void>}
 * @description
 * This is typically called right after showing the first-time greeting popup,
 * so that reloading the page or navigating does not trigger the greeting again.
 */
export const updateFirstTimeLogin = async () => {
  const token = getToken();
  await axios.patch(
    `${API_BASE_URL}/me`,
    { isFirstTimeLogin: false },
    { headers: { Authorization: `Bearer ${token}` } }
  );
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
