// src/pages/OrdersPage.jsx
import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/layout';
import { Button, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Modal, Select, Textarea, Alert } from '../components/ui';
import { formatCurrency, formatDate, getStatusVariant } from '../utils';
import { Eye, Edit, Package } from 'lucide-react';
import api from '../services/api';

export const OrdersPage = () => {
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
      
      const response = await api.getOrders({ limit: 50 });
      setOrders(response.data || []);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    try {
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
      setError('Failed to update order status: ' + error.message);
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
          {error}
        </Alert>
      )}

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
                </TableCell>
              </TableRow>
            ) : orders.map((order) => (
              <TableRow key={order.id || order._id}>
                <TableCell className="font-mono font-medium">
                  {order.id || order._id}
                </TableCell>
                <TableCell>
                  {order.customer || order.user?.name || order.user?.email || 'Unknown'}
                </TableCell>
                <TableCell>
                  {order.items?.length || order.products?.length || 1} item(s)
                </TableCell>
                <TableCell className="font-medium">
                  {formatCurrency(order.total || order.totalAmount, order.currency)}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(order.status)}>
                    {order.status}
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

        {orders.length === 0 && !loading && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No orders</h3>
            <p className="mt-1 text-sm text-gray-500">No orders have been placed yet.</p>
          </div>
        )}
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
              value={selectedOrder?.id || selectedOrder?._id || ''}
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
