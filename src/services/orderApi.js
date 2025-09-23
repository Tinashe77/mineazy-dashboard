// src/services/orderApi.js - Dedicated Order API service
import api from './api';

class OrderAPIService {
  // Get all orders with filters and pagination
  async getOrders(params = {}) {
    try {
      const cleanParams = {};
      
      // Clean and validate parameters
      Object.entries(params).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          if (key === 'page' || key === 'limit') {
            const numValue = parseInt(value);
            if (!isNaN(numValue) && numValue > 0) {
              cleanParams[key] = numValue;
            }
          } else if (['status'].includes(key)) {
            cleanParams[key] = value.toString().toLowerCase();
          } else {
            cleanParams[key] = value;
          }
        }
      });

      console.log('Fetching orders with params:', cleanParams);

      const queryString = new URLSearchParams();
      Object.entries(cleanParams).forEach(([key, value]) => {
        queryString.append(key, value.toString());
      });

      const endpoint = queryString.toString() ? `/orders?${queryString.toString()}` : '/orders';
      const response = await api.request(endpoint);

      console.log('Orders API response:', response);

      // Handle different response structures
      let ordersData = [];
      let pagination = null;

      if (Array.isArray(response)) {
        ordersData = response;
      } else if (response.data && Array.isArray(response.data)) {
        ordersData = response.data;
        pagination = response.pagination;
      } else if (response.orders && Array.isArray(response.orders)) {
        ordersData = response.orders;
        pagination = response.pagination;
      } else if (response.data && response.data.orders) {
        ordersData = response.data.orders;
        pagination = response.data.pagination;
      }

      return {
        orders: ordersData,
        pagination: pagination || {
          total: ordersData.length,
          page: 1,
          limit: 20,
          totalPages: 1
        }
      };
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      throw error;
    }
  }

  // Get order by ID
  async getOrderById(id) {
    if (!id) {
      throw new Error('Order ID is required');
    }
    
    try {
      const response = await api.request(`/orders/${id}`);
      return response.data || response;
    } catch (error) {
      console.error(`Failed to fetch order ${id}:`, error);
      throw error;
    }
  }

  // Get order by order number
  async getOrderByNumber(orderNumber) {
    if (!orderNumber) {
      throw new Error('Order number is required');
    }
    
    try {
      const response = await api.request(`/orders/number/${orderNumber}`);
      return response.data || response;
    } catch (error) {
      console.error(`Failed to fetch order by number ${orderNumber}:`, error);
      throw error;
    }
  }

  // Create new order
  async createOrder(orderData) {
    if (!orderData || !orderData.items || orderData.items.length === 0) {
      throw new Error('Order must contain at least one item');
    }

    // Validate required fields
    const requiredFields = ['items', 'shippingAddress', 'paymentMethod'];
    const missingFields = requiredFields.filter(field => !orderData[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Validate items
    orderData.items.forEach((item, index) => {
      if (!item.productId || !item.quantity || !item.price) {
        throw new Error(`Item ${index + 1} is missing required fields (productId, quantity, price)`);
      }
    });

    // Validate shipping address
    const { shippingAddress } = orderData;
    const requiredAddressFields = ['street', 'city', 'province', 'country'];
    const missingAddressFields = requiredAddressFields.filter(field => !shippingAddress[field]);
    
    if (missingAddressFields.length > 0) {
      throw new Error(`Shipping address missing fields: ${missingAddressFields.join(', ')}`);
    }

    try {
      const response = await api.request('/orders', {
        method: 'POST',
        body: JSON.stringify(orderData)
      });
      
      console.log('Order created successfully:', response);
      return response.data || response;
    } catch (error) {
      console.error('Failed to create order:', error);
      throw error;
    }
  }

  // Update order status
  async updateOrderStatus(orderId, status, notes = '') {
    if (!orderId || !status) {
      throw new Error('Order ID and status are required');
    }

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status.toLowerCase())) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    try {
      const response = await api.request(`/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, notes })
      });
      
      console.log('Order status updated successfully:', response);
      return response.data || response;
    } catch (error) {
      console.error(`Failed to update order ${orderId} status:`, error);
      throw error;
    }
  }

  // Cancel order
  async cancelOrder(orderId, reason) {
    if (!orderId || !reason) {
      throw new Error('Order ID and cancellation reason are required');
    }

    try {
      const response = await api.request(`/orders/${orderId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      });
      
      console.log('Order cancelled successfully:', response);
      return response.data || response;
    } catch (error) {
      console.error(`Failed to cancel order ${orderId}:`, error);
      throw error;
    }
  }

  // Get order statistics
  async getOrderStatistics(params = {}) {
    try {
      const cleanParams = {};
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          cleanParams[key] = value;
        }
      });

      const queryString = new URLSearchParams();
      Object.entries(cleanParams).forEach(([key, value]) => {
        queryString.append(key, value.toString());
      });

      const endpoint = queryString.toString() ? `/orders/stats?${queryString.toString()}` : '/orders/stats';
      const response = await api.request(endpoint);

      return response.data || response;
    } catch (error) {
      console.error('Failed to fetch order statistics:', error);
      throw error;
    }
  }

  // Get order tracking information
  async getOrderTracking(orderId) {
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    try {
      const response = await api.request(`/orders/${orderId}/tracking`);
      return response.data || response;
    } catch (error) {
      console.error(`Failed to fetch tracking for order ${orderId}:`, error);
      throw error;
    }
  }

  // Add tracking information
  async addTrackingInformation(orderId, trackingData) {
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    const requiredFields = ['carrier', 'trackingNumber', 'status'];
    const missingFields = requiredFields.filter(field => !trackingData[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required tracking fields: ${missingFields.join(', ')}`);
    }

    try {
      const response = await api.request(`/orders/${orderId}/tracking`, {
        method: 'POST',
        body: JSON.stringify(trackingData)
      });
      
      console.log('Tracking information added successfully:', response);
      return response.data || response;
    } catch (error) {
      console.error(`Failed to add tracking for order ${orderId}:`, error);
      throw error;
    }
  }

  // Get order analytics overview
  async getOrderAnalytics(params = {}) {
    try {
      const cleanParams = {};
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          cleanParams[key] = value;
        }
      });

      const queryString = new URLSearchParams();
      Object.entries(cleanParams).forEach(([key, value]) => {
        queryString.append(key, value.toString());
      });

      const endpoint = queryString.toString() ? `/orders/analytics/overview?${queryString.toString()}` : '/orders/analytics/overview';
      const response = await api.request(endpoint);

      return response.data || response;
    } catch (error) {
      console.error('Failed to fetch order analytics:', error);
      throw error;
    }
  }

  // Helper method to format order data for display
  formatOrderForDisplay(order) {
    return {
      id: order.id || order._id,
      orderNumber: order.orderNumber || `ORD-${(order.id || order._id || '').toString().slice(-6).toUpperCase()}`,
      customer: this.getCustomerName(order),
      customerEmail: this.getCustomerEmail(order),
      items: order.items || [],
      itemCount: (order.items || []).length,
      total: order.total || order.totalAmount || 0,
      currency: order.currency || 'USD',
      status: order.status || 'pending',
      paymentMethod: order.paymentMethod,
      shippingAddress: order.shippingAddress,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      notes: order.notes,
      tracking: order.tracking
    };
  }

  // Helper method to get customer name
  getCustomerName(order) {
    if (order.customer?.name) return order.customer.name;
    if (order.user?.name) return order.user.name;
    if (order.customer && typeof order.customer === 'string') return order.customer;
    return 'Unknown Customer';
  }

  // Helper method to get customer email
  getCustomerEmail(order) {
    if (order.customer?.email) return order.customer.email;
    if (order.user?.email) return order.user.email;
    return null;
  }

  // Helper method to calculate order totals
  calculateOrderTotals(items) {
    if (!Array.isArray(items)) return { subtotal: 0, total: 0 };

    const subtotal = items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    // Add any additional calculations (tax, shipping, etc.)
    const total = subtotal; // Simplified for now

    return { subtotal, total };
  }

  // Helper method to validate order status transitions
  canTransitionStatus(currentStatus, newStatus) {
    const statusTransitions = {
      'pending': ['processing', 'cancelled'],
      'processing': ['shipped', 'cancelled'],
      'shipped': ['delivered', 'cancelled'],
      'delivered': [],
      'cancelled': []
    };

    return statusTransitions[currentStatus]?.includes(newStatus) || false;
  }
}

// Create singleton instance
const orderAPI = new OrderAPIService();

export default orderAPI;
export { OrderAPIService };