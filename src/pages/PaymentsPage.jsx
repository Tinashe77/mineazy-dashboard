// src/pages/PaymentsPage.jsx - Complete implementation
import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '../components/layout';
import { 
  TransactionFilters, 
  TransactionList, 
  TransactionDetailsModal,
  TransactionStatusModal,
  RefundModal,
  TransactionAnalytics 
} from '../components/transactions';
import { Button, Alert, Badge } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../utils';
import { 
  Plus, 
  Download, 
  RefreshCw, 
  BarChart3,
  CreditCard,
  DollarSign 
} from 'lucide-react';
import api from '../services/api';

export const PaymentsPage = () => {
  const { isAuthenticated, user, userRole } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  
  // View state
  const [viewMode, setViewMode] = useState('transactions'); // 'transactions' or 'analytics'
  
  // Filters and pagination
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    method: '',
    minAmount: '',
    maxAmount: '',
    startDate: '',
    endDate: '',
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });

  // Debounced filter function
  const [filterTimeout, setFilterTimeout] = useState(null);

  const loadTransactions = useCallback(async (newFilters = null, page = null) => {
    try {
      setLoading(true);
      setError(null);
      
      const currentFilters = newFilters || filters;
      const currentPage = page || pagination.currentPage;
      
      console.log('Loading transactions with filters:', currentFilters);
      
      // Build API parameters
      const params = {
        page: currentPage,
        limit: 20,
      };

      // Add filters to params, only if they have values
      if (currentFilters.search && currentFilters.search.trim()) {
        params.search = currentFilters.search.trim();
      }
      
      if (currentFilters.status) {
        params.status = currentFilters.status;
      }
      
      if (currentFilters.method) {
        params.method = currentFilters.method;
      }
      
      if (currentFilters.minAmount && currentFilters.minAmount !== '') {
        params.minAmount = parseFloat(currentFilters.minAmount);
      }
      
      if (currentFilters.maxAmount && currentFilters.maxAmount !== '') {
        params.maxAmount = parseFloat(currentFilters.maxAmount);
      }
      
      if (currentFilters.startDate) {
        params.startDate = currentFilters.startDate;
      }
      
      if (currentFilters.endDate) {
        params.endDate = currentFilters.endDate;
      }

      console.log('API params being sent:', params);
      
      const response = await api.getTransactions(params);
      console.log('Transactions API response:', response);
      
      let transactionsData = [];
      let paginationData = {};
      
      if (Array.isArray(response)) {
        transactionsData = response;
        paginationData = {
          currentPage: 1,
          totalPages: 1,
          totalItems: response.length,
        };
      } else if (response.data && Array.isArray(response.data)) {
        transactionsData = response.data;
        paginationData = {
          currentPage: response.page || currentPage,
          totalPages: response.totalPages || 1,
          totalItems: response.total || response.totalItems || response.data.length,
        };
      } else if (response.transactions && Array.isArray(response.transactions)) {
        transactionsData = response.transactions;
        paginationData = {
          currentPage: response.page || currentPage,
          totalPages: response.totalPages || 1,
          totalItems: response.total || response.totalItems || response.transactions.length,
        };
      }
      
      console.log('Processed transactions data:', transactionsData.length);
      console.log('Pagination data:', paginationData);
      
      setTransactions(transactionsData);
      setPagination(paginationData);
      
    } catch (error) {
      console.error('Failed to load transactions:', error);
      setError(`Failed to load transactions: ${error.message}`);
      {process.env.NODE_ENV === 'development' && (
  <div className="bg-yellow-50 p-3 rounded text-xs">
    <strong>Debug Info:</strong><br/>
    User Role: {userRole} | 
    Is Admin: {['admin', 'shop_manager', 'super_admin'].includes(userRole)} | 
    API Base URL: {api.baseURL} | 
    Expected Endpoint: {['admin', 'shop_manager', 'super_admin'].includes(userRole) ? '/transactions' : '/transactions/my-transactions'}
  </div>
)}
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.currentPage]);

  const loadAnalytics = useCallback(async (params = {}) => {
    try {
      setAnalyticsLoading(true);
      const response = await api.getTransactionAnalytics(params);
      console.log('Analytics response:', response);
      
      // Handle backend response structure
      if (response.success && response.data) {
        setAnalytics(response.data);
      } else {
        console.warn('Unexpected analytics response structure:', response);
        setAnalytics(null);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
      // Don't show error for analytics, just log it
      setAnalytics(null);
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  // Load data on component mount
  useEffect(() => {
    loadTransactions();
    loadAnalytics();
  }, []);

  // Handle filter changes with debouncing
  const handleFiltersChange = useCallback((newFilters) => {
    console.log('Filters changed:', newFilters);
    setFilters(newFilters);
    
    // Clear existing timeout
    if (filterTimeout) {
      clearTimeout(filterTimeout);
    }
    
    // Set new timeout for debounced API call
    const timeout = setTimeout(() => {
      console.log('Applying filters after debounce:', newFilters);
      setPagination(prev => ({ ...prev, currentPage: 1 }));
      loadTransactions(newFilters, 1);
    }, 500);
    
    setFilterTimeout(timeout);
  }, [filterTimeout, loadTransactions]);

  // Handle clear filters
  const handleClearFilters = useCallback(() => {
    console.log('Clearing filters');
    const clearedFilters = {
      search: '',
      status: '',
      method: '',
      minAmount: '',
      maxAmount: '',
      startDate: '',
      endDate: '',
    };
    setFilters(clearedFilters);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    loadTransactions(clearedFilters, 1);
  }, [loadTransactions]);

  // Handle page changes
  const handlePageChange = useCallback((newPage) => {
    console.log('Page changed to:', newPage);
    setPagination(prev => ({ ...prev, currentPage: newPage }));
    loadTransactions(null, newPage);
  }, [loadTransactions]);

  // Transaction actions
  const handleViewTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailsModal(true);
  };

  const handleEditTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setShowStatusModal(true);
  };

  const handleRefundTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setShowRefundModal(true);
  };

  const handleDownloadInvoice = async (transactionId) => {
    try {
      setError(null);
      await api.downloadTransactionInvoice(transactionId);
      setSuccess('Invoice downloaded successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Failed to download invoice:', error);
      setError(`Failed to download invoice: ${error.message}`);
    }
  };

  const handleCancelTransaction = async (transactionId) => {
    if (!confirm('Are you sure you want to cancel this transaction?')) {
      return;
    }

    try {
      setError(null);
      await api.cancelTransaction(transactionId, 'Cancelled by admin');
      setSuccess('Transaction cancelled successfully!');
      await loadTransactions();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Failed to cancel transaction:', error);
      setError(`Failed to cancel transaction: ${error.message}`);
    }
  };

  const handleUpdateStatus = async (transactionId, status, notes) => {
    try {
      setError(null);
      await api.updateTransactionStatus(transactionId, status, notes);
      setSuccess('Transaction status updated successfully!');
      await loadTransactions();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Failed to update status:', error);
      setError(`Failed to update status: ${error.message}`);
    }
  };

  const handleProcessRefund = async (transactionId, refundData) => {
    try {
      setError(null);
      await api.refundTransaction(transactionId, refundData);
      setSuccess('Refund processed successfully!');
      await loadTransactions();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Failed to process refund:', error);
      setError(`Failed to process refund: ${error.message}`);
    }
  };

  const handleAnalyticsPeriodChange = (period) => {
    loadAnalytics(period);
  };

  // Calculate quick stats from current transactions
  const quickStats = React.useMemo(() => {
    const stats = {
      totalAmount: 0,
      completedCount: 0,
      pendingCount: 0,
      failedCount: 0,
    };

    transactions.forEach(transaction => {
      const amount = transaction.amount || transaction.total || transaction.totalAmount || 0;
      stats.totalAmount += amount;
      
      const status = transaction.status || 'pending';
      if (status === 'completed') stats.completedCount++;
      else if (status === 'pending') stats.pendingCount++;
      else if (status === 'failed') stats.failedCount++;
    });

    return stats;
  }, [transactions]);

  const canManageTransactions = ['admin', 'shop_manager', 'super_admin'].includes(userRole);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments & Transactions"
        subtitle="Monitor and manage payment transactions"
      >
        <div className="flex space-x-2">
          <Button
            variant={viewMode === 'analytics' ? 'primary' : 'outline'}
            onClick={() => setViewMode('analytics')}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
          <Button
            variant={viewMode === 'transactions' ? 'primary' : 'outline'}
            onClick={() => setViewMode('transactions')}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Transactions
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              loadTransactions();
              loadAnalytics();
            }}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </PageHeader>

      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(quickStats.totalAmount)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-lg font-semibold text-green-600">
                {quickStats.completedCount}
              </p>
            </div>
            <Badge variant="success" className="text-xs">
              Success
            </Badge>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-lg font-semibold text-yellow-600">
                {quickStats.pendingCount}
              </p>
            </div>
            <Badge variant="warning" className="text-xs">
              Pending
            </Badge>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Failed</p>
              <p className="text-lg font-semibold text-red-600">
                {quickStats.failedCount}
              </p>
            </div>
            <Badge variant="error" className="text-xs">
              Failed
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {viewMode === 'analytics' ? (
        <TransactionAnalytics
          analytics={analytics}
          loading={analyticsLoading}
          onPeriodChange={handleAnalyticsPeriodChange}
        />
      ) : (
        <>
          <TransactionFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
          />

          <TransactionList
            transactions={transactions}
            loading={loading}
            onView={handleViewTransaction}
            onEdit={canManageTransactions ? handleEditTransaction : null}
            onDownloadInvoice={handleDownloadInvoice}
            onRefund={canManageTransactions ? handleRefundTransaction : null}
            onCancel={canManageTransactions ? handleCancelTransaction : null}
          />

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center space-x-4">
              <Button
                variant="outline"
                disabled={pagination.currentPage === 1}
                onClick={() => handlePageChange(pagination.currentPage - 1)}
              >
                Previous
              </Button>
              
              <span className="text-sm text-gray-700">
                Page {pagination.currentPage} of {pagination.totalPages} 
                ({pagination.totalItems} total transactions)
              </span>
              
              <Button
                variant="outline"
                disabled={pagination.currentPage === pagination.totalPages}
                onClick={() => handlePageChange(pagination.currentPage + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <TransactionDetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedTransaction(null);
        }}
        transaction={selectedTransaction}
        onDownloadInvoice={handleDownloadInvoice}
      />

      {canManageTransactions && (
        <>
          <TransactionStatusModal
            isOpen={showStatusModal}
            onClose={() => {
              setShowStatusModal(false);
              setSelectedTransaction(null);
            }}
            transaction={selectedTransaction}
            onUpdateStatus={handleUpdateStatus}
          />

          <RefundModal
            isOpen={showRefundModal}
            onClose={() => {
              setShowRefundModal(false);
              setSelectedTransaction(null);
            }}
            transaction={selectedTransaction}
            onProcessRefund={handleProcessRefund}
          />
        </>
      )}

      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-50 p-3 rounded text-xs">
          <strong>Debug:</strong> 
          Transactions: {transactions.length} | 
          View: {viewMode} | 
          Filters: {JSON.stringify(filters)} | 
          Page: {pagination.currentPage}/{pagination.totalPages}
        </div>
      )}
    </div>
  );
};