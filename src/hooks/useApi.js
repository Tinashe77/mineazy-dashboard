// src/hooks/useApi.js - Custom hooks for API integration
import { useState, useEffect, useCallback, useRef } from 'react';
import api, { APIError } from '../services/api';
import { useError } from '../contexts/ErrorContext';

// Generic API hook for any endpoint
export const useApi = (apiCall, dependencies = [], options = {}) => {
  const {
    immediate = true,
    errorContext = 'api',
    onSuccess,
    onError,
    transform
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const { handleApiError } = useError();
  const mountedRef = useRef(true);

  const execute = useCallback(async (...args) => {
    if (!mountedRef.current) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await apiCall(...args);
      
      if (!mountedRef.current) return;
      
      const processedData = transform ? transform(response) : response;
      setData(processedData);
      
      if (onSuccess) {
        onSuccess(processedData);
      }
      
      return processedData;
    } catch (err) {
      if (!mountedRef.current) return;
      
      setError(err);
      handleApiError(err, errorContext);
      
      if (onError) {
        onError(err);
      }
      
      throw err;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [apiCall, transform, onSuccess, onError, handleApiError, errorContext]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, dependencies);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    refetch: execute
  };
};

// Hook for paginated data
export const usePaginatedApi = (apiCall, initialParams = {}, options = {}) => {
  const {
    pageSize = 20,
    errorContext = 'pagination'
  } = options;

  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalItems: 0,
    hasNext: false,
    hasPrev: false
  });
  const [loading, setLoading] = useState(false);
  const [params, setParams] = useState({ limit: pageSize, ...initialParams });
  const { handleApiError } = useError();

  const fetchData = useCallback(async (newParams = {}) => {
    setLoading(true);
    
    try {
      const requestParams = { ...params, ...newParams };
      const response = await apiCall(requestParams);
      
      setData(response.data || response);
      setPagination({
        page: response.page || 1,
        totalPages: response.totalPages || 1,
        totalItems: response.total || response.totalItems || 0,
        hasNext: response.hasNext || false,
        hasPrev: response.hasPrev || false
      });
    } catch (error) {
      handleApiError(error, errorContext);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [apiCall, params, handleApiError, errorContext]);

  const goToPage = useCallback((page) => {
    fetchData({ page });
  }, [fetchData]);

  const nextPage = useCallback(() => {
    if (pagination.hasNext) {
      goToPage(pagination.page + 1);
    }
  }, [pagination.hasNext, pagination.page, goToPage]);

  const prevPage = useCallback(() => {
    if (pagination.hasPrev) {
      goToPage(pagination.page - 1);
    }
  }, [pagination.hasPrev, pagination.page, goToPage]);

  const updateParams = useCallback((newParams) => {
    const updatedParams = { ...params, ...newParams, page: 1 };
    setParams(updatedParams);
    fetchData(updatedParams);
  }, [params, fetchData]);

  useEffect(() => {
    fetchData();
  }, []);

  return {
    data,
    loading,
    pagination,
    params,
    fetchData,
    goToPage,
    nextPage,
    prevPage,
    updateParams,
    refetch: () => fetchData(params)
  };
};

// Hook for CRUD operations
export const useCrud = (resource, options = {}) => {
  const { errorContext = resource } = options;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const { handleApiError } = useError();

  const apiMethods = {
    products: {
      getAll: api.getProducts,
      getById: api.getProductById,
      create: api.createProduct,
      update: api.updateProduct,
      delete: api.deleteProduct
    },
    users: {
      getAll: api.getUsers,
      getById: api.getUserById,
      create: api.createUser,
      update: api.updateUser,
      delete: api.deleteUser
    },
    orders: {
      getAll: api.getOrders,
      getById: api.getOrderById,
      create: api.createOrder,
      update: api.updateOrderStatus,
      delete: () => Promise.reject(new Error('Orders cannot be deleted'))
    },
    branches: {
      getAll: api.getBranches,
      getById: api.getBranchById,
      create: api.createBranch,
      update: api.updateBranch,
      delete: () => Promise.reject(new Error('Use API directly for branch deletion'))
    },
    categories: {
      getAll: api.getCategories,
      getById: api.getCategoryById,
      create: api.createCategory,
      update: api.updateCategory,
      delete: api.deleteCategory
    }
  };

  const methods = apiMethods[resource];
  if (!methods) {
    throw new Error(`Unsupported resource: ${resource}`);
  }

  const fetchAll = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const response = await methods.getAll(params);
      const data = response.data || response;
      setItems(Array.isArray(data) ? data : []);
      return data;
    } catch (error) {
      handleApiError(error, errorContext);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [methods.getAll, handleApiError, errorContext]);

  const getById = useCallback(async (id) => {
    try {
      const response = await methods.getById(id);
      return response.data || response;
    } catch (error) {
      handleApiError(error, errorContext);
      throw error;
    }
  }, [methods.getById, handleApiError, errorContext]);

  const create = useCallback(async (data) => {
    try {
      const response = await methods.create(data);
      const newItem = response.data || response;
      setItems(prev => [newItem, ...prev]);
      return newItem;
    } catch (error) {
      handleApiError(error, errorContext);
      throw error;
    }
  }, [methods.create, handleApiError, errorContext]);

  const update = useCallback(async (id, data) => {
    try {
      const response = await methods.update(id, data);
      const updatedItem = response.data || response;
      setItems(prev => 
        prev.map(item => 
          (item.id || item._id) === id ? updatedItem : item
        )
      );
      return updatedItem;
    } catch (error) {
      handleApiError(error, errorContext);
      throw error;
    }
  }, [methods.update, handleApiError, errorContext]);

  const remove = useCallback(async (id) => {
    try {
      await methods.delete(id);
      setItems(prev => 
        prev.filter(item => (item.id || item._id) !== id)
      );
    } catch (error) {
      handleApiError(error, errorContext);
      throw error;
    }
  }, [methods.delete, handleApiError, errorContext]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    items,
    loading,
    fetchAll,
    getById,
    create,
    update,
    remove,
    refetch: fetchAll
  };
};

// Hook for real-time data with polling
export const usePolling = (apiCall, interval = 30000, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef();
  const { handleApiError } = useError();

  const fetchData = useCallback(async () => {
    try {
      const response = await apiCall();
      setData(response);
      setError(null);
    } catch (err) {
      setError(err);
      handleApiError(err, 'polling');
    } finally {
      setLoading(false);
    }
  }, [apiCall, handleApiError]);

  const startPolling = useCallback(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, interval);
  }, [fetchData, interval]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    startPolling();
    return stopPolling;
  }, dependencies);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    startPolling,
    stopPolling
  };
};

// Hook for form submission with API
export const useFormSubmit = (submitFn, options = {}) => {
  const {
    onSuccess,
    onError,
    resetOnSuccess = false,
    errorContext = 'form'
  } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { handleApiError } = useError();

  const submit = useCallback(async (data, ...args) => {
    setLoading(true);
    setError(null);

    try {
      const response = await submitFn(data, ...args);
      
      if (onSuccess) {
        onSuccess(response);
      }
      
      return response;
    } catch (err) {
      setError(err);
      handleApiError(err, errorContext);
      
      if (onError) {
        onError(err);
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [submitFn, onSuccess, onError, handleApiError, errorContext]);

  return {
    submit,
    loading,
    error,
    clearError: () => setError(null)
  };
};

// Specific hooks for common use cases
export const useProducts = (params = {}) => {
  return usePaginatedApi(api.getProducts, params, {
    errorContext: 'products'
  });
};

export const useOrders = (params = {}) => {
  return usePaginatedApi(api.getOrders, params, {
    errorContext: 'orders'
  });
};

export const useUsers = (params = {}) => {
  return usePaginatedApi(api.getUsers, params, {
    errorContext: 'users'
  });
};

export const useBranches = () => {
  return useApi(api.getBranches, [], {
    errorContext: 'branches'
  });
};

export const useDashboardStats = () => {
  return usePolling(async () => {
    const [products, orders, branches] = await Promise.all([
      api.getProducts({ limit: 1000 }),
      api.getOrders({ limit: 1000 }),
      api.getBranches()
    ]);

    return {
      totalProducts: (products.data || products).length,
      totalOrders: (orders.data || orders).length,
      totalBranches: (branches.data || branches).length,
      totalRevenue: (orders.data || orders).reduce((sum, order) => 
        sum + (order.total || order.totalAmount || 0), 0
      )
    };
  }, 60000, []);
};

// Hook for authentication state
export const useAuthApi = () => {
  const { handleApiError } = useError();

  const login = useCallback(async (email, password) => {
    try {
      return await api.login(email, password);
    } catch (error) {
      handleApiError(error, 'auth');
      throw error;
    }
  }, [handleApiError]);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  const getProfile = useCallback(async () => {
    try {
      return await api.getProfile();
    } catch (error) {
      handleApiError(error, 'auth');
      throw error;
    }
  }, [handleApiError]);

  return {
    login,
    logout,
    getProfile,
    isAuthenticated: api.isAuthenticated()
  };
};