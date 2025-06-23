// src/components/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const role = localStorage.getItem('role');
  const pen = localStorage.getItem('pen');

  if (!role || !pen) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default ProtectedRoute;
