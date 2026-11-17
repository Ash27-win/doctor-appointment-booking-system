/**
 * ============================================================================
 * ROUTE PROTECTION & RBAC GUARD (ProtectedRoute.jsx)
 * ============================================================================
 * 
 * VALIDATION INSTRUCTIONS:
 * 1. Authentication Check:
 *    - Redirects unauthenticated users to the respective login portal
 *      (e.g., /admin/login for admin, /doctor/login for doctors, /login for patients).
 * 2. Role Check:
 *    - Verifies user's active session role matches `allowedRole`.
 *    - Prevents privilege escalation (e.g. patients accessing admin/doctor pages).
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children, allowedRole }) => {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <LoadingSpinner message="Verifying session credentials..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    if (allowedRole === 'admin') {
      return <Navigate to="/admin/login" replace />;
    }
    if (allowedRole === 'doctor') {
      return <Navigate to="/doctor/login" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && role !== allowedRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
