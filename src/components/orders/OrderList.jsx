// src/components/orders/OrderList.jsx
import React, { useState } from 'react';
import { Button, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui';
import { formatCurrency, formatDate, getStatusVariant } from '../../utils';
import { 
  Eye, 
  Edit, 
  Package,
  Truck,
  User,
  CreditCard,
  MapPin,
  Calendar,
  DollarSign,
  X
} from 'lucide-react';

export const OrderList = ({ 
  orders, 
  loading, 
  pagination,
  onView, 
  onEdit,
  onUpdateStatus,
  onCancel,
  onTrack
}) => {
  const [selectedOrders, setSelectedOrders] = useState([]);

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedOrders(orders.map(o => o.id || o._id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleSelectOrder = (orderId, checked) => {
    if (checked) {
      setSelectedOrders(prev => [...prev, orderId]);
    } else {
      setSelectedOrders(prev => prev.filter(id => id !== orderId));
    }
  };

  const handleBulkCancel = () => {
    if (selectedOrders.length === 0) return;
    
    if (confirm(`Cancel ${selectedOrders.length} selected orders?`)) {
      selectedOrders.forEach(id => onCancel && onCancel(id, 'Bulk cancellation'));
      setSelectedOrders([]);
    }
  };

  // Helper functions to extract order data consistently
  const getOrderId = (order) => order.id || order._id;
  
  const getOrderNumber = (order) => {
    return order.orderNumber || `ORD-${(getOrderId(order) || '').toString().slice(-6).toUpperCase()}`;
  };

  const getCustomerName = (order) => {
    if (order.customer?.name) return order.customer.name;
    if (order.user?.name) return order.user.name;
    if (order.customer && typeof order.customer === 'string') return order.customer;
    return 'Unknown Customer';
  };

  const getCustomerEmail = (order) => {
    if (order.customer?.email) return order.customer.email;
    if (order.user?.email) return order.user.email;
    return null;
  };

  const getOrderTotal = (order) => {
    return order.total || order.totalAmount || 0;
  };

  const getOrderStatus = (order) => {
    return order.status || 'pending';
  };

  const getItemCount = (order) => {
    if (order.items && Array.isArray(order.items)) return order.items.length;
    if (order.products && Array.isArray(order.products)) return order.products.length;
    return 1;
  };

  const getPaymentMethodDisplay = (method) => {
    const methodMap = {
      'card': 'Credit/Debit Card',
      'paynow': 'Paynow',
      'bank_transfer': 'Bank Transfer',
      'cash_on_delivery': 'Cash on Delivery'
    };
    return methodMap[method] || method;
  };

  const getPaymentMethodIcon = (method) => {
    switch (method?.toLowerCase()) {
      case 'card':
        return <CreditCard className="h-4 w-4" />;
      case 'paynow':
        return <CreditCard className="h-4 w-4" />;
      case 'bank_transfer':
        return <CreditCard className="h-4 w-4" />;
      case 'cash_on_delivery':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const canCancelOrder = (status) => {
    return ['pending', 'processing'].includes(status.toLowerCase());
  };

  const canUpdateStatus = (status) => {
    return !['delivered', 'cancelled'].includes(status.toLowerCase());
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'processing': 'bg-blue-100 text-blue-800',
      'shipped': 'bg-purple-100 text-purple-800',
      'delivered': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Bulk actions */}
      {selectedOrders.length > 0 && (
        <div className="bg-primary-50 px-6 py-3 border-b">
          <div className="flex items-center justify-between">
            <span className="text-sm text-primary-700">
              {selectedOrders.length} order(s) selected
            </span>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkCancel}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel Selected
              </Button>
            </div>
          </div>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <input
                type="checkbox"
                checked={selectedOrders.length === orders.length && orders.length > 0}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
            </TableHead>
            <TableHead>Order</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const orderId = getOrderId(order);
            const isSelected = selectedOrders.includes(orderId);
            const orderStatus = getOrderStatus(order);
            const orderTotal = getOrderTotal(order);
            const customerName = getCustomerName(order);
            const customerEmail = getCustomerEmail(order);
            const itemCount = getItemCount(order);
            
            return (
              <TableRow key={orderId}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => handleSelectOrder(orderId, e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Package className="h-5 w-5 text-primary-600" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 font-mono">
                        {getOrderNumber(order)}
                      </div>
                      <div className="text-sm text-gray-500">
                        ID: {orderId.toString().slice(-8)}
                      </div>
                    </div>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center">
                    <User className="h-4 w-4 text-gray-400 mr-2" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {customerName}
                      </div>
                      {customerEmail && (
                        <div className="text-sm text-gray-500">
                          {customerEmail}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center">
                    <Package className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-900">
                      {itemCount} item{itemCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="text-sm">
                    <div className="font-semibold text-green-600">
                      {formatCurrency(orderTotal, order.currency || 'USD')}
                    </div>
                    {order.currency === 'USD' && order.zwgAmount && (
                      <div className="text-gray-500 text-xs">
                        ZWG {order.zwgAmount.toLocaleString()}
                      </div>
                    )}
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center">
                    {getPaymentMethodIcon(order.paymentMethod)}
                    <span className="ml-2 text-sm text-gray-700">
                      {getPaymentMethodDisplay(order.paymentMethod)}
                    </span>
                  </div>
                </TableCell>
                
                <TableCell>
                  <Badge variant={getStatusVariant(orderStatus)} className={getStatusColor(orderStatus)}>
                    {orderStatus.charAt(0).toUpperCase() + orderStatus.slice(1)}
                  </Badge>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <div>
                      <div className="text-sm text-gray-900">
                        {formatDate(order.createdAt)}
                      </div>
                      {order.updatedAt && order.updatedAt !== order.createdAt && (
                        <div className="text-xs text-gray-500">
                          Updated: {formatDate(order.updatedAt)}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {onView && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(order)}
                        title="View Order Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {onEdit && canUpdateStatus(orderStatus) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(order)}
                        title="Update Status"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {onTrack && ['shipped', 'delivered'].includes(orderStatus) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onTrack(order)}
                        title="Track Order"
                      >
                        <Truck className="h-4 w-4 text-blue-500" />
                      </Button>
                    )}
                    
                    {order.shippingAddress && (
                      <Button
                        variant="ghost"
                        size="sm"
                        title={`${order.shippingAddress.street}, ${order.shippingAddress.city}`}
                      >
                        <MapPin className="h-4 w-4 text-green-500" />
                      </Button>
                    )}
                    
                    {onCancel && canCancelOrder(orderStatus) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Cancel order ${getOrderNumber(order)}?`)) {
                            onCancel(orderId, 'Cancelled by admin');
                          }
                        }}
                        title="Cancel Order"
                      >
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {orders.length === 0 && (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
          <p className="mt-1 text-sm text-gray-500">
            No orders match your current filters.
          </p>
        </div>
      )}

      {/* Pagination Info */}
      {pagination && orders.length > 0 && (
        <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <span className="text-sm text-gray-700">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} orders
              </span>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
                  <span className="font-medium">{pagination.total}</span> orders
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-700">
                  Page <span className="font-medium">{pagination.page}</span> of{' '}
                  <span className="font-medium">{pagination.totalPages}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};