// src/contexts/AuthContext.jsx - Fixed for cookie-based authentication
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        loading: true,
        error: null,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.payload.user,
        sessionId: action.payload.sessionId, // Store session ID from response
        error: null,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        sessionId: null,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        sessionId: null,
        error: null,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    default:
      return state;
  }
};

const initialState = {
  isAuthenticated: api.isAuthenticated(), // Check cookie on init
  user: null,
  sessionId: null,
  loading: false,
  error: null,
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load user profile on mount if authenticated
  useEffect(() => {
    if (api.isAuthenticated() && !state.user) {
      loadUserProfile();
    }
  }, []);

  const loadUserProfile = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await api.getProfile();
      
      // Handle the response structure from your API
      const userData = response.data?.user || response.user || response.data || response;
      
      dispatch({
        type: 'UPDATE_USER',
        payload: userData,
      });
      
      // If we successfully got user data, we're authenticated
      if (userData) {
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user: userData,
            sessionId: response.data?.sessionId || null
          }
        });
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
      // If profile loading fails, logout
      logout();
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const login = async (email, password) => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      const response = await api.login(email, password);
      
      // Handle your API's response structure
      const userData = response.data?.user || response.user;
      const sessionId = response.data?.sessionId || response.sessionId;
      
      if (!userData) {
        throw new Error('No user data received from login');
      }
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: userData,
          sessionId: sessionId,
        },
      });
      
      return response;
    } catch (error) {
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: error.message || 'Login failed',
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: 'LOGOUT' });
    }
  };

  const updateProfile = async (data) => {
    try {
      const response = await api.updateProfile(data);
      const userData = response.data?.user || response.user || response.data || response;
      
      dispatch({
        type: 'UPDATE_USER',
        payload: userData,
      });
      return response;
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Helper function to get user role
  const getUserRole = () => {
    if (!state.user) return null;
    
    // Handle different possible role structures
    if (state.user.role) return state.user.role;
    if (state.user.roles && Array.isArray(state.user.roles) && state.user.roles.length > 0) {
      // If roles is an array of objects with 'name' property
      if (typeof state.user.roles[0] === 'object' && state.user.roles[0].name) {
        return state.user.roles[0].name;
      }
      // If roles is an array of strings
      return state.user.roles[0];
    }
    return null;
  };

  const value = {
    ...state,
    login,
    logout,
    updateProfile,
    clearError,
    loadUserProfile,
    // Role-based helper functions
    hasRole: (role) => getUserRole() === role,
    hasAnyRole: (roles) => {
      const userRole = getUserRole();
      return userRole && roles.includes(userRole);
    },
    isAdmin: () => {
      const userRole = getUserRole();
      return ['admin', 'super_admin'].includes(userRole);
    },
    isShopManager: () => getUserRole() === 'shop_manager',
    isCustomer: () => getUserRole() === 'customer',
    isSuperAdmin: () => getUserRole() === 'super_admin',
    // Get the current user role
    userRole: getUserRole(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};