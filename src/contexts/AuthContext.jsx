// src/contexts/AuthContext.jsx - Fixed version
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
        sessionId: action.payload.sessionId,
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
        loading: false, // Add this
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true, // Ensure this is set
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
    case 'INIT_AUTH':
      return {
        ...state,
        isAuthenticated: action.payload.isAuthenticated,
        user: action.payload.user,
        loading: false,
      };
    default:
      return state;
  }
};

const initialState = {
  isAuthenticated: false, // Start as false, will be set by init
  user: null,
  sessionId: null,
  loading: true, // Start with loading true
  error: null,
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      if (api.isAuthenticated()) {
        // If cookie exists, try to load profile
        const response = await api.getProfile();
        const userData = response.data?.user || response.user || response.data || response;
        
        dispatch({
          type: 'INIT_AUTH',
          payload: {
            isAuthenticated: true,
            user: userData,
          }
        });
      } else {
        // No cookie, user not authenticated
        dispatch({
          type: 'INIT_AUTH',
          payload: {
            isAuthenticated: false,
            user: null,
          }
        });
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      // If profile loading fails, clear auth state
      dispatch({
        type: 'INIT_AUTH',
        payload: {
          isAuthenticated: false,
          user: null,
        }
      });
    }
  };

  const login = async (email, password) => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      console.log('Starting login process...');
      const response = await api.login(email, password);
      console.log('Login response received:', response);
      
      const userData = response.data?.user || response.user;
      const sessionId = response.data?.sessionId || response.sessionId;
      
      if (!userData) {
        throw new Error('No user data received from login');
      }
      
      // Check if cookie was set
      console.log('Checking cookie after login:', {
        hasCookie: api.isAuthenticated(),
        cookieValue: api.getAuthToken()
      });
      
      // If no cookie was set, there might be a CORS issue
      if (!api.isAuthenticated()) {
        console.warn('No authentication cookie found after login. This might be a CORS issue.');
        // We'll still proceed with the login since we have the user data
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
      console.error('Login error:', error);
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
    
    if (state.user.role) return state.user.role;
    if (state.user.roles && Array.isArray(state.user.roles) && state.user.roles.length > 0) {
      if (typeof state.user.roles[0] === 'object' && state.user.roles[0].name) {
        return state.user.roles[0].name;
      }
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
    initializeAuth,
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