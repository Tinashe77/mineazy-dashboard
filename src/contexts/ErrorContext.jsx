// src/contexts/ErrorContext.jsx - Global error handling context
import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { APIError } from '../services/api';

const ErrorContext = createContext();

// Error types
const ERROR_TYPES = {
  API_ERROR: 'API_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

// Error reducer
const errorReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ERROR':
      return {
        ...state,
        errors: [
          ...state.errors.filter(error => error.id !== action.payload.id),
          action.payload
        ]
      };
    
    case 'REMOVE_ERROR':
      return {
        ...state,
        errors: state.errors.filter(error => error.id !== action.payload)
      };
    
    case 'CLEAR_ALL_ERRORS':
      return {
        ...state,
        errors: []
      };
    
    case 'CLEAR_ERRORS_BY_TYPE':
      return {
        ...state,
        errors: state.errors.filter(error => error.type !== action.payload)
      };
    
    default:
      return state;
  }
};

const initialState = {
  errors: []
};

export const ErrorProvider = ({ children }) => {
  const [state, dispatch] = useReducer(errorReducer, initialState);

  // Generate unique error ID
  const generateErrorId = useCallback(() => {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Classify error type
  const classifyError = useCallback((error) => {
    if (error instanceof APIError) {
      if (error.status === 401 || error.status === 403) {
        return ERROR_TYPES.AUTHORIZATION_ERROR;
      } else if (error.status === 404) {
        return ERROR_TYPES.NOT_FOUND_ERROR;
      } else if (error.status >= 500) {
        return ERROR_TYPES.SERVER_ERROR;
      } else if (error.status === 0) {
        return ERROR_TYPES.NETWORK_ERROR;
      } else {
        return ERROR_TYPES.API_ERROR;
      }
    }
    
    if (error.name === 'ValidationError') {
      return ERROR_TYPES.VALIDATION_ERROR;
    }
    
    if (error.message && error.message.includes('network')) {
      return ERROR_TYPES.NETWORK_ERROR;
    }
    
    return ERROR_TYPES.UNKNOWN_ERROR;
  }, []);

  // Get user-friendly error message
  const getUserFriendlyMessage = useCallback((error, type) => {
    switch (type) {
      case ERROR_TYPES.NETWORK_ERROR:
        return 'Network connection error. Please check your internet connection and try again.';
      
      case ERROR_TYPES.AUTHORIZATION_ERROR:
        return 'You are not authorized to perform this action. Please log in and try again.';
      
      case ERROR_TYPES.NOT_FOUND_ERROR:
        return 'The requested resource was not found.';
      
      case ERROR_TYPES.SERVER_ERROR:
        return 'Server error occurred. Please try again later or contact support if the issue persists.';
      
      case ERROR_TYPES.VALIDATION_ERROR:
        return error.message || 'Please check your input and try again.';
      
      case ERROR_TYPES.API_ERROR:
        return error.message || 'An error occurred while processing your request.';
      
      default:
        return error.message || 'An unexpected error occurred. Please try again.';
    }
  }, []);

  // Add error to state
  const addError = useCallback((error, options = {}) => {
    const {
      context = 'general',
      persistent = false,
      autoRemove = true,
      autoRemoveDelay = 5000
    } = options;

    const errorType = classifyError(error);
    const errorId = generateErrorId();
    
    const errorObj = {
      id: errorId,
      type: errorType,
      message: getUserFriendlyMessage(error, errorType),
      originalError: error,
      context,
      persistent,
      timestamp: new Date().toISOString()
    };

    dispatch({
      type: 'ADD_ERROR',
      payload: errorObj
    });

    // Auto-remove non-persistent errors
    if (!persistent && autoRemove) {
      setTimeout(() => {
        removeError(errorId);
      }, autoRemoveDelay);
    }

    return errorId;
  }, [classifyError, generateErrorId, getUserFriendlyMessage]);

  // Remove specific error
  const removeError = useCallback((errorId) => {
    dispatch({
      type: 'REMOVE_ERROR',
      payload: errorId
    });
  }, []);

  // Clear all errors
  const clearAllErrors = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL_ERRORS' });
  }, []);

  // Clear errors by type
  const clearErrorsByType = useCallback((errorType) => {
    dispatch({
      type: 'CLEAR_ERRORS_BY_TYPE',
      payload: errorType
    });
  }, []);

  // Clear errors by context
  const clearErrorsByContext = useCallback((context) => {
    const contextErrors = state.errors.filter(error => error.context === context);
    contextErrors.forEach(error => removeError(error.id));
  }, [state.errors, removeError]);

  // Handle API errors specifically
  const handleApiError = useCallback((error, context = 'api', options = {}) => {
    console.error(`API Error in ${context}:`, error);
    
    // Handle specific HTTP status codes
    if (error instanceof APIError) {
      switch (error.status) {
        case 401:
          // Handle unauthorized - might trigger logout
          addError(error, { context, persistent: true, ...options });
          // Could dispatch a logout action here if needed
          break;
        
        case 403:
          // Handle forbidden
          addError(error, { context, ...options });
          break;
        
        case 404:
          // Handle not found
          addError(error, { context, autoRemoveDelay: 3000, ...options });
          break;
        
        case 422:
          // Handle validation errors
          addError(error, { context, autoRemoveDelay: 7000, ...options });
          break;
        
        case 429:
          // Handle rate limiting
          addError(new Error('Too many requests. Please wait a moment and try again.'), {
            context,
            autoRemoveDelay: 10000,
            ...options
          });
          break;
        
        case 500:
        case 502:
        case 503:
        case 504:
          // Handle server errors
          addError(error, { context, persistent: true, ...options });
          break;
        
        default:
          addError(error, { context, ...options });
      }
    } else {
      addError(error, { context, ...options });
    }
  }, [addError]);

  // Get errors by context
  const getErrorsByContext = useCallback((context) => {
    return state.errors.filter(error => error.context === context);
  }, [state.errors]);

  // Get errors by type
  const getErrorsByType = useCallback((errorType) => {
    return state.errors.filter(error => error.type === errorType);
  }, [state.errors]);

  // Check if there are any errors
  const hasErrors = useCallback((context = null) => {
    if (context) {
      return state.errors.some(error => error.context === context);
    }
    return state.errors.length > 0;
  }, [state.errors]);

  // Create a wrapper for async operations with error handling
  const withErrorHandling = useCallback((asyncFn, context = 'operation', options = {}) => {
    return async (...args) => {
      try {
        clearErrorsByContext(context);
        return await asyncFn(...args);
      } catch (error) {
        handleApiError(error, context, options);
        throw error; // Re-throw so calling code can handle it if needed
      }
    };
  }, [clearErrorsByContext, handleApiError]);

  const value = {
    // State
    errors: state.errors,
    
    // Methods
    addError,
    removeError,
    clearAllErrors,
    clearErrorsByType,
    clearErrorsByContext,
    handleApiError,
    
    // Getters
    getErrorsByContext,
    getErrorsByType,
    hasErrors,
    
    // Utilities
    withErrorHandling,
    
    // Constants
    ERROR_TYPES
  };

  return (
    <ErrorContext.Provider value={value}>
      {children}
    </ErrorContext.Provider>
  );
};

export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
};

// HOC for automatic error handling in components
export const withErrorBoundary = (WrappedComponent, errorContext = 'component') => {
  return function ErrorBoundaryWrapper(props) {
    const { handleApiError } = useError();
    
    const handleError = useCallback((error) => {
      handleApiError(error, errorContext);
    }, [handleApiError]);

    return <WrappedComponent {...props} onError={handleError} />;
  };
};

// Error display component
export const ErrorDisplay = ({ context = null, className = '' }) => {
  const { errors, removeError } = useError();
  
  const displayErrors = context 
    ? errors.filter(error => error.context === context)
    : errors.filter(error => !error.persistent);

  if (displayErrors.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {displayErrors.map((error) => (
        <div
          key={error.id}
          className={`p-4 rounded-md border ${
            error.type === ERROR_TYPES.AUTHORIZATION_ERROR
              ? 'bg-red-50 text-red-700 border-red-200'
              : error.type === ERROR_TYPES.NETWORK_ERROR
              ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
              : error.type === ERROR_TYPES.VALIDATION_ERROR
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <p className="text-sm font-medium">
                {error.message}
              </p>
              {process.env.NODE_ENV === 'development' && error.originalError && (
                <p className="text-xs mt-1 opacity-70">
                  Debug: {error.originalError.message}
                </p>
              )}
            </div>
            <button
              onClick={() => removeError(error.id)}
              className="ml-4 text-current hover:opacity-70 focus:outline-none"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};