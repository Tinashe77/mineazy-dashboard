// src/pages/OrdersPage.jsx - Complete implementation with all features
import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '../components/layout';
import { Button, Alert, LoadingSpinner } from '../components/ui';
import { OrderFilters } from '../components/orders/OrderFilters';
import { OrderList } from '../components/orders/OrderList';
import { OrderDetailsModal } from '../components/orders/OrderDetailsModal';
import { OrderStatusModal, OrderTrackingModal } from '../components/orders/OrderStatusModal';
import { Plus, RefreshCw, Download } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import orderAPI from '../services/orderApi';

export const OrdersPage = () => {
  const { isAuthenticated, user, userRole, hasAnyRole } = useAuth();
  
  // State management
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1
  });

  // Filters state
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    paymentMethod: '',
    branchId: '',
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: '',
    page: 1,
    limit: 20
  });

  // Modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Check permissions
  const canManageOrders = hasAnyRole(['admin', 'shop_manager', 'super_admin']);
  const canViewAllOrders = hasAnyRole(['admin', 'super_admin']);
  const canViewBranchOrders = hasAnyRole(['shop_manager']);

  useEffect(() => {
    if (!isAuthenticated || !canManageOrders) {
      setError('You do not have permission to view orders');
      return;
    }
    
    loadOrders();
  }, [isAuthenticated, canManageOrders, filters]);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading orders with filters:', filters);
      
      // Validate authentication
      if (!isAuthenticated) {
        throw new Error('Authentication required');
      }
      
      if (!canManageOrders) {
        throw new Error('Insufficient permissions to view orders');
      }
      
      // Build query parameters
      const queryParams = { ...filters };
      
      // Remove empty filter values
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] === '' || queryParams[key] === null || queryParams[key] === undefined) {
          delete queryParams[key];
        }
      });
      
      console.log('Query parameters:', queryParams);
      
      const response = await orderAPI.getOrders(queryParams);
      console.log('Orders API response:', response);
      
      const ordersData = response.orders || [];
      const paginationData = response.pagination || {
        total: ordersData.length,
        page: 1,
        limit: 20,
        totalPages: Math.ceil(ordersData.length / 20)
      };
      
      // Format orders for display
      const formattedOrders = ordersData.map(order => orderAPI.formatOrderForDisplay(order));
      
      setOrders(formattedOrders);
      setPagination(paginationData);
      
    } catch (error) {
      console.error('Failed to load orders:', error);
      
      let errorMessage = 'Failed to load orders';
      
      if (error.status === 401) {
        errorMessage = 'Authentication failed. Please login again.';
      } else if (error.status === 403) {
        errorMessage = 'Access denied. You don\'t have permission to view orders.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, canManageOrders, filters]);

  const handleFiltersChange = (newFilters) => {
    console.log('Filters changed:', newFilters);
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handleClearFilters = () => {
    console.log('Clearing filters');
    setFilters({
      search: '',
      status: '',
      paymentMethod: '',
      branchId: '',
      startDate: '',
      endDate: '',
      minAmount: '',
      maxAmount: '',
      page: 1,
      limit: 20
    });
  };

  const handleRefresh = () => {
    console.log('Refreshing orders');
    loadOrders();
  };

  const handleViewOrder = (order) => {
    console.log('Viewing order:', order);
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const handleEditOrder = (order) => {
    console.log('Editing order:', order);
    setSelectedOrder(order);
    setShowStatusModal(true);
  };

  const handleUpdateStatus = async (orderId, status, notes) => {
    try {
      setActionLoading(true);
      setError(null);
      
      console.log(`Updating order ${orderId} status to ${status}`);
      
      await orderAPI.updateOrderStatus(orderId, status, notes);
      
      console.log('Order status updated successfully');
      
      // Refresh orders list
      await loadOrders();
      
      // Update selected order if it's the same one
      if (selectedOrder && (selectedOrder.id === orderId || selectedOrder._id === orderId)) {
        const updatedOrders = orders.find(o => (o.id === orderId || o._id === orderId));
        if (updatedOrders) {
          setSelectedOrder({ ...updatedOrders, status });
        }
      }
      
    } catch (error) {
      console.error('Failed to update order status:', error);
      setError(`Failed to update order status: ${error.message}`);
      throw error; // Re-throw for modal error handling
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelOrder = async (orderId, reason) => {
    try {
      setActionLoading(true);
      setError(null);
      
      console.log(`Cancelling order ${orderId} with reason: ${reason}`);
      
      await orderAPI.cancelOrder(orderId, reason);
      
      console.log('Order cancelled successfully');
      
      // Refresh orders list
      await loadOrders();
      
    } catch (error) {
      console.error('Failed to cancel order:', error);
      setError(`Failed to cancel order: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddTracking = async (orderId, trackingData) => {
    try {
      setActionLoading(true);
      setError(null);
      
      console.log(`Adding tracking for order ${orderId}:`, trackingData);
      
      await orderAPI.addTrackingInformation(orderId, trackingData);
      
      console.log('Tracking information added successfully');
      
      // Refresh orders list
      await loadOrders();
      
    } catch (error) {
      console.error('Failed to add tracking information:', error);
      setError(`Failed to add tracking information: ${error.message}`);
      throw error; // Re-throw for modal error handling
    } finally {
      setActionLoading(false);
    }
  };

  const handleTrackOrder = (order) => {
    console.log('Tracking order:', order);
    setSelectedOrder(order);
    setShowTrackingModal(true);
  };

  const handleExportOrders = async () => {
    try {
      setError(null);
      console.log('Exporting orders with current filters');
      
      // In a real implementation, you would call an export API endpoint
      // For now, we'll create a simple CSV export
      
      const csvHeaders = [
        'Order Number',
        'Customer',
        'Items',
        'Total',
        'Status',
        'Payment Method',
        'Date Created'
      ];
      
      const csvRows = orders.map(order => [
        order.orderNumber || `ORD-${(order.id || '').toString().slice(-6)}`,
        order.customer || 'Unknown',
        order.itemCount || 0,
        order.total || 0,
        order.status || 'pending',
        order.paymentMethod || 'unknown',
        order.createdAt || new Date().toISOString()
      ]);
      
      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `orders-export-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
    } catch (error) {
      console.error('Failed to export orders:', error);
      setError(`Failed to export orders: ${error.message}`);
    }
  };

  const handleDownloadInvoice = async (orderId) => {
    try {
      setError(null);
      console.log(`Downloading invoice for order ${orderId}`);
      
      // In a real implementation, you would call the download invoice API
      alert(`Invoice download for order ${orderId} would be triggered here`);
      
    } catch (error) {
      console.error('Failed to download invoice:', error);
      setError(`Failed to download invoice: ${error.message}`);
    }
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  // Show permission error if user doesn't have access
  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Authentication Required</h3>
        <p className="mt-1 text-sm text-gray-500">
          Please log in to access the orders management system.
        </p>
      </div>
    );
  }

  if (!canManageOrders) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
        <p className="mt-1 text-sm text-gray-500">
          You don't have permission to view orders. Contact your administrator for access.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders Management"
        subtitle="Monitor and manage customer orders"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Orders' }
        ]}
      >
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button
            variant="outline"
            onClick={handleExportOrders}
            disabled={orders.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          {/* Future: Add new order button */}
          {/* <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Order
          </Button> */}
        </div>
      </PageHeader>

      {/* Error Alert */}
      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          <div className="flex items-center justify-between">
            <span>{error}</span>
            {(error.includes('Authentication') || error.includes('token')) && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
              >
                Retry
              </Button>
            )}
          </div>
        </Alert>
      )}

      {/* Debug Info - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-100 p-3 rounded text-xs text-gray-600">
          <strong>Debug:</strong> Auth: {isAuthenticated ? 'Yes' : 'No'} | 
          Role: {userRole || 'None'} | 
          Can Manage: {canManageOrders ? 'Yes' : 'No'} | 
          Orders: {orders.length} | 
          User: {user?.name || 'None'}
        </div>
      )}

      {/* Filters */}
      <OrderFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
        onExport={handleExportOrders}
      />

      {/* Orders List */}
      {loading && orders.length === 0 ? (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
          <span className="ml-3 text-gray-600">Loading orders...</span>
        </div>
      ) : (
        <OrderList
          orders={orders}
          loading={loading && orders.length > 0}
          pagination={pagination}
          onView={handleViewOrder}
          onEdit={handleEditOrder}
          onUpdateStatus={handleUpdateStatus}
          onCancel={handleCancelOrder}
          onTrack={handleTrackOrder}
        />
      )}

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg shadow">
          <div className="flex flex-1 justify-between sm:hidden">
            <Button
              variant="outline"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              Next
            </Button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span>
                {' '}to{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>
                {' '}of{' '}
                <span className="font-medium">{pagination.total}</span>
                {' '}results
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="rounded-l-md"
                >
                  Previous
                </Button>
                
                {/* Page Numbers */}
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNum = i + Math.max(1, pagination.page - 2);
                  if (pageNum <= pagination.totalPages) {
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === pagination.page ? "primary" : "outline"}
                        onClick={() => handlePageChange(pageNum)}
                        className="rounded-none"
                      >
                        {pageNum}
                      </Button>
                    );
                  }
                  return null;
                })}
                
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="rounded-r-md"
                >
                  Next
                </Button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      <OrderDetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
        onUpdateStatus={(order) => {
          setShowDetailsModal(false);
          setSelectedOrder(order);
          setShowStatusModal(true);
        }}
        onAddTracking={(order) => {
          setShowDetailsModal(false);
          setSelectedOrder(order);
          setShowTrackingModal(true);
        }}
        onDownloadInvoice={handleDownloadInvoice}
      />

      {/* Order Status Update Modal */}
      <OrderStatusModal
        isOpen={showStatusModal}
        onClose={() => {
          setShowStatusModal(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
        onUpdateStatus={handleUpdateStatus}
        loading={actionLoading}
      />

      {/* Order Tracking Modal */}
      <OrderTrackingModal
        isOpen={showTrackingModal}
        onClose={() => {
          setShowTrackingModal(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
        onAddTracking={handleAddTracking}
        loading={actionLoading}
      />

      {/* Summary Stats */}
      {orders.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                    <Plus className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-600">Total Orders</p>
                  <p className="text-lg font-semibold text-blue-900">{pagination.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                    <Download className="h-4 w-4 text-green-600" />
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-600">Total Revenue</p>
                  <p className="text-lg font-semibold text-green-900">
                    ${orders.reduce((sum, order) => sum + (order.total || 0), 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                    <RefreshCw className="h-4 w-4 text-yellow-600" />
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-yellow-600">Pending</p>
                  <p className="text-lg font-semibold text-yellow-900">
                    {orders.filter(o => o.status === 'pending').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                    <RefreshCw className="h-4 w-4 text-purple-600" />
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-purple-600">Processing</p>
                  <p className="text-lg font-semibold text-purple-900">
                    {orders.filter(o => o.status === 'processing').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};