/**
 * Store the JWT token in localStorage.
 * @param {string} token - The JWT to store.
 */
export function setToken(token) {
  if (token) {
    localStorage.setItem('jwtToken', token);
  } else {
    localStorage.removeItem('jwtToken');
  }
}

/**
 * Retrieve the JWT token from localStorage.
 * @returns {string|null} The token if exists, else null.
 */
export function getToken() {
  return localStorage.getItem('jwtToken') || null;
}
