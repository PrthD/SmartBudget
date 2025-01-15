import React from 'react';
import propTypes from 'prop-types';
import { Navigate } from 'react-router-dom';
import { getToken } from '../../services/userService';

const ProtectedRoute = ({ children }) => {
  const token = getToken();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

ProtectedRoute.propTypes = {
  children: propTypes.node.isRequired,
};

export default ProtectedRoute;
