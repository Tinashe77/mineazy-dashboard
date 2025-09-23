// src/components/orders/OrderStatusModal.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Select, Textarea, Button, Badge, Alert } from '../ui';
import { getStatusVariant, formatDate } from '../../utils';
import { 
  Clock, 
  CheckCircle, 
  Package, 
  Truck, 
  AlertTriangle,
  User,
  Calendar
} from 'lucide-react';

export const OrderStatusModal = ({ 
  isOpen, 
  onClose, 
  order, 
  onUpdateStatus,
  loading = false 
}) => {
  const [formData, setFormData] = useState({
    status: '',
    notes: '',
    notifyCustomer: true,
    estimatedDelivery: ''
  });
  const [error, setError] = useState(null);

  const statusOptions = [
    { 
      value: 'pending', 
      label: 'Pending',
      icon: Clock,
      description: 'Order received, awaiting processing',
      color: 'text-yellow-600'
    },
    { 
      value: 'processing', 
      label: 'Processing',
      icon: Package,
      description: 'Order is being prepared',
      color: 'text-blue-600'
    },
    { 
      value: 'shipped', 
      label: 'Shipped',
      icon: Truck,
      description: 'Order has been shipped to customer',
      color: 'text-purple-600'
    },
    { 
      value: 'delivered', 
      label: 'Delivered',
      icon: CheckCircle,
      description: 'Order successfully delivered',
      color: 'text-green-600'
    },
    { 
      value: 'cancelled', 
      label: 'Cancelled',
      icon: AlertTriangle,
      description: 'Order has been cancelled',
      color: 'text-red-600'
    }
  ];

  useEffect(() => {
    if (order && isOpen) {
      setFormData({
        status: order.status || 'pending',
        notes: '',
        notifyCustomer: true,
        estimatedDelivery: ''
      });
      setError(null);
    }
  }, [order, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.status) {
      setError('Status is required');
      return;
    }

    try {
      await onUpdateStatus(
        order.id || order._id, 
        formData.status, 
        formData.notes,
        {
          notifyCustomer: formData.notifyCustomer,
          estimatedDelivery: formData.estimatedDelivery
        }
      );
      onClose();
    } catch (error) {
      setError(error.message || 'Failed to update order status');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const canTransitionTo = (newStatus) => {
    const currentStatus = order?.status || 'pending';
    
    const transitions = {
      'pending': ['processing', 'cancelled'],
      'processing': ['shipped', 'cancelled'],
      'shipped': ['delivered', 'cancelled'],
      'delivered': [],
      'cancelled': []
    };

    return transitions[currentStatus]?.includes(newStatus) || false;
  };

  const selectedStatusOption = statusOptions.find(opt => opt.value === formData.status);

  if (!order) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Update Order Status"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Current Order Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">Order Information</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Order Number:</span>
              <span className="font-mono">
                {order.orderNumber || `ORD-${(order.id || order._id || '').toString().slice(-6).toUpperCase()}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Customer:</span>
              <span>{order.customer || order.user?.name || 'Unknown'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Current Status:</span>
              <Badge variant={getStatusVariant(order.status)}>
                {order.status || 'pending'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Created:</span>
              <span>{formatDate(order.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Status Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            New Status *
          </label>
          <Select
            value={formData.status}
            onChange={(e) => handleInputChange('status', e.target.value)}
            className="w-full"
          >
            {statusOptions.map(option => {
              const canTransition = canTransitionTo(option.value);
              const isCurrentStatus = option.value === order.status;
              
              return (
                <option 
                  key={option.value} 
                  value={option.value}
                  disabled={!canTransition && !isCurrentStatus}
                >
                  {option.label} {!canTransition && !isCurrentStatus ? '(Not Available)' : ''}
                </option>
              );
            })}
          </Select>
          
          {selectedStatusOption && (
            <div className="mt-2 p-3 bg-blue-50 rounded-lg flex items-center">
              <selectedStatusOption.icon className={`h-5 w-5 mr-3 ${selectedStatusOption.color}`} />
              <div>
                <p className="text-sm font-medium text-blue-900">{selectedStatusOption.label}</p>
                <p className="text-xs text-blue-700">{selectedStatusOption.description}</p>
              </div>
            </div>
          )}
        </div>

        {/* Status Notes */}
        <Textarea
          label="Status Update Notes"
          rows={3}
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          placeholder="Add any notes about this status update..."
        />

        {/* Estimated Delivery (only for shipped status) */}
        {formData.status === 'shipped' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estimated Delivery Date
            </label>
            <input
              type="date"
              value={formData.estimatedDelivery}
              onChange={(e) => handleInputChange('estimatedDelivery', e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        )}

        {/* Customer Notification */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="notifyCustomer"
            checked={formData.notifyCustomer}
            onChange={(e) => handleInputChange('notifyCustomer', e.target.checked)}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label htmlFor="notifyCustomer" className="ml-2 block text-sm text-gray-900">
            Send notification email to customer
          </label>
        </div>

        {/* Warning for irreversible actions */}
        {['delivered', 'cancelled'].includes(formData.status) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Warning: Irreversible Action
                </h3>
                <p className="mt-1 text-sm text-yellow-700">
                  {formData.status === 'delivered' 
                    ? 'Marking this order as delivered cannot be undone.'
                    : 'Cancelling this order cannot be undone and may trigger refund processes.'
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
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

// Order Tracking Modal Component
export const OrderTrackingModal = ({ 
  isOpen, 
  onClose, 
  order, 
  onAddTracking,
  loading = false 
}) => {
  const [formData, setFormData] = useState({
    carrier: '',
    trackingNumber: '',
    status: 'shipped',
    estimatedDelivery: '',
    notes: '',
    currentLocation: ''
  });
  const [error, setError] = useState(null);

  const carrierOptions = [
    { value: 'DHL', label: 'DHL Express' },
    { value: 'FedEx', label: 'FedEx' },
    { value: 'UPS', label: 'UPS' },
    { value: 'ZIMPOST', label: 'Zimbabwe Post' },
    { value: 'COURIER_CONNECT', label: 'Courier Connect' },
    { value: 'LOCAL_DELIVERY', label: 'Local Delivery' },
    { value: 'OTHER', label: 'Other' }
  ];

  const trackingStatuses = [
    { value: 'shipped', label: 'Shipped' },
    { value: 'in_transit', label: 'In Transit' },
    { value: 'out_for_delivery', label: 'Out for Delivery' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'exception', label: 'Exception' }
  ];

  useEffect(() => {
    if (order && isOpen) {
      if (order.tracking) {
        setFormData({
          carrier: order.tracking.carrier || '',
          trackingNumber: order.tracking.trackingNumber || '',
          status: order.tracking.status || 'shipped',
          estimatedDelivery: order.tracking.estimatedDelivery || '',
          notes: order.tracking.notes || '',
          currentLocation: order.tracking.currentLocation || ''
        });
      } else {
        setFormData({
          carrier: '',
          trackingNumber: '',
          status: 'shipped',
          estimatedDelivery: '',
          notes: '',
          currentLocation: ''
        });
      }
      setError(null);
    }
  }, [order, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.carrier || !formData.trackingNumber) {
      setError('Carrier and tracking number are required');
      return;
    }

    try {
      await onAddTracking(order.id || order._id, formData);
      onClose();
    } catch (error) {
      setError(error.message || 'Failed to add tracking information');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!order) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Tracking Information"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Order Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Order Information</h4>
          <div className="text-sm text-gray-600">
            Order: {order.orderNumber || `ORD-${(order.id || order._id || '').toString().slice(-6).toUpperCase()}`}
          </div>
        </div>

        {/* Carrier Selection */}
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Shipping Carrier *"
            value={formData.carrier}
            onChange={(e) => handleInputChange('carrier', e.target.value)}
          >
            <option value="">Select Carrier</option>
            {carrierOptions.map(carrier => (
              <option key={carrier.value} value={carrier.value}>
                {carrier.label}
              </option>
            ))}
          </Select>

          <Select
            label="Tracking Status *"
            value={formData.status}
            onChange={(e) => handleInputChange('status', e.target.value)}
          >
            {trackingStatuses.map(status => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </Select>
        </div>

        {/* Tracking Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tracking Number *
          </label>
          <input
            type="text"
            value={formData.trackingNumber}
            onChange={(e) => handleInputChange('trackingNumber', e.target.value)}
            placeholder="Enter tracking number"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          />
        </div>

        {/* Current Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Current Location
          </label>
          <input
            type="text"
            value={formData.currentLocation}
            onChange={(e) => handleInputChange('currentLocation', e.target.value)}
            placeholder="e.g., Harare Distribution Center"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          />
        </div>

        {/* Estimated Delivery */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estimated Delivery Date
          </label>
          <input
            type="date"
            value={formData.estimatedDelivery}
            onChange={(e) => handleInputChange('estimatedDelivery', e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        {/* Notes */}
        <Textarea
          label="Tracking Notes"
          rows={3}
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          placeholder="Any additional tracking information..."
        />

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
          >
            {order.tracking ? 'Update Tracking' : 'Add Tracking'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};