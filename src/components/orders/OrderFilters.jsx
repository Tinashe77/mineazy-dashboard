// src/components/orders/OrderFilters.jsx - Enhanced version
import React, { useState, useEffect } from 'react';
import { Button, Input, Select } from '../ui';
import { Search, Filter, X, Calendar, Download, RefreshCw } from 'lucide-react';
import api from '../../services/api';

export const OrderFilters = ({ 
  filters, 
  onFiltersChange, 
  onClearFilters,
  onExport,
  onRefresh,
  loading = false
}) => {
  const [branches, setBranches] = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      const response = await api.getBranches();
      setBranches(response.data || []);
    } catch (error) {
      console.error('Failed to load branches:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    console.log(`Order filter changed: ${key} = ${value}`);
    const newFilters = {
      ...filters,
      [key]: value,
    };
    console.log('New order filters:', newFilters);
    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    console.log('Clearing all order filters');
    onClearFilters();
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== '' && value !== undefined && value !== null
  );

  // Status options based on your order system
  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  // Payment method options based on your API
  const paymentMethodOptions = [
    { value: 'card', label: 'Credit/Debit Card' },
    { value: 'paynow', label: 'Paynow Mobile' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'cash_on_delivery', label: 'Cash on Delivery' }
  ];

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      {/* Basic Filters Row */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search orders..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Status Filter */}
        <Select
          value={filters.status || ''}
          onChange={(e) => handleFilterChange('status', e.target.value)}
        >
          <option value="">All Status</option>
          {statusOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        {/* Payment Method Filter */}
        <Select
          value={filters.paymentMethod || ''}
          onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
        >
          <option value="">All Payment Methods</option>
          {paymentMethodOptions.map(method => (
            <option key={method.value} value={method.value}>
              {method.label}
            </option>
          ))}
        </Select>

        {/* Branch Filter */}
        <Select
          value={filters.branchId || ''}
          onChange={(e) => handleFilterChange('branchId', e.target.value)}
        >
          <option value="">All Branches</option>
          {branches.map(branch => (
            <option key={branch._id || branch.id} value={branch._id || branch.id}>
              {branch.name}
            </option>
          ))}
        </Select>

        {/* Quick Date Filter */}
        <Select
          value={filters.quickDate || ''}
          onChange={(e) => {
            const value = e.target.value;
            let startDate = '';
            let endDate = '';
            
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];
            
            switch (value) {
              case 'today':
                startDate = todayStr;
                endDate = todayStr;
                break;
              case 'week':
                const weekAgo = new Date(today.setDate(today.getDate() - 7));
                startDate = weekAgo.toISOString().split('T')[0];
                endDate = new Date().toISOString().split('T')[0];
                break;
              case 'month':
                const monthAgo = new Date(today.setMonth(today.getMonth() - 1));
                startDate = monthAgo.toISOString().split('T')[0];
                endDate = new Date().toISOString().split('T')[0];
                break;
              case 'quarter':
                const quarterAgo = new Date(today.setMonth(today.getMonth() - 3));
                startDate = quarterAgo.toISOString().split('T')[0];
                endDate = new Date().toISOString().split('T')[0];
                break;
            }
            
            handleFilterChange('quickDate', value);
            if (startDate) handleFilterChange('startDate', startDate);
            if (endDate) handleFilterChange('endDate', endDate);
          }}
        >
          <option value="">All Time</option>
          <option value="today">Today</option>
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
          <option value="quarter">Last 3 Months</option>
        </Select>

        {/* Actions */}
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex-1"
            title="Toggle Advanced Filters"
          >
            <Filter className="h-4 w-4 mr-1" />
            Advanced
          </Button>
        </div>
      </div>

      {/* Advanced Filters Row */}
      {showAdvanced && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Custom Date Range */}
            <div className="flex space-x-2">
              <Input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full"
                placeholder="Start Date"
              />
              <Input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full"
                placeholder="End Date"
              />
            </div>

            {/* Amount Range */}
            <div className="flex space-x-2">
              <Input
                placeholder="Min Amount"
                type="number"
                step="0.01"
                value={filters.minAmount || ''}
                onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                className="w-full"
              />
              <Input
                placeholder="Max Amount"
                type="number"
                step="0.01"
                value={filters.maxAmount || ''}
                onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                className="w-full"
              />
            </div>

            {/* Customer Email/Name */}
            <Input
              placeholder="Customer email/name"
              value={filters.customer || ''}
              onChange={(e) => handleFilterChange('customer', e.target.value)}
            />

            {/* Order Number */}
            <Input
              placeholder="Order number"
              value={filters.orderNumber || ''}
              onChange={(e) => handleFilterChange('orderNumber', e.target.value)}
            />

            {/* Clear Filters */}
            <Button
              variant="outline"
              onClick={handleClearFilters}
              disabled={!hasActiveFilters}
              className="w-full"
            >
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="mt-4 flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-4">
          {/* Active Filters Count */}
          {hasActiveFilters && (
            <span className="text-sm text-gray-600">
              {Object.values(filters).filter(Boolean).length} filter(s) applied
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Export Button */}
          {onExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}

          {/* Refresh Button */}
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="text-sm text-gray-500">Active filters:</span>
          
          {filters.search && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Search: "{filters.search}"
              <button
                onClick={() => handleFilterChange('search', '')}
                className="ml-1 h-3 w-3 rounded-full hover:bg-blue-200 flex items-center justify-center"
              >
                <X className="h-2 w-2" />
              </button>
            </span>
          )}

          {filters.status && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Status: {statusOptions.find(s => s.value === filters.status)?.label || filters.status}
              <button
                onClick={() => handleFilterChange('status', '')}
                className="ml-1 h-3 w-3 rounded-full hover:bg-green-200 flex items-center justify-center"
              >
                <X className="h-2 w-2" />
              </button>
            </span>
          )}

          {filters.paymentMethod && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              Payment: {paymentMethodOptions.find(p => p.value === filters.paymentMethod)?.label || filters.paymentMethod}
              <button
                onClick={() => handleFilterChange('paymentMethod', '')}
                className="ml-1 h-3 w-3 rounded-full hover:bg-purple-200 flex items-center justify-center"
              >
                <X className="h-2 w-2" />
              </button>
            </span>
          )}

          {filters.branchId && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Branch: {branches.find(b => (b._id || b.id) === filters.branchId)?.name || filters.branchId}
              <button
                onClick={() => handleFilterChange('branchId', '')}
                className="ml-1 h-3 w-3 rounded-full hover:bg-yellow-200 flex items-center justify-center"
              >
                <X className="h-2 w-2" />
              </button>
            </span>
          )}

          {(filters.startDate || filters.endDate) && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              <Calendar className="h-3 w-3 mr-1" />
              Date: {filters.startDate || 'Start'} - {filters.endDate || 'End'}
              <button
                onClick={() => {
                  handleFilterChange('startDate', '');
                  handleFilterChange('endDate', '');
                  handleFilterChange('quickDate', '');
                }}
                className="ml-1 h-3 w-3 rounded-full hover:bg-indigo-200 flex items-center justify-center"
              >
                <X className="h-2 w-2" />
              </button>
            </span>
          )}

          {(filters.minAmount || filters.maxAmount) && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              Amount: ${filters.minAmount || '0'} - ${filters.maxAmount || '∞'}
              <button
                onClick={() => {
                  handleFilterChange('minAmount', '');
                  handleFilterChange('maxAmount', '');
                }}
                className="ml-1 h-3 w-3 rounded-full hover:bg-orange-200 flex items-center justify-center"
              >
                <X className="h-2 w-2" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};