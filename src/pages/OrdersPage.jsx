// src/pages/OrdersPage.jsx - Fixed with better error handling
import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/layout';
import { Button, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Modal, Select, Textarea, Alert } from '../components/ui';
import { formatCurrency, formatDate, getStatusVariant } from '../utils';
import { Eye, Edit, Package } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export const OrdersPage = () => {
  const { isAuthenticated, user, userRole } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusForm, setStatusForm] = useState({
    status: '',
    notes: '',
  });

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Debug authentication state
      console.log('Loading orders - Auth check:', {
        isAuthenticated,
        userRole,
        hasCookie: api.isAuthenticated(),
        hasToken: !!api.getAuthToken()
      });
      
      // Check if we have authentication
      if (!isAuthenticated) {
        throw new Error('You must be logged in to view orders');
      }
      
      if (!api.isAuthenticated() && !api.getAuthToken()) {
        throw new Error('Authentication token not found. Please login again.');
      }
      
      // Check role permissions
      if (!['admin', 'shop_manager', 'super_admin'].includes(userRole)) {
        throw new Error(`Access denied. Your role (${userRole}) doesn't have permission to view orders`);
      }
      
      const response = await api.getOrders({ limit: 50 });
      console.log('Orders API response:', response);
      
      // Handle different response structures
      let ordersData = [];
      if (Array.isArray(response)) {
        ordersData = response;
      } else if (response.data && Array.isArray(response.data)) {
        ordersData = response.data;
      } else if (response.orders && Array.isArray(response.orders)) {
        ordersData = response.orders;
      }
      
      setOrders(ordersData);
      
    } catch (error) {
      console.error('Failed to load orders:', error);
      
      // Handle specific error cases
      if (error.status === 401) {
        setError('Authentication failed. Please login again.');
      } else if (error.status === 403) {
        setError('Access denied. You don\'t have permission to view orders.');
      } else if (error.message.includes('No token provided')) {
        setError('Authentication token missing. Please logout and login again.');
      } else {
        setError(`Failed to load orders: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    try {
      setError(null);
      
      if (!selectedOrder) {
        setError('No order selected');
        return;
      }
      
      if (!api.isAuthenticated() && !api.getAuthToken()) {
        setError('Authentication required. Please login again.');
        return;
      }
      
      await api.updateOrderStatus(
        selectedOrder.id || selectedOrder._id,
        statusForm.status,
        statusForm.notes
      );
      
      await loadOrders();
      setShowStatusModal(false);
      setSelectedOrder(null);
      setStatusForm({ status: '', notes: '' });
    } catch (error) {
      console.error('Failed to update order status:', error);
      setError(`Failed to update order status: ${error.message}`);
    }
  };

  const openStatusModal = (order) => {
    setSelectedOrder(order);
    setStatusForm({
      status: order.status || 'pending',
      notes: '',
    });
    setShowStatusModal(true);
  };

  const handleRetryAuth = async () => {
    try {
      // Try to refresh the profile to re-establish auth
      const profile = await api.getProfile();
      console.log('Profile refreshed:', profile);
      
      // If successful, retry loading orders
      await loadOrders();
    } catch (error) {
      console.error('Failed to refresh auth:', error);
      setError('Failed to refresh authentication. Please logout and login again.');
    }
  };

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders Management"
        subtitle="Monitor and manage customer orders"
      />

      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          <div className="flex items-center justify-between">
            <span>{error}</span>
            {error.includes('token') || error.includes('Authentication') ? (
              <Button variant="outline" size="sm" onClick={handleRetryAuth}>
                Retry Auth
              </Button>
            ) : null}
          </div>
        </Alert>
      )}

      {/* Debug Info - Remove in production */}
      <div className="bg-gray-100 p-3 rounded text-xs text-gray-600">
        <strong>Debug:</strong> Auth: {isAuthenticated ? 'Yes' : 'No'} | 
        Role: {userRole || 'None'} | 
        Cookie: {api.isAuthenticated() ? 'Present' : 'Missing'} | 
        Token: {api.getAuthToken() ? 'Present' : 'Missing'} | 
        User: {user?.name || 'None'}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-2 text-gray-500">Loading orders...</p>
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <Package className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No orders</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No orders have been placed yet.
                  </p>
                </TableCell>
              </TableRow>
            ) : orders.map((order) => (
              <TableRow key={order.id || order._id}>
                <TableCell className="font-mono font-medium">
                  {(order.id || order._id || '').toString().slice(-8).toUpperCase()}
                </TableCell>
                <TableCell>
                  {order.customer || order.user?.name || order.user?.email || 'Unknown'}
                </TableCell>
                <TableCell>
                  {order.items?.length || order.products?.length || 1} item(s)
                </TableCell>
                <TableCell className="font-medium">
                  {formatCurrency(order.total || order.totalAmount || 0, order.currency || 'USD')}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(order.status || 'pending')}>
                    {order.status || 'pending'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {formatDate(order.createdAt || order.date)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => console.log('View order:', order)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openStatusModal(order)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Status Update Modal */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title="Update Order Status"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Order ID</label>
            <input
              type="text"
              value={(selectedOrder?.id || selectedOrder?._id || '').toString().slice(-8).toUpperCase()}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-50"
              readOnly
            />
          </div>

          <Select
            label="Status"
            required
            value={statusForm.status}
            onChange={(e) => setStatusForm(prev => ({ ...prev, status: e.target.value }))}
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          <Textarea
            label="Notes"
            rows={3}
            value={statusForm.notes}
            onChange={(e) => setStatusForm(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Add any notes about this status update..."
          />

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowStatusModal(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateStatus}>
              Update Status
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};