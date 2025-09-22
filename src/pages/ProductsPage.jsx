// Update src/pages/ProductsPage.jsx - add bulk import functionality
import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/layout';
import { ProductForm, ProductList, ProductFilters } from '../components/products';
import { ProductBulkImport } from '../components/products/ProductBulkImport';
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
        totalItems: response.total || productsData.length,
      }));
    } catch (error) {
      console.error('Failed to load products:', error);
      setError(`Failed to load products: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

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

  const handleImportSuccess = () => {
    setShowBulkImport(false);
    setSuccess('Products imported successfully!');
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

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <Button
            variant="outline"
            disabled={pagination.currentPage === 1}
            onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
          >
            Previous
          </Button>
          <span className="py-2 px-4">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={pagination.currentPage === pagination.totalPages}
            onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
          >
            Next
          </Button>
        </div>
      )}

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
    </div>
  );
};