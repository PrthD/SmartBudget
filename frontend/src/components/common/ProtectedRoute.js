import React from 'react';
import propTypes from 'prop-types';
import { jwtDecode } from 'jwt-decode';
import { Navigate } from 'react-router-dom';
import { getToken } from '../../services/userService';
import { setToken } from '../../services/authService';

/**
 * This component wraps protected routes and ensures that the user is authenticated.
 * It decodes the stored access token and checks its expiration. If expired or missing,
 * the user is redirected to the login page.
 *
 * @param {object} props - Component props.
 * @param {React.ReactNode} props.children - The child components to render if authenticated.
 * @returns {JSX.Element} The protected component or a redirect to the login page.
 */
const ProtectedRoute = ({ children }) => {
  const token = getToken();
  if (token) {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    if (decoded.exp < currentTime) {
      setToken(null);
      return <Navigate to="/login" replace />;
    }
  }
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

ProtectedRoute.propTypes = {
  children: propTypes.node.isRequired,
};

export default ProtectedRoute;
