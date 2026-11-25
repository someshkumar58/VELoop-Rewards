import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import { adminService } from '../services/adminService';
import { PREVIEW_USER } from '../constants/previewData';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const isProduction = import.meta.env.PROD || import.meta.env.MODE === 'production';

  // Read initial Dev Preview setting: default to true whenever no auth token is present in development
  const [isDevPreview, setIsDevPreview] = useState(() => {
    if (isProduction) {
      return false;
    }
    const token = typeof window !== 'undefined' ? localStorage.getItem('veloop_auth_token') : null;
    const saved = typeof window !== 'undefined' ? localStorage.getItem('veloop_dev_preview') : null;
    if (saved !== null) {
      return saved === 'true';
    }
    // In dev: If no real user token is present, initialize Dev Preview to true so visitor never sees 401 error
    if (!token) {
      return true;
    }
    return import.meta.env.VITE_ENABLE_DEV_PREVIEW === 'true';
  });

  const [user, setUser] = useState(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('veloop_auth_token') : null;
    const saved = typeof window !== 'undefined' ? localStorage.getItem('veloop_user_profile') : null;
    if (token && saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return isProduction ? null : PREVIEW_USER;
      }
    }
    // When unauthenticated, initialize with PREVIEW_USER in dev so profile renders seamlessly
    return isProduction ? null : PREVIEW_USER;
  });

  const [admin, setAdmin] = useState(() => {
    const savedAdmin = typeof window !== 'undefined' ? localStorage.getItem('veloop_admin_profile') : null;
    const token = typeof window !== 'undefined' ? localStorage.getItem('veloop_admin_token') : null;
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
    localStorage.setItem('veloop_dev_preview', 'false');
    setIsDevPreview(false);
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
        localStorage.setItem('veloop_dev_preview', 'false');
        setIsDevPreview(false);
        setUser(userProfile);
      }
      return response.data;
    } finally {
      setIsLoading(false);
    }
  };

  const registerWithCredentials = async (name, email, password, referralCode) => {
    setIsLoading(true);
    try {
      const payload = {
        name,
        fullName: name,
        email,
        password,
        ...(referralCode ? { referralCode, refCode: referralCode } : {})
      };
      const response = await apiClient.post('/auth/register', payload);
      if (response.data && response.data.token) {
        localStorage.setItem('veloop_auth_token', response.data.token);
        const userProfile = response.data.user;
        localStorage.setItem('veloop_user_profile', JSON.stringify(userProfile));
        localStorage.setItem('veloop_dev_preview', 'false');
        setIsDevPreview(false);
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
    localStorage.setItem('veloop_dev_preview', 'true');
    setIsDevPreview(true);
    setUser(PREVIEW_USER);
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

  const hasRealToken = typeof window !== 'undefined' && !!localStorage.getItem('veloop_auth_token');

  return (
    <AuthContext.Provider
      value={{
        user,
        admin,
        isAuthenticated: !!user,
        isRealUser: hasRealToken && !isDevPreview,
        hasRealToken,
        isAdminAuthenticated: !!admin,
        isLoading,
        isDevPreview,
        setIsDevPreview,
        toggleDevPreview,
        loginAdmin,
        logoutAdmin,
        loginUser,
        loginWithCredentials,
        registerWithCredentials,
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
