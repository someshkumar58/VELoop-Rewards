import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create configured Axios instance
const apiClient = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to attach JWT auth tokens
apiClient.interceptors.request.use(
  (config) => {
    // Check for user or admin token
    const token = localStorage.getItem('veloop_auth_token') || localStorage.getItem('veloop_admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for centralized error formatting
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Format error message cleanly
    const formattedError = {
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message || 'An unexpected network error occurred.',
      details: error.response?.data?.errors || null,
      isNetworkError: !error.response,
    };

    // If 401 Unauthorized, notify or clear session if needed
    if (error.response?.status === 401) {
      // Do not auto-redirect in API client directly, let AuthContext handle token invalidation
      console.warn('[API Client] Unauthorized request (401)');
    }

    return Promise.reject(formattedError);
  }
);

export default apiClient;
