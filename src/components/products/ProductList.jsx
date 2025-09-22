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

  // Helper function to extract price value
  const getProductPrice = (product) => {
    // Try different price structures
    if (product.price?.regular_price) return product.price.regular_price;
    if (product.price?.usd) return product.price.usd;
    if (product.regular_price) return product.regular_price;
    if (typeof product.price === 'number') return product.price;
    if (product.prices?.USD) return product.prices.USD;
    return 0;
  };

  // Helper function to get category name
  const getCategoryName = (product) => {
    if (product.category?.name) return product.category.name;
    if (typeof product.category === 'string') return product.category;
    return 'No Category';
  };

  // Helper function to get stock value
  const getStockValue = (product) => {
    if (product.stock?.quantity !== undefined) return product.stock.quantity;
    if (typeof product.stock === 'number') return product.stock;
    return 0;
  };

  // Helper function to get product status
  const getProductStatus = (product) => {
    if (product.isActive === false) return 'inactive';
    if (product.status) return product.status;
    return 'active';
  };

  // Helper function to get product description
  const getProductDescription = (product) => {
    return product.desc || product.description || '';
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
            const stockValue = getStockValue(product);
            const productPrice = getProductPrice(product);
            const productStatus = getProductStatus(product);
            
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
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className={`h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center ${
                          product.images && product.images.length > 0 ? 'hidden' : ''
                        }`}
                      >
                        <Package className="h-5 w-5 text-gray-500" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {product.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {truncateText(getProductDescription(product), 50)}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-mono text-gray-900">
                    {product.sku || 'N/A'}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-900">
                    {getCategoryName(product)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">
                      {formatCurrency(productPrice, product.currency || 'USD')}
                    </div>
                    {/* Show ZWG price if available */}
                    {product.price?.currency?.zwg && (
                      <div className="text-gray-500 text-xs">
                        ZWG {product.price.currency.zwg.toLocaleString()}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <span className={`text-sm font-medium ${
                      stockValue < 5 
                        ? 'text-red-600' 
                        : stockValue < 10
                        ? 'text-yellow-600'
                        : 'text-gray-900'
                    }`}>
                      {stockValue}
                    </span>
                    {stockValue < 5 && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                        Low Stock
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(productStatus)}>
                    {productStatus}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {onView && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(product)}
                        title="Preview Product"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(product)}
                        title="Edit Product"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Delete product "${product.name}"?`)) {
                            onDelete(productId);
                          }
                        }}
                        title="Delete Product"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
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