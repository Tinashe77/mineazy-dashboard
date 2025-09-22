// src/services/api.js - Pure cookie-based authentication as per your API docs
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

class APIError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.data = data;
  }
}

class MineazyAPI {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Check if authToken cookie exists (as per API documentation)
  isAuthenticated() {
    if (typeof document === 'undefined') return false;
    
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'authToken' && value && value !== 'undefined' && value !== 'null') {
        return true;
      }
    }
    return false;
  }

  // Get the authToken cookie value (as per API documentation)
  getAuthToken() {
    if (typeof document === 'undefined') return null;
    
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'authToken' && value && value !== 'undefined' && value !== 'null') {
        return value;
      }
    }
    return null;
  }

  // Clear auth cookie
  clearAuth() {
    if (typeof document === 'undefined') return;
    
    // Clear the authToken cookie as specified in API docs
    document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    let config = {
      credentials: 'include', // Still include for any cookies that might work
      headers: {
        ...options.headers,
      },
      ...options,
    };

    // Add Authorization header if we have a token
    const token = this.getAuthToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log(`Adding Bearer token to request: ${endpoint}`, token.substring(0, 20) + '...');
    }

    // Only set Content-Type for JSON requests, not FormData
    if (!(options.body instanceof FormData) && !config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }

    // Debug: Log request details
    console.log(`API Request: ${options.method || 'GET'} ${endpoint}`, {
      url,
      hasToken: !!token,
      hasAuthHeader: !!config.headers['Authorization'],
      credentials: config.credentials
    });

    try {
      const response = await fetch(url, config);
      
      // Debug: Log response details
      console.log(`API Response: ${response.status} for ${endpoint}`, {
        ok: response.ok,
        status: response.status
      });

      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else if (contentType && contentType.includes('text/')) {
        data = { message: await response.text() };
      } else {
        data = { message: 'No content' };
      }
      
      if (!response.ok) {
        if (response.status === 401) {
          console.warn('401 Unauthorized - clearing stored token');
          this.clearAuth();
        }
        
        const errorMessage = data.message || data.error || `HTTP error! status: ${response.status}`;
        throw new APIError(errorMessage, response.status, data);
      }
      
      return data;
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      
      console.error('API Request failed:', error);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new APIError('Network error. Please check your connection and CORS settings.', 0, null);
      }
      
      throw new APIError(error.message || 'An unexpected error occurred', 0, null);
    }
  }

  // Test if the API is accessible and CORS is working
  async testConnection() {
    try {
      const response = await this.request('/health');
      return { success: true, message: 'API connection successful', data: response };
    } catch (error) {
      return { 
        success: false, 
        message: `API connection failed: ${error.message}`,
        status: error.status 
      };
    }
  }

  // Authentication endpoints
  async login(email, password) {
    console.log('Attempting login...');
    
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    console.log('Login response received:', response);
    
    // Extract sessionId from response and use it as token
    const sessionId = response.sessionId || response.data?.sessionId;
    if (sessionId) {
      console.log('SessionId found, storing as auth token:', sessionId.substring(0, 20) + '...');
      // Store sessionId as our authentication token
      this.setAuthToken(sessionId);
    } else {
      console.warn('No sessionId found in login response');
    }
    
    // Check if cookie was set (for debugging)
    const cookieAfterLogin = this.isAuthenticated();
    console.log('Cookie set after login:', cookieAfterLogin);
    console.log('All cookies:', document.cookie);
    
    return response;
  }

  // Add token storage methods
  setAuthToken(token) {
    try {
      localStorage.setItem('mineazy_auth_token', token);
      console.log('Auth token stored in localStorage');
    } catch (error) {
      console.warn('Could not store token in localStorage:', error);
    }
  }

  // Override getAuthToken to check localStorage first
  getAuthToken() {
    // First check localStorage for our stored token
    try {
      const stored = localStorage.getItem('mineazy_auth_token');
      if (stored && stored !== 'null' && stored !== 'undefined') {
        return stored;
      }
    } catch (error) {
      console.warn('Could not access localStorage:', error);
    }

    // Fallback to cookie method
    if (typeof document === 'undefined') return null;
    
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'authToken' && value && value !== 'undefined' && value !== 'null') {
        return value;
      }
    }
    return null;
  }

  // Override isAuthenticated to check localStorage
  isAuthenticated() {
    return !!this.getAuthToken();
  }

  // Override clearAuth to clear localStorage
  clearAuth() {
    try {
      localStorage.removeItem('mineazy_auth_token');
    } catch (error) {
      console.warn('Could not clear localStorage:', error);
    }

    if (typeof document === 'undefined') return;
    
    // Still try to clear cookies
    document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = `authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;
    document.cookie = `authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      this.clearAuth();
    }
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  async updateProfile(data) {
    return this.request('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Products endpoints
  // Update the getProducts method in src/services/api.js

async getProducts(params = {}) {
  console.log('getProducts called with params:', params);
  
  // Clean up parameters - remove empty values and null/undefined
  const cleanParams = {};
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      // Handle boolean conversion for isActive
      if (key === 'isActive') {
        cleanParams[key] = value;
      }
      // Handle numeric conversion for prices and pagination
      else if (['minPrice', 'maxPrice', 'page', 'limit'].includes(key)) {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
          cleanParams[key] = numValue;
        }
      }
      // Handle string parameters
      else if (typeof value === 'string' && value.trim() !== '') {
        cleanParams[key] = value.trim();
      }
      // Handle other types as-is
      else {
        cleanParams[key] = value;
      }
    }
  });
  
  console.log('Cleaned params for API:', cleanParams);
  
  const queryString = new URLSearchParams();
  
  // Build query string properly
  Object.entries(cleanParams).forEach(([key, value]) => {
    queryString.append(key, value.toString());
  });
  
  const queryStringText = queryString.toString();
  const endpoint = queryStringText ? `/products?${queryStringText}` : '/products';
  
  console.log('Final API endpoint:', endpoint);
  
  try {
    const response = await this.request(endpoint);
    console.log('getProducts response:', response);
    return response;
  } catch (error) {
    console.error('getProducts error:', error);
    throw error;
  }
}

  async getProductById(id) {
    if (!id) throw new APIError('Product ID is required', 400, null);
    return this.request(`/products/${id}`);
  }

  async getProductBySku(sku) {
    if (!sku) throw new APIError('Product SKU is required', 400, null);
    return this.request(`/products/sku/${sku}`);
  }

  async createProduct(formData) {
    if (!formData) throw new APIError('Product data is required', 400, null);
    return this.request('/products', {
      method: 'POST',
      body: formData,
    });
  }

async updateProduct(id, data) {
  if (!id) throw new APIError('Product ID is required', 400, null);
  
  console.log('Updating product with ID:', id);
  console.log('Update data type:', typeof data);
  console.log('Update data:', data);
  
  let requestConfig = {
    method: 'PUT',
  };

  // If data is FormData (has images), use it directly
  if (data instanceof FormData) {
    console.log('Using FormData for update (with images)');
    requestConfig.body = data;
    // Don't set Content-Type, let browser set it for FormData
  } else {
    console.log('Using JSON for update (no images)');
    // For regular updates without images, send as JSON
    requestConfig.headers = {
      'Content-Type': 'application/json'
    };
    requestConfig.body = JSON.stringify(data);
  }
  
  return this.request(`/products/${id}`, requestConfig);
}

  async deleteProduct(id) {
    if (!id) throw new APIError('Product ID is required', 400, null);
    return this.request(`/products/${id}`, { method: 'DELETE' });
  }

  // Orders endpoints
  async getOrders(params = {}) {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== '' && value != null)
    );
    
    const queryString = new URLSearchParams(cleanParams).toString();
    const endpoint = queryString ? `/orders?${queryString}` : '/orders';
    
    return this.request(endpoint);
  }

  async getOrderById(id) {
    if (!id) throw new APIError('Order ID is required', 400, null);
    return this.request(`/orders/${id}`);
  }

  async createOrder(data) {
    if (!data || !data.items || data.items.length === 0) {
      throw new APIError('Order must contain at least one item', 400, null);
    }
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateOrderStatus(id, status, notes = '') {
    if (!id || !status) {
      throw new APIError('Order ID and status are required', 400, null);
    }
    return this.request(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
  }

  // Branches endpoints
  async getBranches() {
    return this.request('/branches');
  }

  async getBranchById(id) {
    if (!id) throw new APIError('Branch ID is required', 400, null);
    return this.request(`/branches/${id}`);
  }

  async createBranch(data) {
    if (!data || !data.name) {
      throw new APIError('Branch name is required', 400, null);
    }
    return this.request('/branches', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBranch(id, data) {
    if (!id) throw new APIError('Branch ID is required', 400, null);
    return this.request(`/branches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteBranch(id) {
    if (!id) throw new APIError('Branch ID is required', 400, null);
    return this.request(`/branches/${id}`, { method: 'DELETE' });
  }

  // Users endpoints
  async getUsers(params = {}) {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== '' && value != null)
    );
    
    const queryString = new URLSearchParams(cleanParams).toString();
    const endpoint = queryString ? `/admin/users?${queryString}` : '/admin/users';
    
    return this.request(endpoint);
  }

  async getUserById(id) {
    if (!id) throw new APIError('User ID is required', 400, null);
    return this.request(`/admin/users/${id}`);
  }

  async createUser(data) {
    if (!data || !data.email || !data.name) {
      throw new APIError('User email and name are required', 400, null);
    }
    return this.request('/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(id, data) {
    if (!id) throw new APIError('User ID is required', 400, null);
    return this.request(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id) {
    if (!id) throw new APIError('User ID is required', 400, null);
    return this.request(`/admin/users/${id}`, { method: 'DELETE' });
  }

  // Health check
  async getHealthCheck() {
    return this.request('/health');
  }

  async getApiInfo() {
    return this.request('/info');
  }
// Add these methods to src/services/api.js

// Categories endpoints
async getCategories(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const endpoint = queryString ? `/categories?${queryString}` : '/categories';
  return this.request(endpoint);
}

async getCategoryById(id) {
  if (!id) throw new APIError('Category ID is required', 400, null);
  return this.request(`/categories/${id}`);
}

async createCategory(data) {
  if (!data || !data.name) {
    throw new APIError('Category name is required', 400, null);
  }
  return this.request('/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

async updateCategory(id, data) {
  if (!id) throw new APIError('Category ID is required', 400, null);
  return this.request(`/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

async deleteCategory(id) {
  if (!id) throw new APIError('Category ID is required', 400, null);
  return this.request(`/categories/${id}`, { method: 'DELETE' });
}

}

// Create singleton instance
const api = new MineazyAPI();

export default api;
export { APIError };