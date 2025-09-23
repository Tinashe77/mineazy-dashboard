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
import { Button, Alert, Badge, Card, CardContent } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../utils';
import { 
  RefreshCw, 
  BarChart3,
  CreditCard,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  RotateCcw
} from 'lucide-react';
import api from '../services/api';

export const PaymentsPage = () => {
  const { userRole } = useAuth();
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
  const [viewMode, setViewMode] = useState('transactions');
  
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

  // Quick stats
  const [quickStats, setQuickStats] = useState({
    totalAmount: 0,
    completedCount: 0,
    pendingCount: 0,
    failedCount: 0,
    refundedCount: 0,
    successRate: 0
  });

  const [filterTimeout, setFilterTimeout] = useState(null);

  const loadTransactions = useCallback(async (newFilters = null, page = null) => {
    try {
      setLoading(true);
      setError(null);
      
      const currentFilters = newFilters || filters;
      const currentPage = page || pagination.currentPage;
      
      const params = {
        page: currentPage,
        limit: 20,
      };

      // Add filters to params
      if (currentFilters.search && currentFilters.search.trim()) {
        params.search = currentFilters.search.trim();
      }
      if (currentFilters.status) params.status = currentFilters.status;
      if (currentFilters.method) params.paymentMethod = currentFilters.method;
      if (currentFilters.minAmount) params.minAmount = parseFloat(currentFilters.minAmount);
      if (currentFilters.maxAmount) params.maxAmount = parseFloat(currentFilters.maxAmount);
      if (currentFilters.startDate) params.startDate = currentFilters.startDate;
      if (currentFilters.endDate) params.endDate = currentFilters.endDate;
      
      // Use appropriate endpoint based on user role
      const response = userRole === 'customer' 
        ? await api.getUserTransactions(params)
        : await api.getTransactions(params);
      
      let transactionsData = [];
      let paginationData = {};
      
      if (Array.isArray(response)) {
        transactionsData = response;
        paginationData = { currentPage: 1, totalPages: 1, totalItems: response.length };
      } else if (response.data && Array.isArray(response.data.transactions)) {
        transactionsData = response.data.transactions;
        paginationData = response.data.pagination || {};
      } else if (response.data && Array.isArray(response.data)) {
        transactionsData = response.data;
        paginationData = { currentPage: response.page || 1, totalPages: response.totalPages || 1, totalItems: response.total || response.data.length };
      }
      
      setTransactions(transactionsData);
      setPagination(paginationData);
      calculateQuickStats(transactionsData);
      
    } catch (error) {
      console.error('Failed to load transactions:', error);
      setError(`Failed to load transactions: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.currentPage, userRole]);

  const calculateQuickStats = useCallback((transactionsData) => {
    const stats = {
      totalAmount: 0,
      completedCount: 0,
      pendingCount: 0,
      failedCount: 0,
      refundedCount: 0,
      successRate: 0
    };

    transactionsData.forEach(transaction => {
      const amount = transaction.amount || 0;
      stats.totalAmount += amount;
      
      const status = transaction.status || 'pending';
      if (status === 'completed') stats.completedCount++;
      else if (status === 'pending') stats.pendingCount++;
      else if (status === 'failed') stats.failedCount++;
      else if (status === 'refunded') stats.refundedCount++;
    });

    const totalProcessed = stats.completedCount + stats.failedCount;
    stats.successRate = totalProcessed > 0 ? Math.round((stats.completedCount / totalProcessed) * 100) : 0;

    setQuickStats(stats);
  }, []);

  const loadAnalytics = useCallback(async (period = 'month') => {
    try {
      setAnalyticsLoading(true);
      const params = { period };
      const response = await api.getTransactionAnalytics(params);
      setAnalytics(response.data || response);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      setAnalytics(null);
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTransactions();
    loadAnalytics();
  }, []);

  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters);
    
    if (filterTimeout) clearTimeout(filterTimeout);
    
    const timeout = setTimeout(() => {
      setPagination(prev => ({ ...prev, currentPage: 1 }));
      loadTransactions(newFilters, 1);
    }, 500);
    
    setFilterTimeout(timeout);
  }, [filterTimeout, loadTransactions]);

  const handleClearFilters = useCallback(() => {
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

  const handlePageChange = useCallback((newPage) => {
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
    if (!confirm('Are you sure you want to cancel this transaction?')) return;

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

  const canManageTransactions = ['admin', 'shop_manager', 'super_admin'].includes(userRole);

  const statCards = [
    {
      title: 'Total Amount',
      value: formatCurrency(quickStats.totalAmount),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Completed',
      value: quickStats.completedCount,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Pending',
      value: quickStats.pendingCount,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      title: 'Failed',
      value: quickStats.failedCount,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    }
  ];

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

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-md ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Success Rate Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Success Rate</h3>
              <p className="text-3xl font-bold text-green-600">{quickStats.successRate}%</p>
              <p className="text-sm text-gray-500">
                {quickStats.completedCount} completed out of {quickStats.completedCount + quickStats.failedCount} processed
              </p>
            </div>
            <div className="text-right">
              <Badge variant={quickStats.successRate >= 95 ? 'success' : quickStats.successRate >= 80 ? 'warning' : 'error'}>
                {quickStats.successRate >= 95 ? 'Excellent' : quickStats.successRate >= 80 ? 'Good' : 'Needs Attention'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

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
    </div>
  );
};