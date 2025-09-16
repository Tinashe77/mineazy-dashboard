// src/services/api.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://minings.onrender.com/api/v1';



class MineazyAPI {
  constructor() {
    this.token = localStorage.getItem('mineazy_token');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('mineazy_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('mineazy_token');
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    // Don't set Content-Type for FormData
    if (!(options.body instanceof FormData) && !config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Authentication endpoints
  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout() {
    return this.request('/auth/logout', { method: 'POST' });
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
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/products?${queryString}`);
  }

  async getProductById(id) {
    return this.request(`/products/${id}`);
  }

  async getProductBySku(sku) {
    return this.request(`/products/sku/${sku}`);
  }

  async createProduct(formData) {
    return this.request('/products', {
      method: 'POST',
      body: formData,
    });
  }

  async updateProduct(id, data) {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProduct(id) {
    return this.request(`/products/${id}`, { method: 'DELETE' });
  }

  // Orders endpoints
  async getOrders(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/orders?${queryString}`);
  }

  async getOrderById(id) {
    return this.request(`/orders/${id}`);
  }

  async createOrder(data) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateOrderStatus(id, status, notes) {
    return this.request(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
  }

  async cancelOrder(id, reason) {
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
    return this.request(`/branches/${id}`);
  }

  async createBranch(data) {
    return this.request('/branches', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBranch(id, data) {
    return this.request(`/branches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Users endpoints (Admin only)
  async getUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/admin/users?${queryString}`);
  }

  async getUserById(id) {
    return this.request(`/admin/users/${id}`);
  }

  async createUser(data) {
    return this.request('/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(id, data) {
    return this.request(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id) {
    return this.request(`/admin/users/${id}`, { method: 'DELETE' });
  }

  // Categories endpoints
  async getCategories() {
    return this.request('/categories');
  }

  async getCategoryById(id) {
    return this.request(`/categories/${id}`);
  }

  async createCategory(data) {
    return this.request('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Transactions endpoints
  async getTransactions(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/transactions?${queryString}`);
  }

  async getTransactionById(id) {
    return this.request(`/transactions/${id}`);
  }

  async createTransaction(data) {
    return this.request('/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Contact inquiries endpoints
  async getContacts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/contacts?${queryString}`);
  }

  async updateContactStatus(id, status, response) {
    return this.request(`/contacts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, response }),
    });
  }

  // Reports endpoints
  async getReports(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/reports?${queryString}`);
  }

  async generateReport(data) {
    return this.request('/reports/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async generateSalesReport(data) {
    return this.request('/reports/sales', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async generateInventoryReport(branchId) {
    return this.request(`/reports/inventory?branchId=${branchId}`, {
      method: 'POST',
    });
  }

  async generateCustomerReport(data) {
    return this.request('/reports/customer', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async generateBranchReport(data) {
    return this.request('/reports/branch', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async generateFinancialReport(data) {
    return this.request('/reports/financial', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async exportReportToCsv(reportId) {
    return this.request(`/reports/${reportId}/export/csv`);
  }

  // System administration endpoints
  async getRoles() {
    return this.request('/admin/roles');
  }

  async getPermissions() {
    return this.request('/admin/permissions');
  }

  // Audit endpoints
  async getAuditLogs(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/audit?${queryString}`);
  }

  async getAuditStats() {
    return this.request('/audit/stats');
  }

  // System logs endpoints
  async getSystemLogs(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/logs?${queryString}`);
  }

  async getSystemLogsStats() {
    return this.request('/logs/stats');
  }

  // Health check endpoints
  async getHealthCheck() {
    return this.request('/health');
  }

  async getApiInfo() {
    return this.request('/info');
  }
}

// Create and export a singleton instance
const api = new MineazyAPI();
export default api;