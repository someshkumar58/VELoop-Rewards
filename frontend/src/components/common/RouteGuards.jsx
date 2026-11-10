import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isDevPreview } = useAuth();
  const location = useLocation();

  if (!isAuthenticated && !isDevPreview) {
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }

  return children;
};

export const AdminProtectedRoute = ({ children }) => {
  const { isAdminAuthenticated, isDevPreview } = useAuth();
  const location = useLocation();

  // In production, admin authentication is strictly required.
  // In dev preview mode, we require the admin to log in via `/admin/login` (with demo credentials readily provided).
  if (!isAdminAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
};
