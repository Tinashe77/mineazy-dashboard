// src/pages/ProductsPage.jsx - Updated with Product View Modal
import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '../components/layout';
import { ProductForm, ProductList, ProductFilters } from '../components/products';
import { ProductBulkImport } from '../components/products/ProductBulkImport';
import { ProductViewModal } from '../components/products/ProductViewModal';
import { Button, Alert } from '../components/ui';
import { Plus, Upload } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export const ProductsPage = () => {
  const { isAuthenticated, user, userRole } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [viewProduct, setViewProduct] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    status: '',
    minPrice: '',
    maxPrice: '',
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });

  // Debounced filter function to prevent too many API calls
  const [filterTimeout, setFilterTimeout] = useState(null);

  const loadProducts = useCallback(async (newFilters = null, page = null) => {
    try {
      setLoading(true);
      setError(null);
      
      const currentFilters = newFilters || filters;
      const currentPage = page || pagination.currentPage;
      
      console.log('Loading products with filters:', currentFilters);
      console.log('Current page:', currentPage);
      
      // Build API parameters
      const params = {
        page: currentPage,
        limit: 20,
      };

      // Add filters to params, only if they have values
      if (currentFilters.search && currentFilters.search.trim()) {
        params.search = currentFilters.search.trim();
      }
      
      if (currentFilters.category) {
        params.category = currentFilters.category;
      }
      
      if (currentFilters.status !== '') {
        // Convert string to boolean for isActive
        params.isActive = currentFilters.status === 'true';
      }
      
      if (currentFilters.minPrice && currentFilters.minPrice !== '') {
        params.minPrice = parseFloat(currentFilters.minPrice);
      }
      
      if (currentFilters.maxPrice && currentFilters.maxPrice !== '') {
        params.maxPrice = parseFloat(currentFilters.maxPrice);
      }

      console.log('API params being sent:', params);
      
      const response = await api.getProducts(params);
      console.log('Products API response:', response);
      
      let productsData = [];
      let paginationData = {};
      
      if (Array.isArray(response)) {
        productsData = response;
        paginationData = {
          currentPage: 1,
          totalPages: 1,
          totalItems: response.length,
        };
      } else if (response.data && Array.isArray(response.data)) {
        productsData = response.data;
        paginationData = {
          currentPage: response.page || currentPage,
          totalPages: response.totalPages || 1,
          totalItems: response.total || response.totalItems || response.data.length,
        };
      } else if (response.products && Array.isArray(response.products)) {
        productsData = response.products;
        paginationData = {
          currentPage: response.page || currentPage,
          totalPages: response.totalPages || 1,
          totalItems: response.total || response.totalItems || response.products.length,
        };
      }
      
      console.log('Processed products data:', productsData.length);
      console.log('Pagination data:', paginationData);
      
      setProducts(productsData);
      setPagination(paginationData);
      
    } catch (error) {
      console.error('Failed to load products:', error);
      setError(`Failed to load products: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.currentPage]);

  // Load products on component mount
  useEffect(() => {
    loadProducts();
  }, []); // Only run once on mount

  // Handle filter changes with debouncing
  const handleFiltersChange = useCallback((newFilters) => {
    console.log('Filters changed:', newFilters);
    setFilters(newFilters);
    
    // Clear existing timeout
    if (filterTimeout) {
      clearTimeout(filterTimeout);
    }
    
    // Set new timeout for debounced API call
    const timeout = setTimeout(() => {
      console.log('Applying filters after debounce:', newFilters);
      // Reset to page 1 when filters change
      setPagination(prev => ({ ...prev, currentPage: 1 }));
      loadProducts(newFilters, 1);
    }, 500); // 500ms debounce
    
    setFilterTimeout(timeout);
  }, [filterTimeout, loadProducts]);

  // Handle clear filters
  const handleClearFilters = useCallback(() => {
    console.log('Clearing filters');
    const clearedFilters = {
      search: '',
      category: '',
      status: '',
      minPrice: '',
      maxPrice: '',
    };
    setFilters(clearedFilters);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    loadProducts(clearedFilters, 1);
  }, [loadProducts]);

  // Handle page changes
  const handlePageChange = useCallback((newPage) => {
    console.log('Page changed to:', newPage);
    setPagination(prev => ({ ...prev, currentPage: newPage }));
    loadProducts(null, newPage);
  }, [loadProducts]);

  const handleSaveProduct = async (formData, productId) => {
    try {
      setError(null);
      
      if (productId) {
        await api.updateProduct(productId, formData);
        setSuccess('Product updated successfully!');
      } else {
        await api.createProduct(formData);
        setSuccess('Product created successfully!');
      }
      
      // Reload products with current filters
      await loadProducts();
      setShowProductForm(false);
      setSelectedProduct(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Product save error:', error);
      throw error; // Let the form handle the error
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      setError(null);
      await api.deleteProduct(productId);
      setSuccess('Product deleted successfully!');
      // Reload products with current filters
      await loadProducts();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Product deletion error:', error);
      setError(`Failed to delete product: ${error.message}`);
    }
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setShowProductForm(true);
  };

  const handleViewProduct = (product) => {
    console.log('Viewing product:', product);
    setViewProduct(product);
    setShowViewModal(true);
  };

  const handleImportSuccess = () => {
    setShowBulkImport(false);
    setSuccess('Products imported successfully!');
    // Reload products with current filters
    loadProducts();
    setTimeout(() => setSuccess(null), 3000);
  };

  const canManageProducts = ['admin', 'shop_manager', 'super_admin'].includes(userRole);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products Management"
        subtitle="Manage your mining equipment inventory"
      >
        {canManageProducts && (
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowBulkImport(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Bulk Import
            </Button>
            <Button
              onClick={() => {
                setSelectedProduct(null);
                setShowProductForm(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>
        )}
      </PageHeader>

      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <ProductFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
      />

      <ProductList
        products={products}
        loading={loading}
        onEdit={canManageProducts ? handleEditProduct : null}
        onDelete={canManageProducts ? handleDeleteProduct : null}
        onView={handleViewProduct}
      />

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center space-x-4">
          <Button
            variant="outline"
            disabled={pagination.currentPage === 1}
            onClick={() => handlePageChange(pagination.currentPage - 1)}
          >
            Previous
          </Button>
          
          <span className="text-sm text-gray-700">
            Page {pagination.currentPage} of {pagination.totalPages} 
            ({pagination.totalItems} total products)
          </span>
          
          <Button
            variant="outline"
            disabled={pagination.currentPage === pagination.totalPages}
            onClick={() => handlePageChange(pagination.currentPage + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Product View Modal */}
      <ProductViewModal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setViewProduct(null);
        }}
        product={viewProduct}
      />

      {canManageProducts && (
        <>
          <ProductForm
            isOpen={showProductForm}
            onClose={() => {
              setShowProductForm(false);
              setSelectedProduct(null);
            }}
            product={selectedProduct}
            onSave={handleSaveProduct}
          />

          <ProductBulkImport
            isOpen={showBulkImport}
            onClose={() => setShowBulkImport(false)}
            onImportSuccess={handleImportSuccess}
          />
        </>
      )}

      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-50 p-3 rounded text-xs">
          <strong>Debug:</strong> 
          Products: {products.length} | 
          Filters: {JSON.stringify(filters)} | 
          Page: {pagination.currentPage}/{pagination.totalPages}
        </div>
      )}
    </div>
  );
};