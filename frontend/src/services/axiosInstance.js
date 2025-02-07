import axios from 'axios';
import { getToken, refreshAccessToken } from './authService';

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

/**
 * Request Interceptor: Attaches the JWT access token (if available) to each outgoing request.
 *
 * @param {object} config - The axios request configuration.
 * @returns {object} The modified request configuration including the Authorization header.
 */
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response Interceptor: Handles 401 errors by attempting to refresh the access token.
 *
 * If a 401 response is received and the request has not yet been retried,
 * this interceptor calls refreshAccessToken() to obtain a new token.
 * On success, it retries the original request with the new token.
 * If the refresh fails, it redirects the user to the login page.
 *
 * @param {object} response - The axios response object.
 * @returns {object|Promise} The axios response or a rejected promise if an error occurs.
 */
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      const newToken = await refreshAccessToken();
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(originalRequest);
      } else {
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
