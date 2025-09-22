// src/components/transactions/TransactionFilters.jsx
import React from 'react';
import { Button, Input, Select } from '../ui';
import { Search, Filter, X, Calendar } from 'lucide-react';

export const TransactionFilters = ({ 
  filters, 
  onFiltersChange, 
  onClearFilters 
}) => {
  const handleFilterChange = (key, value) => {
    console.log(`Filter changed: ${key} = ${value}`);
    const newFilters = {
      ...filters,
      [key]: value,
    };
    console.log('New filters:', newFilters);
    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    console.log('Clearing all filters');
    onClearFilters();
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== '' && value !== undefined && value !== null
  );

  // Payment method options based on backend controller validPaymentMethods
  const paymentMethods = [
    { value: 'paynow', label: 'Paynow' },
    { value: 'ecocash', label: 'EcoCash' },
    { value: 'onemoney', label: 'OneMoney' },
    { value: 'zipit', label: 'ZipIt' },
    { value: 'cash', label: 'Cash' },
    { value: 'card', label: 'Credit/Debit Card' },
  ];

  // Transaction status options based on API documentation
  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'completed', label: 'Completed' },
    { value: 'failed', label: 'Failed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'refunded', label: 'Refunded' },
  ];

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search transactions..."
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
          value={filters.method || ''}
          onChange={(e) => handleFilterChange('method', e.target.value)}
        >
          <option value="">All Methods</option>
          {paymentMethods.map(method => (
            <option key={method.value} value={method.value}>
              {method.label}
            </option>
          ))}
        </Select>

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

        {/* Date Range */}
        <div className="flex space-x-2">
          <Input
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            className="w-full"
          />
          <Input
            type="date"
            value={filters.endDate || ''}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            className="w-full"
          />
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={handleClearFilters}
            disabled={!hasActiveFilters}
            className="flex-1"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
          <Button
            variant="outline"
            className="px-3"
            title="Advanced Filters"
          >
            <Filter className="h-4 w-4" />
          </Button>
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
                className="ml-1 h-3 w-3 rounded-full hover:bg-blue-200"
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
                className="ml-1 h-3 w-3 rounded-full hover:bg-green-200"
              >
                <X className="h-2 w-2" />
              </button>
            </span>
          )}
          {filters.method && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              Method: {paymentMethods.find(m => m.value === filters.method)?.label || filters.method}
              <button
                onClick={() => handleFilterChange('method', '')}
                className="ml-1 h-3 w-3 rounded-full hover:bg-purple-200"
              >
                <X className="h-2 w-2" />
              </button>
            </span>
          )}
          {(filters.minAmount || filters.maxAmount) && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Amount: {filters.minAmount || '0'} - {filters.maxAmount || '∞'}
              <button
                onClick={() => {
                  handleFilterChange('minAmount', '');
                  handleFilterChange('maxAmount', '');
                }}
                className="ml-1 h-3 w-3 rounded-full hover:bg-yellow-200"
              >
                <X className="h-2 w-2" />
              </button>
            </span>
          )}
          {(filters.startDate || filters.endDate) && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              Date: {filters.startDate || 'Start'} - {filters.endDate || 'End'}
              <button
                onClick={() => {
                  handleFilterChange('startDate', '');
                  handleFilterChange('endDate', '');
                }}
                className="ml-1 h-3 w-3 rounded-full hover:bg-indigo-200"
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