// src/pages/ProductsPage.jsx - Fixed version with better auth handling
import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/layout';
import { ProductForm, ProductList, ProductFilters } from '../components/products';
import { Button, Alert } from '../components/ui';
import { Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export const ProductsPage = () => {
  const { isAuthenticated, user, userRole } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    status: '',
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });

  useEffect(() => {
    loadProducts();
  }, [filters, pagination.currentPage]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: pagination.currentPage,
        limit: 20,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        ),
      };

      const response = await api.getProducts(params);
      console.log('Products API response:', response);
      
      // Handle different response structures
      let productsData = [];
      if (Array.isArray(response)) {
        productsData = response;
      } else if (response.data && Array.isArray(response.data)) {
        productsData = response.data;
      } else if (response.products && Array.isArray(response.products)) {
        productsData = response.products;
      }
      
      setProducts(productsData);
      setPagination(prev => ({
        ...prev,
        totalPages: response.totalPages || 1,
        totalItems: response.total || 0,
      }));
    } catch (error) {
      console.error('Failed to load products:', error);
      setError(`Failed to load products: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (formData) => {
    try {
      setError(null);
      
      // Debug: Check if we're authenticated
      if (!isAuthenticated) {
        throw new Error('You must be logged in to create products');
      }
      
      // Debug: Check user role
      if (!['admin', 'shop_manager', 'super_admin'].includes(userRole)) {
        throw new Error(`Access denied. Your role (${userRole}) doesn't have permission to create products`);
      }
      
      // Debug: Check if cookie exists
      if (!api.isAuthenticated()) {
        throw new Error('Authentication cookie not found. Please login again.');
      }
      
      console.log('Creating product with auth check passed:', {
        isAuthenticated,
        userRole,
        hasCookie: api.isAuthenticated(),
        user: user?.name
      });
      
      const response = await api.createProduct(formData);
      console.log('Product creation response:', response);
      
      await loadProducts();
      setShowProductForm(false);
      
      // Show success message
      setError(null);
      
    } catch (error) {
      console.error('Product creation error:', error);
      
      // Handle specific error cases
      if (error.status === 401) {
        setError('Authentication failed. Please login again.');
        // Could trigger re-authentication here
      } else if (error.status === 403) {
        setError('Access denied. You don\'t have permission to create products.');
      } else {
        setError(`Failed to create product: ${error.message}`);
      }
      
      throw error; // Re-throw so form can handle it
    }
  };

  const handleUpdateProduct = async (formData, productId) => {
    try {
      setError(null);
      
      if (!isAuthenticated || !api.isAuthenticated()) {
        throw new Error('Authentication required. Please login again.');
      }
      
      await api.updateProduct(productId, formData);
      await loadProducts();
      setShowProductForm(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error('Product update error:', error);
      setError(`Failed to update product: ${error.message}`);
      throw error;
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      setError(null);
      
      if (!isAuthenticated || !api.isAuthenticated()) {
        setError('Authentication required. Please login again.');
        return;
      }
      
      await api.deleteProduct(productId);
      await loadProducts();
    } catch (error) {
      console.error('Product deletion error:', error);
      setError(`Failed to delete product: ${error.message}`);
    }
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setShowProductForm(true);
  };

  const handleSaveProduct = async (formData, productId) => {
    if (productId) {
      await handleUpdateProduct(formData, productId);
    } else {
      await handleCreateProduct(formData);
    }
  };

  // Check if user has permission to manage products
  const canManageProducts = ['admin', 'shop_manager', 'super_admin'].includes(userRole);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products Management"
        subtitle="Manage your mining equipment inventory"
      >
        {canManageProducts && (
          <Button
            onClick={() => {
              setSelectedProduct(null);
              setShowProductForm(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        )}
      </PageHeader>

      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Debug Info - Remove in production */}
      <div className="bg-gray-100 p-3 rounded text-xs text-gray-600">
        <strong>Debug:</strong> Auth: {isAuthenticated ? 'Yes' : 'No'} | 
        Role: {userRole || 'None'} | 
        Cookie: {api.isAuthenticated() ? 'Present' : 'Missing'} | 
        User: {user?.name || 'None'}
      </div>

      <ProductFilters
        filters={filters}
        onFiltersChange={setFilters}
        onClearFilters={() => setFilters({ search: '', category: '', status: '' })}
      />

      <ProductList
        products={products}
        loading={loading}
        onEdit={canManageProducts ? handleEditProduct : null}
        onDelete={canManageProducts ? handleDeleteProduct : null}
        onView={(product) => console.log('View product:', product)}
      />

      {canManageProducts && (
        <ProductForm
          isOpen={showProductForm}
          onClose={() => {
            setShowProductForm(false);
            setSelectedProduct(null);
          }}
          product={selectedProduct}
          onSave={handleSaveProduct}
        />
      )}
    </div>
  );
};