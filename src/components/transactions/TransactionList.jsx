// src/components/transactions/TransactionList.jsx
import React, { useState } from 'react';
import { Button, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui';
import { formatCurrency, formatDate, getStatusVariant } from '../../utils';
import { 
  Eye, 
  Edit, 
  Download, 
  CreditCard, 
  Smartphone, 
  Building,
  DollarSign,
  RotateCcw,
  X
} from 'lucide-react';

export const TransactionList = ({ 
  transactions, 
  loading, 
  onView, 
  onEdit,
  onDownloadInvoice,
  onRefund,
  onCancel
}) => {
  const [selectedTransactions, setSelectedTransactions] = useState([]);

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedTransactions(transactions.map(t => t.id || t._id));
    } else {
      setSelectedTransactions([]);
    }
  };

  const handleSelectTransaction = (transactionId, checked) => {
    if (checked) {
      setSelectedTransactions(prev => [...prev, transactionId]);
    } else {
      setSelectedTransactions(prev => prev.filter(id => id !== transactionId));
    }
  };

  const handleBulkCancel = () => {
    if (selectedTransactions.length === 0) return;
    
    if (confirm(`Cancel ${selectedTransactions.length} selected transactions?`)) {
      selectedTransactions.forEach(id => onCancel && onCancel(id));
      setSelectedTransactions([]);
    }
  };

  // Helper function to get payment method icon
  const getPaymentMethodIcon = (method) => {
    switch (method?.toLowerCase()) {
      case 'paynow':
        return <Smartphone className="h-4 w-4" />;
      case 'ecocash':
        return <Smartphone className="h-4 w-4" />;
      case 'onemoney':
        return <Smartphone className="h-4 w-4" />;
      case 'zipit':
        return <Smartphone className="h-4 w-4" />;
      case 'card':
        return <CreditCard className="h-4 w-4" />;
      case 'cash':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  // Helper function to format payment method display name
  const getPaymentMethodName = (method) => {
    const methodMap = {
      'paynow': 'Paynow',
      'ecocash': 'EcoCash',
      'onemoney': 'OneMoney',
      'zipit': 'ZipIt',
      'card': 'Card',
      'cash': 'Cash'
    };
    return methodMap[method?.toLowerCase()] || method;
  };

  // Helper function to get transaction amount
  const getTransactionAmount = (transaction) => {
    return transaction.amount || transaction.total || transaction.totalAmount || 0;
  };

  // Helper function to get transaction status
  const getTransactionStatus = (transaction) => {
    return transaction.status || 'pending';
  };

  // Helper function to get customer info
  const getCustomerInfo = (transaction) => {
    if (transaction.customer) return transaction.customer;
    if (transaction.user?.name) return transaction.user.name;
    if (transaction.user?.email) return transaction.user.email;
    if (transaction.order?.customer) return transaction.order.customer;
    return 'Unknown Customer';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Bulk actions */}
      {selectedTransactions.length > 0 && (
        <div className="bg-primary-50 px-6 py-3 border-b">
          <div className="flex items-center justify-between">
            <span className="text-sm text-primary-700">
              {selectedTransactions.length} transaction(s) selected
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
                checked={selectedTransactions.length === transactions.length && transactions.length > 0}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
            </TableHead>
            <TableHead>Transaction</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Payment Method</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => {
            const transactionId = transaction.id || transaction._id;
            const isSelected = selectedTransactions.includes(transactionId);
            const amount = getTransactionAmount(transaction);
            const status = getTransactionStatus(transaction);
            const paymentMethod = transaction.paymentMethod || transaction.method;
            
            return (
              <TableRow key={transactionId}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => handleSelectTransaction(transactionId, e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                </TableCell>
                <TableCell>
                  <div>
                    <div className="text-sm font-medium text-gray-900 font-mono">
                      #{(transactionId || '').toString().slice(-8).toUpperCase()}
                    </div>
                    {transaction.reference && (
                      <div className="text-sm text-gray-500">
                        Ref: {transaction.reference}
                      </div>
                    )}
                    {transaction.orderId && (
                      <div className="text-xs text-gray-400">
                        Order: {transaction.orderId.toString().slice(-6).toUpperCase()}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-gray-900">
                    {getCustomerInfo(transaction)}
                  </div>
                  {transaction.paymentDetails?.phone && (
                    <div className="text-sm text-gray-500">
                      {transaction.paymentDetails.phone}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">
                      {formatCurrency(amount, transaction.currency || 'USD')}
                    </div>
                    {transaction.currency === 'USD' && transaction.zwgAmount && (
                      <div className="text-gray-500 text-xs">
                        ZWG {transaction.zwgAmount.toLocaleString()}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    {getPaymentMethodIcon(paymentMethod)}
                    <span className="ml-2 text-sm text-gray-900">
                      {getPaymentMethodName(paymentMethod)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(status)}>
                    {status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-gray-900">
                    {formatDate(transaction.createdAt || transaction.date)}
                  </div>
                  {transaction.updatedAt && transaction.updatedAt !== transaction.createdAt && (
                    <div className="text-xs text-gray-500">
                      Updated: {formatDate(transaction.updatedAt)}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {onView && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(transaction)}
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {onEdit && status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(transaction)}
                        title="Update Status"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {onDownloadInvoice && status === 'completed' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDownloadInvoice(transactionId)}
                        title="Download Invoice"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {onRefund && status === 'completed' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRefund(transaction)}
                        title="Process Refund"
                      >
                        <RotateCcw className="h-4 w-4 text-orange-500" />
                      </Button>
                    )}
                    
                    {onCancel && ['pending', 'processing'].includes(status) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onCancel(transactionId)}
                        title="Cancel Transaction"
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

      {transactions.length === 0 && (
        <div className="text-center py-12">
          <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions</h3>
          <p className="mt-1 text-sm text-gray-500">
            No payment transactions found matching your criteria.
          </p>
        </div>
      )}
    </div>
  );
};