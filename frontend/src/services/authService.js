import axios from 'axios';

/**
 * Stores the JWT access token in local storage.
 *
 * @param {string} token - The JWT access token.
 * @returns {void}
 */
export function setToken(token) {
  if (token) {
    localStorage.setItem('jwtToken', token);
  } else {
    localStorage.removeItem('jwtToken');
  }
}

/**
 * Retrieves the JWT access token from local storage.
 *
 * @returns {string|null} The stored JWT access token or null if none exists.
 */
export function getToken() {
  return localStorage.getItem('jwtToken') || null;
}

/**
 * Refreshes the access token using the stored refresh token.
 *
 * This function sends a POST request to the refresh endpoint. On success,
 * it updates local storage with the new access and refresh tokens.
 *
 * @returns {Promise<string|null>} The new access token if successful, or null if the refresh fails.
 */
export async function refreshAccessToken() {
  const storedRefreshToken = localStorage.getItem('refreshToken');
  if (!storedRefreshToken) return null;
  try {
    const API_BASE_URL =
      process.env.REACT_APP_API_URL || 'http://localhost:5000';
    const response = await axios.post(`${API_BASE_URL}/api/users/refresh`, {
      refreshToken: storedRefreshToken,
    });
    const { token, refreshToken: newRefreshToken } = response.data;
    setToken(token);
    localStorage.setItem('refreshToken', newRefreshToken);
    return token;
  } catch (error) {
    setToken(null);
    localStorage.removeItem('refreshToken');
    return null;
  }
}
