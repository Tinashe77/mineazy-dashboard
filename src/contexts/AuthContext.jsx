// src/contexts/AuthContext.jsx
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
        token: action.payload.token,
        error: null,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
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
    default:
      return state;
  }
};

const initialState = {
  isAuthenticated: !!api.token,
  user: null,
  token: api.token,
  loading: false,
  error: null,
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load user profile on mount if token exists
  useEffect(() => {
    if (api.token && !state.user) {
      loadUserProfile();
    }
  }, []);

  const loadUserProfile = async () => {
    try {
      const response = await api.getProfile();
      dispatch({
        type: 'UPDATE_USER',
        payload: response.data,
      });
    } catch (error) {
      console.error('Failed to load user profile:', error);
      // If profile loading fails, logout
      logout();
    }
  };

  const login = async (email, password) => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      const response = await api.login(email, password);
      
      api.setToken(response.data.token);
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: response.data.user,
          token: response.data.token,
        },
      });
      
      return response;
    } catch (error) {
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: error.message,
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
      api.clearToken();
      dispatch({ type: 'LOGOUT' });
    }
  };

  const updateProfile = async (data) => {
    try {
      const response = await api.updateProfile(data);
      dispatch({
        type: 'UPDATE_USER',
        payload: response.data,
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

  const value = {
    ...state,
    login,
    logout,
    updateProfile,
    clearError,
    hasRole: (role) => state.user?.role === role,
    hasAnyRole: (roles) => roles.includes(state.user?.role),
    isAdmin: () => ['admin', 'super_admin'].includes(state.user?.role),
    isShopManager: () => state.user?.role === 'shop_manager',
    isCustomer: () => state.user?.role === 'customer',
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