// src/components/products/ProductList.jsx
import React, { useState } from 'react';
import { Button, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui';
import { formatCurrency, getStatusVariant, truncateText } from '../../utils';
import { Edit, Trash2, Eye, Package } from 'lucide-react';

export const ProductList = ({ 
  products, 
  loading, 
  onEdit, 
  onDelete, 
  onView 
}) => {
  const [selectedProducts, setSelectedProducts] = useState([]);

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedProducts(products.map(p => p.id || p._id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectProduct = (productId, checked) => {
    if (checked) {
      setSelectedProducts(prev => [...prev, productId]);
    } else {
      setSelectedProducts(prev => prev.filter(id => id !== productId));
    }
  };

  const handleBulkDelete = () => {
    if (selectedProducts.length === 0) return;
    
    if (confirm(`Delete ${selectedProducts.length} selected products?`)) {
      selectedProducts.forEach(id => onDelete(id));
      setSelectedProducts([]);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Bulk actions */}
      {selectedProducts.length > 0 && (
        <div className="bg-primary-50 px-6 py-3 border-b">
          <div className="flex items-center justify-between">
            <span className="text-sm text-primary-700">
              {selectedProducts.length} product(s) selected
            </span>
            <Button
              variant="danger"
              size="sm"
              onClick={handleBulkDelete}
            >
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <input
                type="checkbox"
                checked={selectedProducts.length === products.length && products.length > 0}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
            </TableHead>
            <TableHead>Product</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const productId = product.id || product._id;
            const isSelected = selectedProducts.includes(productId);
            
            return (
              <TableRow key={productId}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => handleSelectProduct(productId, e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                          <Package className="h-5 w-5 text-gray-500" />
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {product.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {truncateText(product.description, 50)}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-mono text-gray-900">
                    {product.sku}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-900">
                    {product.category}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(product.price || product.prices?.USD, product.currency || 'USD')}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`text-sm font-medium ${
                    (product.stock?.quantity || product.stock) < 5 
                      ? 'text-red-600' 
                      : 'text-gray-900'
                  }`}>
                    {product.stock?.quantity || product.stock}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(product.status || 'active')}>
                    {product.status || 'active'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(product)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(product)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(productId)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {products.length === 0 && (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No products</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new product.
          </p>
        </div>
      )}
    </div>
  );
};
