// src/components/orders/OrderDetailsModal.jsx
import React from 'react';
import { Modal, Badge, Button } from '../ui';
import { formatCurrency, formatDate, getStatusVariant } from '../../utils';
import { 
  Package, 
  User, 
  CreditCard, 
  MapPin, 
  Calendar,
  DollarSign,
  Truck,
  Phone,
  Mail,
  Building2,
  Copy,
  ExternalLink,
  Download
} from 'lucide-react';

export const OrderDetailsModal = ({ 
  isOpen, 
  onClose, 
  order,
  onUpdateStatus,
  onAddTracking,
  onDownloadInvoice 
}) => {
  if (!order) return null;

  // Helper functions to extract order data consistently
  const getOrderId = () => order.id || order._id;
  
  const getOrderNumber = () => {
    return order.orderNumber || `ORD-${(getOrderId() || '').toString().slice(-6).toUpperCase()}`;
  };

  const getCustomerInfo = () => {
    if (order.customer && typeof order.customer === 'object') {
      return {
        name: order.customer.name || 'Unknown',
        email: order.customer.email || null,
        phone: order.customer.phone || null
      };
    }
    if (order.user) {
      return {
        name: order.user.name || 'Unknown',
        email: order.user.email || null,
        phone: order.user.phone || null
      };
    }
    return {
      name: order.customer || 'Unknown Customer',
      email: null,
      phone: null
    };
  };

  const getOrderItems = () => {
    return order.items || order.products || [];
  };

  const getShippingAddress = () => {
    if (!order.shippingAddress) return null;
    const addr = order.shippingAddress;
    return {
      street: addr.street,
      suburb: addr.suburb,
      city: addr.city,
      province: addr.province,
      country: addr.country || 'Zimbabwe',
      postalCode: addr.postalCode
    };
  };

  const getBranchInfo = () => {
    if (order.branch && typeof order.branch === 'object') {
      return {
        name: order.branch.name,
        phone: order.branch.phone,
        address: order.branch.address
      };
    }
    return null;
  };

  const getPaymentMethodDisplay = (method) => {
    const methodMap = {
      'card': 'Credit/Debit Card',
      'paynow': 'Paynow Mobile Payment',
      'bank_transfer': 'Bank Transfer',
      'cash_on_delivery': 'Cash on Delivery'
    };
    return methodMap[method] || method;
  };

  const getOrderTotals = () => {
    const items = getOrderItems();
    const subtotal = items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    return {
      subtotal: subtotal,
      shipping: order.shippingFee || 0,
      tax: order.tax || 0,
      total: order.total || order.totalAmount || subtotal
    };
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You might want to show a toast notification here
  };

  const customer = getCustomerInfo();
  const orderItems = getOrderItems();
  const shippingAddress = getShippingAddress();
  const branchInfo = getBranchInfo();
  const totals = getOrderTotals();
  const orderStatus = order.status || 'pending';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="xl"
    >
      <div className="max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
            <div className="flex items-center mt-2 space-x-4">
              <p className="text-sm text-gray-500 font-mono">
                {getOrderNumber()}
              </p>
              <Badge variant={getStatusVariant(orderStatus)} className="text-sm px-3 py-1">
                {orderStatus.toUpperCase()}
              </Badge>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(getOrderId())}
              title="Copy Order ID"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Order Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Order Items ({orderItems.length})
              </h3>
              
              {orderItems.length > 0 ? (
                <div className="space-y-4">
                  {orderItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between bg-white p-4 rounded border">
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center">
                          {item.image ? (
                            <img 
                              src={item.image} 
                              alt={item.name} 
                              className="h-12 w-12 object-cover rounded"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <Package className="h-6 w-6 text-gray-400" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {item.name || item.productName || 'Unknown Product'}
                          </h4>
                          <p className="text-sm text-gray-500">
                            SKU: {item.sku || item.productId || 'N/A'}
                          </p>
                          <p className="text-sm text-gray-500">
                            Qty: {item.quantity} × {formatCurrency(item.price, item.currency || 'USD')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(item.price * item.quantity, item.currency || 'USD')}
                        </p>
                        {item.currency === 'USD' && item.zwgPrice && (
                          <p className="text-sm text-gray-500">
                            ZWG {(item.zwgPrice * item.quantity).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No items found</p>
              )}
            </div>

            {/* Order Timeline */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Order Timeline
              </h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Order Created</p>
                    <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                  </div>
                </div>
                
                {order.processedAt && (
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Payment Processed</p>
                      <p className="text-xs text-gray-500">{formatDate(order.processedAt)}</p>
                    </div>
                  </div>
                )}
                
                {order.shippedAt && (
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Order Shipped</p>
                      <p className="text-xs text-gray-500">{formatDate(order.shippedAt)}</p>
                    </div>
                  </div>
                )}
                
                {order.deliveredAt && (
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Order Delivered</p>
                      <p className="text-xs text-gray-500">{formatDate(order.deliveredAt)}</p>
                    </div>
                  </div>
                )}
                
                {order.updatedAt && order.updatedAt !== order.createdAt && (
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-gray-400 rounded-full mr-3"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Last Updated</p>
                      <p className="text-xs text-gray-500">{formatDate(order.updatedAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tracking Information */}
            {order.tracking && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                  <Truck className="h-5 w-5 mr-2" />
                  Tracking Information
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-700">Carrier:</span>
                    <span className="font-medium text-blue-900">{order.tracking.carrier}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-700">Tracking Number:</span>
                    <div className="flex items-center">
                      <span className="font-mono text-blue-900">{order.tracking.trackingNumber}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(order.tracking.trackingNumber)}
                        className="ml-2 p-1"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  {order.tracking.estimatedDelivery && (
                    <div className="flex items-center justify-between">
                      <span className="text-blue-700">Estimated Delivery:</span>
                      <span className="font-medium text-blue-900">
                        {formatDate(order.tracking.estimatedDelivery)}
                      </span>
                    </div>
                  )}
                  {order.tracking.notes && (
                    <div className="mt-3 p-3 bg-blue-100 rounded">
                      <p className="text-blue-800 text-sm">{order.tracking.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Customer & Payment Info */}
          <div className="space-y-6">
            {/* Customer Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Customer Information
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium text-gray-900">{customer.name}</p>
                </div>
                {customer.email && (
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 text-gray-400 mr-2" />
                      <p className="font-medium text-gray-900">{customer.email}</p>
                    </div>
                  </div>
                )}
                {customer.phone && (
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 text-gray-400 mr-2" />
                      <p className="font-medium text-gray-900">{customer.phone}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Shipping Address */}
            {shippingAddress && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Shipping Address
                </h3>
                <div className="text-gray-700">
                  <p className="font-medium">{shippingAddress.street}</p>
                  {shippingAddress.suburb && <p>{shippingAddress.suburb}</p>}
                  <p>{shippingAddress.city}, {shippingAddress.province}</p>
                  <p>{shippingAddress.country}</p>
                  {shippingAddress.postalCode && <p>{shippingAddress.postalCode}</p>}
                </div>
              </div>
            )}

            {/* Branch Information */}
            {branchInfo && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Building2 className="h-5 w-5 mr-2" />
                  Branch
                </h3>
                <div className="space-y-2">
                  <p className="font-medium text-gray-900">{branchInfo.name}</p>
                  {branchInfo.phone && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 text-gray-400 mr-2" />
                      <p className="text-gray-700">{branchInfo.phone}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Payment Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Payment Details
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Method:</span>
                  <span className="font-medium text-gray-900">
                    {getPaymentMethodDisplay(order.paymentMethod)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Currency:</span>
                  <span className="font-medium text-gray-900">{order.currency || 'USD'}</span>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-green-900 mb-3 flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Order Summary
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-green-700">Subtotal:</span>
                  <span className="font-medium text-green-900">
                    {formatCurrency(totals.subtotal, order.currency)}
                  </span>
                </div>
                {totals.shipping > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-green-700">Shipping:</span>
                    <span className="font-medium text-green-900">
                      {formatCurrency(totals.shipping, order.currency)}
                    </span>
                  </div>
                )}
                {totals.tax > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-green-700">Tax:</span>
                    <span className="font-medium text-green-900">
                      {formatCurrency(totals.tax, order.currency)}
                    </span>
                  </div>
                )}
                <div className="border-t border-green-200 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-green-700 font-semibold">Total:</span>
                    <span className="font-bold text-green-900 text-lg">
                      {formatCurrency(totals.total, order.currency)}
                    </span>
                  </div>
                  {order.currency === 'USD' && order.zwgTotal && (
                    <div className="text-right">
                      <span className="text-green-700 text-sm">
                        ZWG {order.zwgTotal.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Notes */}
            {order.notes && (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">Order Notes</h3>
                <p className="text-yellow-800 text-sm whitespace-pre-wrap">{order.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex justify-end space-x-3 pt-6 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          
          {onUpdateStatus && !['delivered', 'cancelled'].includes(orderStatus) && (
            <Button onClick={() => onUpdateStatus(order)}>
              Update Status
            </Button>
          )}
          
          {onAddTracking && ['processing', 'shipped'].includes(orderStatus) && (
            <Button variant="outline" onClick={() => onAddTracking(order)}>
              <Truck className="h-4 w-4 mr-2" />
              Add Tracking
            </Button>
          )}
          
          {onDownloadInvoice && ['delivered', 'shipped'].includes(orderStatus) && (
            <Button variant="outline" onClick={() => onDownloadInvoice(getOrderId())}>
              <Download className="h-4 w-4 mr-2" />
              Download Invoice
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};