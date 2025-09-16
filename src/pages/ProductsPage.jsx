// src/pages/ProductsPage.jsx
import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/layout';
import { ProductForm, ProductList, ProductFilters } from '../components/products';
import { Button, Alert } from '../components/ui';
import { Plus } from 'lucide-react';
import api from '../services/api';

export const ProductsPage = () => {
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
      
      setProducts(response.data || []);
      setPagination(prev => ({
        ...prev,
        totalPages: response.totalPages || 1,
        totalItems: response.total || 0,
      }));
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (formData) => {
    try {
      await api.createProduct(formData);
      await loadProducts();
      setShowProductForm(false);
    } catch (error) {
      throw new Error('Failed to create product: ' + error.message);
    }
  };

  const handleUpdateProduct = async (formData, productId) => {
    try {
      await api.updateProduct(productId, formData);
      await loadProducts();
      setShowProductForm(false);
      setSelectedProduct(null);
    } catch (error) {
      throw new Error('Failed to update product: ' + error.message);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await api.deleteProduct(productId);
      await loadProducts();
    } catch (error) {
      setError('Failed to delete product: ' + error.message);
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products Management"
        subtitle="Manage your mining equipment inventory"
      >
        <Button
          onClick={() => {
            setSelectedProduct(null);
            setShowProductForm(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </PageHeader>

      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <ProductFilters
        filters={filters}
        onFiltersChange={setFilters}
        onClearFilters={() => setFilters({ search: '', category: '', status: '' })}
      />

      <ProductList
        products={products}
        loading={loading}
        onEdit={handleEditProduct}
        onDelete={handleDeleteProduct}
        onView={(product) => console.log('View product:', product)}
      />

      <ProductForm
        isOpen={showProductForm}
        onClose={() => {
          setShowProductForm(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        onSave={handleSaveProduct}
      />
    </div>
  );
};