// src/components/products/ProductFilters.jsx
import React from 'react';
import { Button, Input, Select } from '../ui';
import { Search, Filter } from 'lucide-react';
import { PRODUCT_CATEGORIES } from '../../utils';

export const ProductFilters = ({ 
  filters, 
  onFiltersChange, 
  onClearFilters 
}) => {
  const handleFilterChange = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== '' && value !== undefined
  );

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search products..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="pl-10"
          />
        </div>

        <Select
          value={filters.category || ''}
          onChange={(e) => handleFilterChange('category', e.target.value)}
        >
          <option value="">All Categories</option>
          {PRODUCT_CATEGORIES.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </Select>

        <Select
          value={filters.status || ''}
          onChange={(e) => handleFilterChange('status', e.target.value)}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>

        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={onClearFilters}
            disabled={!hasActiveFilters}
            className="flex-1"
          >
            Clear Filters
          </Button>
          <Button
            variant="outline"
            className="px-3"
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
