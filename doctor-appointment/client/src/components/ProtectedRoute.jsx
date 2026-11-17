import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children, allowedRole }) => {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    // If doctor attempts to access doctor route, send to doctor login; else general login
    if (allowedRole === 'doctor') {
      return <Navigate to="/doctor/login" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && role !== allowedRole) {
    // If role doesn't match, send to home page
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
