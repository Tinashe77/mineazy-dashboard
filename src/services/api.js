const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://minings.onrender.com/api/v1';

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
    // Since tokens are in HTTP-only cookies, we don't store them in localStorage
    this.baseURL = API_BASE_URL;
    this.requestInterceptors = [];
    this.responseInterceptors = [];
  }

  // Check if user is authenticated by checking if authToken cookie exists
  isAuthenticated() {
    // Check if authToken cookie exists
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'authToken' && value) {
        return true;
      }
    }
    return false;
  }

  // Get auth token from cookie (if needed for manual requests)
  getAuthToken() {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'authToken') {
        return value;
      }
    }
    return null;
  }

  // Clear authentication (for logout)
  clearAuth() {
    // Clear the cookie by setting it to expire
    document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    let config = {
      credentials: 'include', // IMPORTANT: This sends cookies with requests
      headers: {
        ...options.headers,
      },
      ...options,
    };

    // Don't set Content-Type for FormData
    if (!(options.body instanceof FormData) && !config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }

    // Apply request interceptors
    for (const interceptor of this.requestInterceptors) {
      config = await interceptor(config);
    }

    try {
      const response = await fetch(url, config);
      
      // Handle different content types
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
        // Handle specific error cases
        if (response.status === 401) {
          // Unauthorized - clear any existing cookies and redirect to login
          this.clearAuth();
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
        
        const errorMessage = data.message || data.error || `HTTP error! status: ${response.status}`;
        throw new APIError(errorMessage, response.status, data);
      }
      
      // Apply response interceptors
      for (const interceptor of this.responseInterceptors) {
        data = await interceptor(data, response);
      }
      
      return data;
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      
      // Network or other errors
      console.error('API Request failed:', error);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new APIError('Network error. Please check your connection.', 0, null);
      }
      
      throw new APIError(error.message || 'An unexpected error occurred', 0, null);
    }
  }

  // Authentication endpoints
  async login(email, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    // The token is automatically stored in HTTP-only cookie
    // We don't need to manually handle it
    return response;
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
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
  async getProducts(params = {}) {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== '' && value != null)
    );
    
    const queryString = new URLSearchParams(cleanParams).toString();
    const endpoint = queryString ? `/products?${queryString}` : '/products';
    
    return this.request(endpoint);
  }

  async getProductById(id) {
    if (!id) {
      throw new APIError('Product ID is required', 400, null);
    }
    return this.request(`/products/${id}`);
  }

  async getProductBySku(sku) {
    if (!sku) {
      throw new APIError('Product SKU is required', 400, null);
    }
    return this.request(`/products/sku/${sku}`);
  }

  async createProduct(formData) {
    if (!formData) {
      throw new APIError('Product data is required', 400, null);
    }
    
    return this.request('/products', {
      method: 'POST',
      body: formData,
    });
  }

  async updateProduct(id, data) {
    if (!id) {
      throw new APIError('Product ID is required', 400, null);
    }
    
    const body = data instanceof FormData ? data : JSON.stringify(data);
    
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body,
    });
  }

  async deleteProduct(id) {
    if (!id) {
      throw new APIError('Product ID is required', 400, null);
    }
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
    if (!id) {
      throw new APIError('Order ID is required', 400, null);
    }
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

  async cancelOrder(id, reason = '') {
    if (!id) {
      throw new APIError('Order ID is required', 400, null);
    }
    
    return this.request(`/orders/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // Branches endpoints
  async getBranches() {
    return this.request('/branches');
  }

  async getBranchById(id) {
    if (!id) {
      throw new APIError('Branch ID is required', 400, null);
    }
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
    if (!id) {
      throw new APIError('Branch ID is required', 400, null);
    }
    
    return this.request(`/branches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Users endpoints (Admin only)
  async getUsers(params = {}) {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== '' && value != null)
    );
    
    const queryString = new URLSearchParams(cleanParams).toString();
    const endpoint = queryString ? `/admin/users?${queryString}` : '/admin/users';
    
    return this.request(endpoint);
  }

  async getUserById(id) {
    if (!id) {
      throw new APIError('User ID is required', 400, null);
    }
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
    if (!id) {
      throw new APIError('User ID is required', 400, null);
    }
    
    return this.request(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id) {
    if (!id) {
      throw new APIError('User ID is required', 400, null);
    }
    return this.request(`/admin/users/${id}`, { method: 'DELETE' });
  }

  // Health check endpoints
  async getHealthCheck() {
    return this.request('/health');
  }

  async getApiInfo() {
    return this.request('/info');
  }

  // Method to test API connection
  async testConnection() {
    try {
      await this.getHealthCheck();
      return { success: true, message: 'API connection successful' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

// Create and export a singleton instance
const api = new MineazyAPI();

export default api;
export { APIError };