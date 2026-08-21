import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import axios from 'axios';
import apiClient, { checkBackendHealth, clearCsrfTokenCache } from '../config/api';
import toast from 'react-hot-toast';
import { ROLES, PERMISSIONS, hasPermission as checkPermission, canAccessRoute, canAccessFeature } from '../utils/rbac';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => {
    try {
      const storedToken = localStorage.getItem('token');
      return storedToken;
    } catch (error) {
      // localStorage access error - critical for authentication
      return null;
    }
  });
  // Initialize loading to false if no token, true if token exists (needs verification)
  const [loading, setLoading] = useState(() => {
    const hasToken = !!token;
    return hasToken;
  });
  // Use ref to track mounted state for async operations
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    
    if (token) {
      // Only verify if we don't already have a user (to avoid unnecessary verification after login)
      // If user is already set, we trust it (it came from login response)
      if (!user) {
        verifyToken();
      } else {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    } else {
      // No token - set loading to false immediately
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
    
    return () => {
      isMountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user]);

  const verifyToken = async () => {
    if (!isMountedRef.current) return; // Early return if unmounted
    
    if (isMountedRef.current) {
      setLoading(true);
    }
    
    try {
      // Get token from localStorage (source of truth) not state
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        if (isMountedRef.current) {
          setToken(null);
          setUser(null);
          setLoading(false);
        }
        return;
      }
      
      const response = await apiClient.get('/auth/verify', {
        timeout: 10000 // 10 second timeout
      });
      
      // Check if component is still mounted before updating state
      if (!isMountedRef.current) return;
      
      if (response.data && response.data.valid && response.data.user) {
        setUser(response.data.user);
        // Ensure token in state matches localStorage
        if (storedToken !== token) {
          setToken(storedToken);
        }
      } else {
        // Invalid token - clear it with user feedback
        if (isMountedRef.current) {
          setToken(null);
          setUser(null);
          try {
            localStorage.removeItem('token');
          } catch (e) {
            // Error removing token - non-critical
          }
        }
      }
    } catch (error) {
      // Check if component is still mounted before updating state
      if (!isMountedRef.current) return;
      
      // Handle different error types appropriately
      if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || error.message?.includes('timeout')) {
        // Network/timeout errors - show user-friendly message
        toast.error('Unable to verify session. Please check your connection.');
      } else if (error.response && error.response.status !== 401) {
        // Server errors (except 401)
        toast.error('Session verification failed. Please log in again.');
      } else if (error.response?.status === 401) {
        // 401 - Token expired or invalid
      }
      
      if (isMountedRef.current) {
        setToken(null);
        setUser(null);
        try {
          localStorage.removeItem('token');
        } catch (e) {
          // Error removing token - non-critical
        }
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const login = async (email, password) => {
    try {
      // Check backend health before making login request
      const isHealthy = await checkBackendHealth();
      if (!isHealthy) {
        const isDevelopment = process.env.NODE_ENV === 'development';
        const errorMsg = isDevelopment
          ? 'Backend server is not responding. Please ensure the server is running.'
          : 'Unable to connect to the server. Please check your network connection or contact support.';
        toast.error(errorMsg);
        return false;
      }
      
      const response = await apiClient.post('/auth/login', { email, password });
      const { token: newToken, user: userData } = response.data;
      
      // CRITICAL: Store token in localStorage FIRST before setting state
      // This ensures the API client interceptor can read it immediately
      if (newToken) {
        try {
          localStorage.setItem('token', newToken);
        } catch (e) {
          toast.error('Failed to store authentication token');
          return false;
        }
      } else {
        toast.error('Login failed: No token received');
        return false;
      }
      
      // CRITICAL: Verify user data is present
      if (!userData) {
        toast.error('Login failed: No user data received');
        localStorage.removeItem('token');
        return false;
      }
      
      
      // Set user state FIRST, then token
      // This prevents verifyToken from running with stale data
      setUser(userData);
      setToken(newToken);
      
      // Clear CSRF token cache so a new one is fetched with user authentication
      // This ensures the CSRF token is generated with the user's ID
      clearCsrfTokenCache();
      
      toast.success('Login successful!');
      return true;
    } catch (error) {
      // Handle timeout errors
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        const isDevelopment = process.env.NODE_ENV === 'development';
        const errorMessage = isDevelopment
          ? 'Request timed out. The backend server may not be responding. Please ensure the server is running.'
          : 'Request timed out. Please check your network connection or try again later.';
        toast.error(errorMessage);
        return false;
      }
      
      // Handle 504 Gateway Timeout
      if (error.response?.status === 504 || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        const isDevelopment = process.env.NODE_ENV === 'development';
        const errorMessage = isDevelopment
          ? 'Backend server is not responding. Please ensure the server is running.'
          : 'Unable to connect to the server. Please check your network connection or contact support.';
        toast.error(errorMessage);
        return false;
      }
      
      // Handle network errors (server not running, CORS blocked, etc.)
      if (!error.response) {
        const errorMessage = error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')
          ? (process.env.NODE_ENV === 'development' 
              ? 'Cannot connect to server. Please ensure the server is running.'
              : 'Cannot connect to server. Please check your network connection or contact support.')
          : error.message || 'Network error occurred';
        toast.error(errorMessage);
      } else {
        // Server responded with an error
        toast.error(error.response?.data?.error || error.response?.data?.message || 'Login failed');
      }
      return false;
    }
  };

  const logout = (showToast = true) => {
    setToken(null);
    setUser(null);
    try {
      localStorage.removeItem('token');
      if (showToast) {
        toast.success('Logged out successfully');
      }
    } catch (error) {
      // Error removing token - non-critical
    }
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    if (!user.permissions || !Array.isArray(user.permissions)) return false;
    if (user.permissions.includes('all')) return true;
    return user.permissions.includes(permission);
  };

  // Role-based permission check
  const hasRolePermission = (permission) => {
    if (!user || !user.role) return false;
    return checkPermission(user.role, permission);
  };

  // Check if user can access a route
  const canAccess = (route) => {
    if (!user || !user.role) return false;
    return canAccessRoute(user.role, route);
  };

  // Check if user can access a feature
  const canAccessFeatureByRole = (feature) => {
    if (!user || !user.role) return false;
    return canAccessFeature(user.role, feature);
  };

  // Check if user has a specific role
  const hasRole = (role) => {
    return user?.role === role;
  };

  // Check if user is admin
  const isAdmin = () => {
    return user?.role === ROLES.ADMIN;
  };

  const value = {
    user,
    token,
    login,
    logout,
    hasPermission,
    hasRolePermission,
    canAccess,
    canAccessFeature: canAccessFeatureByRole,
    hasRole,
    isAdmin,
    loading
  };


  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};




