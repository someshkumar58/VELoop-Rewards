import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import { adminService } from '../services/adminService';
import { PREVIEW_USER } from '../constants/previewData';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Read initial Dev Preview setting (can be overridden in localStorage for testing)
  const [isDevPreview, setIsDevPreview] = useState(() => {
    const saved = localStorage.getItem('veloop_dev_preview');
    if (saved !== null) {
      return saved === 'true';
    }
    return import.meta.env.VITE_ENABLE_DEV_PREVIEW === 'true';
  });

  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('veloop_auth_token');
    const saved = localStorage.getItem('veloop_user_profile');
    if (token && saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    // In dev preview mode, initialize default preview user if not authenticated
    if (isDevPreview) {
      return PREVIEW_USER;
    }
    return saved ? JSON.parse(saved) : null;
  });

  const [admin, setAdmin] = useState(() => {
    const savedAdmin = localStorage.getItem('veloop_admin_profile');
    const token = localStorage.getItem('veloop_admin_token');
    if (token && savedAdmin) {
      try {
        return JSON.parse(savedAdmin);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(false);

  // Sync preview mode toggle to localStorage
  const toggleDevPreview = () => {
    setIsDevPreview((prev) => {
      const next = !prev;
      localStorage.setItem('veloop_dev_preview', String(next));
      if (next && !user) {
        setUser(PREVIEW_USER);
      }
      return next;
    });
  };

  const loginAdmin = async (email, password) => {
    setIsLoading(true);
    try {
      const response = await adminService.login(email, password);
      setAdmin(response.admin);
      return response;
    } finally {
      setIsLoading(false);
    }
  };

  const logoutAdmin = () => {
    localStorage.removeItem('veloop_admin_token');
    localStorage.removeItem('veloop_admin_profile');
    setAdmin(null);
  };

  const loginUser = (token, userProfile) => {
    localStorage.setItem('veloop_auth_token', token);
    if (userProfile) {
      localStorage.setItem('veloop_user_profile', JSON.stringify(userProfile));
      setUser(userProfile);
    }
  };

  const loginWithCredentials = async (email, password) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      if (response.data && response.data.token) {
        localStorage.setItem('veloop_auth_token', response.data.token);
        const userProfile = response.data.user;
        localStorage.setItem('veloop_user_profile', JSON.stringify(userProfile));
        setUser(userProfile);
      }
      return response.data;
    } finally {
      setIsLoading(false);
    }
  };

  const logoutUser = () => {
    localStorage.removeItem('veloop_auth_token');
    localStorage.removeItem('veloop_user_profile');
    setUser(null);
  };

  const updateUserProfile = (newProfileData) => {
    setUser((prev) => ({
      ...prev,
      ...newProfileData
    }));
    if (!isDevPreview) {
      localStorage.setItem('veloop_user_profile', JSON.stringify({ ...user, ...newProfileData }));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        admin,
        isAuthenticated: !!user,
        isAdminAuthenticated: !!admin,
        isLoading,
        isDevPreview,
        toggleDevPreview,
        loginAdmin,
        logoutAdmin,
        loginUser,
        loginWithCredentials,
        logoutUser,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
