// src/components/transactions/TransactionStatusModal.jsx
import React, { useState } from 'react';
import { Modal, Select, Textarea, Button, Badge } from '../ui';
import { getStatusVariant } from '../../utils';

export const TransactionStatusModal = ({ 
  isOpen, 
  onClose, 
  transaction, 
  onUpdateStatus,
  loading = false 
}) => {
  const [formData, setFormData] = useState({
    status: transaction?.status || 'pending',
    notes: '',
  });

  const statusOptions = [
    { value: 'pending', label: 'Pending', description: 'Transaction is awaiting processing' },
    { value: 'processing', label: 'Processing', description: 'Payment is being processed' },
    { value: 'completed', label: 'Completed', description: 'Transaction completed successfully' },
    { value: 'failed', label: 'Failed', description: 'Transaction failed to process' },
    { value: 'cancelled', label: 'Cancelled', description: 'Transaction was cancelled' },
    { value: 'refunded', label: 'Refunded', description: 'Transaction has been refunded' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onUpdateStatus(transaction.id || transaction._id, formData.status, formData.notes);
      onClose();
    } catch (error) {
      console.error('Failed to update transaction status:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!transaction) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Update Transaction Status"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Current Transaction Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Transaction Information</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Transaction ID:</span>
              <span className="font-mono">
                #{(transaction.id || transaction._id || '').toString().slice(-8).toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Current Status:</span>
              <Badge variant={getStatusVariant(transaction.status)}>
                {transaction.status}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Amount:</span>
              <span>${(transaction.amount || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Status Selection */}
        <div>
          <Select
            label="New Status"
            required
            value={formData.status}
            onChange={(e) => handleInputChange('status', e.target.value)}
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <p className="text-sm text-gray-500 mt-1">
            {statusOptions.find(opt => opt.value === formData.status)?.description}
          </p>
        </div>

        {/* Notes */}
        <Textarea
          label="Status Update Notes"
          rows={3}
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          placeholder="Add any notes about this status update..."
        />

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
          >
            Update Status
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// src/components/transactions/RefundModal.jsx
export const RefundModal = ({ 
  isOpen, 
  onClose, 
  transaction, 
  onProcessRefund,
  loading = false 
}) => {
  const [formData, setFormData] = useState({
    amount: transaction?.amount || 0,
    reason: '',
    refundMethod: 'original_payment_method',
  });

  const refundMethods = [
    { value: 'original_payment_method', label: 'Original Payment Method' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'store_credit', label: 'Store Credit' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onProcessRefund(transaction.id || transaction._id, formData);
      onClose();
    } catch (error) {
      console.error('Failed to process refund:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!transaction) return null;

  const maxRefundAmount = transaction.amount || 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Process Refund"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Transaction Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Transaction Information</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Transaction ID:</span>
              <span className="font-mono">
                #{(transaction.id || transaction._id || '').toString().slice(-8).toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Original Amount:</span>
              <span className="font-semibold">${maxRefundAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Method:</span>
              <span>{transaction.paymentMethod || 'Unknown'}</span>
            </div>
          </div>
        </div>

        {/* Refund Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Refund Amount *
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            max={maxRefundAmount}
            required
            value={formData.amount}
            onChange={(e) => handleInputChange('amount', parseFloat(e.target.value))}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          />
          <p className="text-sm text-gray-500 mt-1">
            Maximum refund amount: ${maxRefundAmount.toLocaleString()}
          </p>
        </div>

        {/* Refund Method */}
        <Select
          label="Refund Method"
          required
          value={formData.refundMethod}
          onChange={(e) => handleInputChange('refundMethod', e.target.value)}
        >
          {refundMethods.map(method => (
            <option key={method.value} value={method.value}>
              {method.label}
            </option>
          ))}
        </Select>

        {/* Refund Reason */}
        <Textarea
          label="Refund Reason"
          required
          rows={3}
          value={formData.reason}
          onChange={(e) => handleInputChange('reason', e.target.value)}
          placeholder="Please provide a reason for this refund..."
        />

        {/* Warning */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Refund Processing
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  This action will process a refund for ${formData.amount.toLocaleString()}. 
                  This action cannot be undone. Please ensure all details are correct.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
            variant="danger"
          >
            Process Refund
          </Button>
        </div>
      </form>
    </Modal>
  );
};