// src/components/orders/OrderCreateModal.jsx - Create new orders
import React, { useState, useEffect } from 'react';
import { Modal, Input, Select, Textarea, Button, Badge, Alert } from '../ui';
import { formatCurrency } from '../../utils';
import { 
  Plus, 
  Minus, 
  Search, 
  User, 
  Package,
  CreditCard,
  MapPin,
  X,
  Calculator
} from 'lucide-react';
import api from '../../services/api';

export const OrderCreateModal = ({ 
  isOpen, 
  onClose, 
  onCreateOrder,
  loading = false 
}) => {
  const [formData, setFormData] = useState({
    // Customer Information
    customer: {
      name: '',
      email: '',
      phone: '',
      isExisting: false,
      selectedCustomerId: ''
    },
    // Order Items
    items: [],
    // Shipping Address
    shippingAddress: {
      street: '',
      suburb: '',
      city: '',
      province: 'Harare',
      country: 'Zimbabwe',
      postalCode: ''
    },
    // Payment & Branch
    paymentMethod: 'card',
    branchId: '',
    currency: 'USD',
    notes: ''
  });

  const [searchStates, setSearchStates] = useState({
    customers: { query: '', results: [], loading: false },
    products: { query: '', results: [], loading: false }
  });

  const [calculations, setCalculations] = useState({
    subtotal: 0,
    tax: 0,
    shipping: 0,
    total: 0
  });

  const [branches, setBranches] = useState([]);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(1); // Multi-step form

  const zimbabweProvinces = [
    'Harare', 'Bulawayo', 'Manicaland', 'Mashonaland Central',
    'Mashonaland East', 'Mashonaland West', 'Masvingo',
    'Matabeleland North', 'Matabeleland South', 'Midlands'
  ];

  const paymentMethods = [
    { value: 'card', label: 'Credit/Debit Card', icon: CreditCard },
    { value: 'paynow', label: 'Paynow Mobile Payment', icon: CreditCard },
    { value: 'bank_transfer', label: 'Bank Transfer', icon: CreditCard },
    { value: 'cash_on_delivery', label: 'Cash on Delivery', icon: CreditCard }
  ];

  useEffect(() => {
    if (isOpen) {
      loadBranches();
      resetForm();
    }
  }, [isOpen]);

  useEffect(() => {
    calculateTotals();
  }, [formData.items, formData.currency]);

  const loadBranches = async () => {
    try {
      const response = await api.getBranches();
      setBranches(response.data || []);
    } catch (error) {
      console.error('Failed to load branches:', error);
    }
  };

  const searchCustomers = async (query) => {
    if (!query.trim()) {
      setSearchStates(prev => ({
        ...prev,
        customers: { ...prev.customers, results: [], loading: false }
      }));
      return;
    }

    setSearchStates(prev => ({
      ...prev,
      customers: { ...prev.customers, loading: true }
    }));

    try {
      const response = await api.getUsers({ search: query, role: 'customer', limit: 10 });
      const customers = response.data || [];
      
      setSearchStates(prev => ({
        ...prev,
        customers: { 
          query, 
          results: customers, 
          loading: false 
        }
      }));
    } catch (error) {
      console.error('Failed to search customers:', error);
      setSearchStates(prev => ({
        ...prev,
        customers: { ...prev.customers, loading: false }
      }));
    }
  };

  const searchProducts = async (query) => {
    if (!query.trim()) {
      setSearchStates(prev => ({
        ...prev,
        products: { ...prev.products, results: [], loading: false }
      }));
      return;
    }

    setSearchStates(prev => ({
      ...prev,
      products: { ...prev.products, loading: true }
    }));

    try {
      const response = await api.getProducts({ search: query, isActive: true, limit: 10 });
      const products = response.data || response || [];
      
      setSearchStates(prev => ({
        ...prev,
        products: { 
          query, 
          results: products, 
          loading: false 
        }
      }));
    } catch (error) {
      console.error('Failed to search products:', error);
      setSearchStates(prev => ({
        ...prev,
        products: { ...prev.products, loading: false }
      }));
    }
  };

  const selectCustomer = (customer) => {
    setFormData(prev => ({
      ...prev,
      customer: {
        ...prev.customer,
        name: customer.name,
        email: customer.email,
        phone: customer.phone || '',
        isExisting: true,
        selectedCustomerId: customer.id || customer._id
      }
    }));
    
    setSearchStates(prev => ({
      ...prev,
      customers: { ...prev.customers, results: [] }
    }));
  };

  const addProductToOrder = (product) => {
    const existingItemIndex = formData.items.findIndex(
      item => item.productId === (product.id || product._id)
    );

    if (existingItemIndex >= 0) {
      // Increase quantity if product already exists
      updateItemQuantity(existingItemIndex, formData.items[existingItemIndex].quantity + 1);
    } else {
      // Add new item
      const price = product.price?.regular_price || product.regular_price || product.price || 0;
      const newItem = {
        productId: product.id || product._id,
        name: product.name,
        sku: product.sku,
        price: price,
        quantity: 1,
        currency: formData.currency
      };

      setFormData(prev => ({
        ...prev,
        items: [...prev.items, newItem]
      }));
    }

    setSearchStates(prev => ({
      ...prev,
      products: { ...prev.products, results: [] }
    }));
  };

  const updateItemQuantity = (index, quantity) => {
    if (quantity <= 0) {
      removeItem(index);
      return;
    }

    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, quantity } : item
      )
    }));
  };

  const updateItemPrice = (index, price) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, price: parseFloat(price) || 0 } : item
      )
    }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => 
      sum + (item.price * item.quantity), 0
    );
    
    const tax = subtotal * 0.15; // 15% VAT for Zimbabwe
    const shipping = subtotal > 1000 ? 0 : 50; // Free shipping over $1000
    const total = subtotal + tax + shipping;

    setCalculations({
      subtotal,
      tax,
      shipping,
      total
    });
  };

  const resetForm = () => {
    setFormData({
      customer: {
        name: '',
        email: '',
        phone: '',
        isExisting: false,
        selectedCustomerId: ''
      },
      items: [],
      shippingAddress: {
        street: '',
        suburb: '',
        city: '',
        province: 'Harare',
        country: 'Zimbabwe',
        postalCode: ''
      },
      paymentMethod: 'card',
      branchId: '',
      currency: 'USD',
      notes: ''
    });
    setStep(1);
    setError(null);
    setSearchStates({
      customers: { query: '', results: [], loading: false },
      products: { query: '', results: [], loading: false }
    });
  };

  const validateStep = (stepNumber) => {
    setError(null);
    
    switch (stepNumber) {
      case 1:
        if (!formData.customer.name || !formData.customer.email) {
          setError('Customer name and email are required');
          return false;
        }
        break;
      case 2:
        if (formData.items.length === 0) {
          setError('At least one item is required');
          return false;
        }
        break;
      case 3:
        const { shippingAddress } = formData;
        if (!shippingAddress.street || !shippingAddress.city) {
          setError('Street address and city are required');
          return false;
        }
        break;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    setStep(step - 1);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    if (!formData.paymentMethod) {
      setError('Payment method is required');
      return;
    }

    try {
      setError(null);
      
      const orderData = {
        // Customer info
        customer: formData.customer.isExisting 
          ? { customerId: formData.customer.selectedCustomerId }
          : {
              name: formData.customer.name,
              email: formData.customer.email,
              phone: formData.customer.phone
            },
        
        // Items
        items: formData.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          currency: item.currency
        })),
        
        // Address
        shippingAddress: formData.shippingAddress,
        
        // Payment & Branch
        paymentMethod: formData.paymentMethod,
        branchId: formData.branchId,
        currency: formData.currency,
        
        // Totals
        subtotal: calculations.subtotal,
        tax: calculations.tax,
        shipping: calculations.shipping,
        total: calculations.total,
        
        // Notes
        notes: formData.notes
      };

      await onCreateOrder(orderData);
      onClose();
      resetForm();
    } catch (error) {
      setError(error.message || 'Failed to create order');
    }
  };

  const updateFormData = (path, value) => {
    setFormData(prev => {
      const newData = { ...prev };
      const keys = path.split('.');
      let current = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Order"
      size="xl"
    >
      <div className="max-h-[80vh] overflow-y-auto">
        {error && (
          <Alert variant="error" onClose={() => setError(null)} className="mb-4">
            {error}
          </Alert>
        )}

        {/* Progress Steps */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            {[
              { num: 1, title: 'Customer', icon: User },
              { num: 2, title: 'Items', icon: Package },
              { num: 3, title: 'Shipping', icon: MapPin },
              { num: 4, title: 'Payment', icon: CreditCard }
            ].map((stepInfo, index) => (
              <div key={stepInfo.num} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  step >= stepInfo.num ? 'bg-primary-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  {step > stepInfo.num ? (
                    <span className="text-sm">✓</span>
                  ) : (
                    <stepInfo.icon className="h-4 w-4" />
                  )}
                </div>
                <span className={`ml-2 text-sm ${step >= stepInfo.num ? 'text-primary-600 font-medium' : 'text-gray-500'}`}>
                  {stepInfo.title}
                </span>
                {index < 3 && (
                  <div className={`mx-4 h-0.5 w-12 ${step > stepInfo.num ? 'bg-primary-600' : 'bg-gray-300'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="space-y-6">
          {/* Step 1: Customer Information */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h3>
              
              {/* Customer Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search existing customers by name or email..."
                  value={searchStates.customers.query}
                  onChange={(e) => {
                    const query = e.target.value;
                    setSearchStates(prev => ({
                      ...prev,
                      customers: { ...prev.customers, query }
                    }));
                    if (query.length > 2) {
                      searchCustomers(query);
                    } else {
                      setSearchStates(prev => ({
                        ...prev,
                        customers: { ...prev.customers, results: [] }
                      }));
                    }
                  }}
                  className="pl-10"
                />
                {searchStates.customers.loading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin h-4 w-4 border-2 border-primary-600 border-t-transparent rounded-full" />
                  </div>
                )}
              </div>

              {/* Customer Search Results */}
              {searchStates.customers.results.length > 0 && (
                <div className="bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {searchStates.customers.results.map(customer => (
                    <button
                      key={customer.id || customer._id}
                      onClick={() => selectCustomer(customer)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">{customer.name}</div>
                      <div className="text-sm text-gray-500">{customer.email}</div>
                    </button>
                  ))}
                </div>
              )}

              {/* Customer Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Customer Name *"
                  value={formData.customer.name}
                  onChange={(e) => updateFormData('customer.name', e.target.value)}
                  placeholder="Enter customer name"
                />
                <Input
                  label="Email Address *"
                  type="email"
                  value={formData.customer.email}
                  onChange={(e) => updateFormData('customer.email', e.target.value)}
                  placeholder="customer@email.com"
                />
              </div>

              <Input
                label="Phone Number"
                value={formData.customer.phone}
                onChange={(e) => updateFormData('customer.phone', e.target.value)}
                placeholder="+263771234567"
              />

              {formData.customer.isExisting && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-green-700 text-sm">
                    ✓ Existing customer selected
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Order Items */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Order Items</h3>
              
              {/* Product Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search products by name or SKU..."
                  value={searchStates.products.query}
                  onChange={(e) => {
                    const query = e.target.value;
                    setSearchStates(prev => ({
                      ...prev,
                      products: { ...prev.products, query }
                    }));
                    if (query.length > 2) {
                      searchProducts(query);
                    } else {
                      setSearchStates(prev => ({
                        ...prev,
                        products: { ...prev.products, results: [] }
                      }));
                    }
                  }}
                  className="pl-10"
                />
                {searchStates.products.loading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin h-4 w-4 border-2 border-primary-600 border-t-transparent rounded-full" />
                  </div>
                )}
              </div>

              {/* Product Search Results */}
              {searchStates.products.results.length > 0 && (
                <div className="bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {searchStates.products.results.map(product => {
                    const price = product.price?.regular_price || product.regular_price || product.price || 0;
                    const stock = product.stock?.quantity || product.stock || 0;
                    
                    return (
                      <button
                        key={product.id || product._id}
                        onClick={() => addProductToOrder(product)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b last:border-b-0"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-gray-900">{product.name}</div>
                            <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                            <div className="text-sm text-gray-500">Stock: {stock}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-gray-900">{formatCurrency(price)}</div>
                            <Badge variant={stock > 0 ? 'success' : 'error'}>
                              {stock > 0 ? 'In Stock' : 'Out of Stock'}
                            </Badge>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Order Items List */}
              {formData.items.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Order Items ({formData.items.length})</h4>
                  {formData.items.map((item, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-500">SKU: {item.sku}</div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateItemQuantity(index, item.quantity - 1)}
                          className="p-1 rounded-full hover:bg-gray-200"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-12 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateItemQuantity(index, item.quantity + 1)}
                          className="p-1 rounded-full hover:bg-gray-200"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="w-24">
                        <Input
                          type="number"
                          step="0.01"
                          value={item.price}
                          onChange={(e) => updateItemPrice(index, e.target.value)}
                          className="text-sm"
                        />
                      </div>

                      <div className="w-20 text-right font-medium">
                        {formatCurrency(item.price * item.quantity)}
                      </div>

                      <button
                        onClick={() => removeItem(index)}
                        className="p-1 rounded-full hover:bg-red-100 text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}

                  {/* Order Totals */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Calculator className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-blue-900">Order Summary</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(calculations.subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax (15%):</span>
                        <span>{formatCurrency(calculations.tax)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Shipping:</span>
                        <span>{formatCurrency(calculations.shipping)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-blue-900 pt-1 border-t">
                        <span>Total:</span>
                        <span>{formatCurrency(calculations.total)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {formData.items.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No items added yet. Search and select products above.</p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Shipping Address */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Shipping Address</h3>
              
              <Textarea
                label="Street Address *"
                rows={2}
                value={formData.shippingAddress.street}
                onChange={(e) => updateFormData('shippingAddress.street', e.target.value)}
                placeholder="Enter complete street address"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Suburb"
                  value={formData.shippingAddress.suburb}
                  onChange={(e) => updateFormData('shippingAddress.suburb', e.target.value)}
                  placeholder="Suburb/Area"
                />
                
                <Input
                  label="City *"
                  value={formData.shippingAddress.city}
                  onChange={(e) => updateFormData('shippingAddress.city', e.target.value)}
                  placeholder="City"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Province *"
                  value={formData.shippingAddress.province}
                  onChange={(e) => updateFormData('shippingAddress.province', e.target.value)}
                >
                  {zimbabweProvinces.map(province => (
                    <option key={province} value={province}>{province}</option>
                  ))}
                </Select>

                <Input
                  label="Postal Code"
                  value={formData.shippingAddress.postalCode}
                  onChange={(e) => updateFormData('shippingAddress.postalCode', e.target.value)}
                  placeholder="Postal code"
                />
              </div>

              <Input
                label="Country"
                value={formData.shippingAddress.country}
                onChange={(e) => updateFormData('shippingAddress.country', e.target.value)}
                disabled
              />
            </div>
          )}

          {/* Step 4: Payment & Final Details */}
          {step === 4 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Payment & Final Details</h3>
              
              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Payment Method *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {paymentMethods.map(method => (
                    <button
                      key={method.value}
                      onClick={() => updateFormData('paymentMethod', method.value)}
                      className={`flex items-center p-3 border rounded-lg transition-colors ${
                        formData.paymentMethod === method.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <method.icon className="h-5 w-5 mr-3" />
                      <span className="font-medium">{method.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Branch Selection */}
              <Select
                label="Branch"
                value={formData.branchId}
                onChange={(e) => updateFormData('branchId', e.target.value)}
              >
                <option value="">Select Branch (Optional)</option>
                {branches.map(branch => (
                  <option key={branch._id || branch.id} value={branch._id || branch.id}>
                    {branch.name}
                  </option>
                ))}
              </Select>

              {/* Currency */}
              <Select
                label="Currency"
                value={formData.currency}
                onChange={(e) => updateFormData('currency', e.target.value)}
              >
                <option value="USD">USD - US Dollar</option>
                <option value="ZWG">ZWG - Zimbabwean Dollar</option>
              </Select>

              {/* Order Notes */}
              <Textarea
                label="Order Notes"
                rows={3}
                value={formData.notes}
                onChange={(e) => updateFormData('notes', e.target.value)}
                placeholder="Any special instructions or notes for this order..."
              />

              {/* Final Order Summary */}
              <div className="bg-green-50 p-6 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-4">Order Summary</h4>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Customer:</span>
                    <span className="font-medium">{formData.customer.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Items:</span>
                    <span className="font-medium">{formData.items.length} item(s)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment:</span>
                    <span className="font-medium">
                      {paymentMethods.find(p => p.value === formData.paymentMethod)?.label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Currency:</span>
                    <span className="font-medium">{formData.currency}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-green-200">
                    <span className="font-semibold">Total Amount:</span>
                    <span className="font-bold text-green-900">
                      {formatCurrency(calculations.total, formData.currency)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6 border-t mt-6">
          <div>
            {step > 1 && (
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={loading}
              >
                Previous
              </Button>
            )}
          </div>
          
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            
            {step < 4 ? (
              <Button
                onClick={handleNext}
                disabled={loading}
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                loading={loading}
              >
                Create Order
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};