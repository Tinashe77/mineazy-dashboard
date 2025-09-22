// src/components/transactions/TransactionDetailsModal.jsx
import React from 'react';
import { Modal, Badge, Button } from '../ui';
import { formatCurrency, formatDate, getStatusVariant } from '../../utils';
import { 
  CreditCard, 
  Smartphone, 
  Building, 
  DollarSign, 
  Download,
  Copy,
  ExternalLink
} from 'lucide-react';

export const TransactionDetailsModal = ({ 
  isOpen, 
  onClose, 
  transaction,
  onDownloadInvoice 
}) => {
  if (!transaction) return null;

  // Helper function to get payment method icon
  const getPaymentMethodIcon = (method) => {
    switch (method?.toLowerCase()) {
      case 'paynow':
        return <Smartphone className="h-5 w-5 text-blue-600" />;
      case 'card':
      case 'credit_card':
      case 'debit_card':
        return <CreditCard className="h-5 w-5 text-green-600" />;
      case 'bank_transfer':
        return <Building className="h-5 w-5 text-purple-600" />;
      case 'cash_on_delivery':
      case 'cash':
        return <DollarSign className="h-5 w-5 text-yellow-600" />;
      default:
        return <CreditCard className="h-5 w-5 text-gray-600" />;
    }
  };

  const getPaymentMethodName = (method) => {
    const methodMap = {
      'paynow': 'Paynow Mobile Payment',
      'card': 'Credit/Debit Card',
      'credit_card': 'Credit Card',
      'debit_card': 'Debit Card',
      'bank_transfer': 'Bank Transfer',
      'cash_on_delivery': 'Cash on Delivery',
      'cash': 'Cash Payment'
    };
    return methodMap[method?.toLowerCase()] || method;
  };

  const getCustomerInfo = (transaction) => {
    if (transaction.customer) return transaction.customer;
    if (transaction.user?.name) return transaction.user.name;
    if (transaction.user?.email) return transaction.user.email;
    if (transaction.order?.customer) return transaction.order.customer;
    return 'Unknown Customer';
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You might want to show a toast notification here
  };

  const transactionId = transaction.id || transaction._id;
  const amount = transaction.amount || transaction.total || transaction.totalAmount || 0;
  const status = transaction.status || 'pending';
  const paymentMethod = transaction.paymentMethod || transaction.method;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="lg"
    >
      <div className="max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Transaction Details</h2>
            <p className="text-sm text-gray-500 mt-1 font-mono">
              ID: #{(transactionId || '').toString().slice(-8).toUpperCase()}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={getStatusVariant(status)} className="text-sm px-3 py-1">
              {status.toUpperCase()}
            </Badge>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Transaction Info */}
          <div className="space-y-6">
            {/* Payment Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                {getPaymentMethodIcon(paymentMethod)}
                <span className="ml-2">Payment Information</span>
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-semibold text-green-600 text-lg">
                    {formatCurrency(amount, transaction.currency || 'USD')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Method:</span>
                  <span className="font-medium">{getPaymentMethodName(paymentMethod)}</span>
                </div>
                {transaction.currency === 'USD' && transaction.zwgAmount && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">ZWG Amount:</span>
                    <span className="font-medium">ZWG {transaction.zwgAmount.toLocaleString()}</span>
                  </div>
                )}
                {transaction.reference && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Reference:</span>
                    <div className="flex items-center">
                      <span className="font-mono text-sm">{transaction.reference}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(transaction.reference)}
                        className="ml-2 p-1"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Transaction Timeline */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Transaction Timeline</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Transaction Created</p>
                    <p className="text-xs text-gray-500">{formatDate(transaction.createdAt)}</p>
                  </div>
                </div>
                {transaction.processedAt && (
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Payment Processed</p>
                      <p className="text-xs text-gray-500">{formatDate(transaction.processedAt)}</p>
                    </div>
                  </div>
                )}
                {transaction.completedAt && (
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Transaction Completed</p>
                      <p className="text-xs text-gray-500">{formatDate(transaction.completedAt)}</p>
                    </div>
                  </div>
                )}
                {transaction.updatedAt && transaction.updatedAt !== transaction.createdAt && (
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-gray-400 rounded-full mr-3"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Last Updated</p>
                      <p className="text-xs text-gray-500">{formatDate(transaction.updatedAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Details */}
            {transaction.paymentDetails && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Payment Details</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  {transaction.paymentDetails.phone && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium">{transaction.paymentDetails.phone}</span>
                    </div>
                  )}
                  {transaction.paymentDetails.cardLast4 && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Card:</span>
                      <span className="font-medium">**** **** **** {transaction.paymentDetails.cardLast4}</span>
                    </div>
                  )}
                  {transaction.paymentDetails.bankName && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Bank:</span>
                      <span className="font-medium">{transaction.paymentDetails.bankName}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Order & Customer Info */}
          <div className="space-y-6">
            {/* Customer Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Customer Information</h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">{getCustomerInfo(transaction)}</span>
                </div>
                {transaction.user?.email && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{transaction.user.email}</span>
                  </div>
                )}
                {transaction.user?.phone && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium">{transaction.user.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Order Information */}
            {transaction.orderId && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Information</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Order ID:</span>
                    <div className="flex items-center">
                      <span className="font-mono text-sm">
                        #{transaction.orderId.toString().slice(-8).toUpperCase()}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-2 p-1"
                        title="View Order"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  {transaction.order?.items && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Items:</span>
                      <span className="font-medium">{transaction.order.items.length} item(s)</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Transaction Notes */}
            {transaction.notes && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Notes</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700">{transaction.notes}</p>
                </div>
              </div>
            )}

            {/* Additional Information */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Transaction Details</h3>
              <div className="text-sm text-blue-800 space-y-1">
                <div>Transaction ID: {transactionId}</div>
                <div>Created: {formatDate(transaction.createdAt)}</div>
                {transaction.gateway && (
                  <div>Payment Gateway: {transaction.gateway}</div>
                )}
                {transaction.merchantId && (
                  <div>Merchant ID: {transaction.merchantId}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex justify-end space-x-3 pt-6 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {status === 'completed' && onDownloadInvoice && (
            <Button onClick={() => onDownloadInvoice(transactionId)}>
              <Download className="h-4 w-4 mr-2" />
              Download Invoice
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};