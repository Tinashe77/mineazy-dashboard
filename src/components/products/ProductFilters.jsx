// src/components/products/ProductFilters.jsx
import React, { useState, useEffect } from 'react';
import { Button, Input, Select } from '../ui';
import { Search, Filter, X } from 'lucide-react';
import api from '../../services/api';

export const ProductFilters = ({ 
  filters, 
  onFiltersChange, 
  onClearFilters 
}) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await api.getCategories();
      const categoriesData = response.data || response || [];
      setCategories(categoriesData);
      console.log('Categories loaded for filters:', categoriesData);
    } catch (error) {
      console.error('Failed to load categories for filters:', error);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search products..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category Filter */}
        <Select
          value={filters.category || ''}
          onChange={(e) => handleFilterChange('category', e.target.value)}
          disabled={loading}
        >
          <option value="">All Categories</option>
          {categories.map(category => (
            <option key={category._id || category.id} value={category._id || category.id}>
              {category.name}
            </option>
          ))}
        </Select>

        {/* Status Filter */}
        <Select
          value={filters.status || ''}
          onChange={(e) => handleFilterChange('status', e.target.value)}
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </Select>

        {/* Price Range */}
        <div className="flex space-x-2">
          <Input
            placeholder="Min Price"
            type="number"
            step="0.01"
            value={filters.minPrice || ''}
            onChange={(e) => handleFilterChange('minPrice', e.target.value)}
            className="w-full"
          />
          <Input
            placeholder="Max Price"
            type="number"
            step="0.01"
            value={filters.maxPrice || ''}
            onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
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
          {filters.category && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Category: {categories.find(c => (c._id || c.id) === filters.category)?.name || filters.category}
              <button
                onClick={() => handleFilterChange('category', '')}
                className="ml-1 h-3 w-3 rounded-full hover:bg-green-200"
              >
                <X className="h-2 w-2" />
              </button>
            </span>
          )}
          {filters.status && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Status: {filters.status === 'true' ? 'Active' : 'Inactive'}
              <button
                onClick={() => handleFilterChange('status', '')}
                className="ml-1 h-3 w-3 rounded-full hover:bg-yellow-200"
              >
                <X className="h-2 w-2" />
              </button>
            </span>
          )}
          {(filters.minPrice || filters.maxPrice) && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              Price: {filters.minPrice || '0'} - {filters.maxPrice || '∞'}
              <button
                onClick={() => {
                  handleFilterChange('minPrice', '');
                  handleFilterChange('maxPrice', '');
                }}
                className="ml-1 h-3 w-3 rounded-full hover:bg-purple-200"
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