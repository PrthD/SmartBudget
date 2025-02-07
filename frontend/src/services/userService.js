import axios from 'axios';

const API_BASE_URL = `${process.env.REACT_APP_API_URL}/api/users`;

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
  saveTokenToLocalStorage(data.token, data.refreshToken);
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
  saveTokenToLocalStorage(data.token, data.refreshToken);
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
 * Update the user's profile details
 *  - name, email, password, profilePhoto (base64 or empty), etc.
 * @param {Object} updates
 * @returns {Promise<Object>} Updated user object
 */
export const updateUserProfile = async (updates) => {
  const token = getToken();
  const response = await axios.patch(`${API_BASE_URL}/me`, updates, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data.user;
};

/**
 * Update the user's `isFirstTimeLogin` field to false.
 * @returns {Promise<void>}
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
const saveTokenToLocalStorage = (token, refreshToken) => {
  localStorage.setItem('jwtToken', token);
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken);
  }
};

/**
 * Retrieve token from localStorage.
 */
export const getToken = () => {
  return localStorage.getItem('jwtToken') || null;
};

/**
 * Utility to generate a stable default avatar (Base64 data URL).
 * The background color is derived from the user's name (stable hash).
 */
export const generateDefaultAvatar = (userName = '') => {
  const parts = userName.trim().split(' ');
  const initials = parts
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')
    .slice(0, 2);

  function stableColorFromString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const r = (hash & 0xff0000) >> 16;
    const g = (hash & 0x00ff00) >> 8;
    const b = hash & 0x0000ff;
    return `rgb(${r & 255},${g & 255},${b & 255})`;
  }

  const bgColor = stableColorFromString(userName || 'DefaultUser');

  const canvas = document.createElement('canvas');
  const size = 100;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 40px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initials, size / 2, size / 2);

  return canvas.toDataURL('image/png');
};
