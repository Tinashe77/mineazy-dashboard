// src/components/products/ProductViewModal.jsx
import React, { useState } from 'react';
import { Modal, Badge } from '../ui';
import { formatCurrency, formatDate, getStatusVariant } from '../../utils';
import { 
  Package, 
  DollarSign, 
  Calendar, 
  Tag, 
  Building2, 
  BarChart3, 
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';

export const ProductViewModal = ({ 
  isOpen, 
  onClose, 
  product 
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!product) return null;

  // Helper functions to extract data properly
  const getProductPrice = (product) => {
    if (product.price?.regular_price) return product.price.regular_price;
    if (product.price?.usd) return product.price.usd;
    if (product.regular_price) return product.regular_price;
    if (typeof product.price === 'number') return product.price;
    return 0;
  };

  const getSalePrice = (product) => {
    if (product.price?.sale_price) return product.price.sale_price;
    if (product.sale_price) return product.sale_price;
    return null;
  };

  const getZwgPrice = (product) => {
    if (product.price?.currency?.zwg) return product.price.currency.zwg;
    if (product.price?.zwg) return product.price.zwg;
    if (product.zwg_price) return product.zwg_price;
    return null;
  };

  const getCategoryName = (product) => {
    if (product.category?.name) return product.category.name;
    if (typeof product.category === 'string') return product.category;
    return 'No Category';
  };

  const getBranchName = (product) => {
    if (product.branch?.name) return product.branch.name;
    if (typeof product.branch === 'string') return product.branch;
    return 'All Branches';
  };

  const getStockValue = (product) => {
    if (product.stock?.quantity !== undefined) return product.stock.quantity;
    if (typeof product.stock === 'number') return product.stock;
    return 0;
  };

  const getProductStatus = (product) => {
    if (product.isActive === false) return 'inactive';
    if (product.status) return product.status;
    return 'active';
  };

  const getProductImages = (product) => {
    if (product.images && Array.isArray(product.images)) {
      return product.images.filter(img => img && img.trim() !== '');
    }
    return [];
  };

  const getProductTags = (product) => {
    if (Array.isArray(product.tags)) return product.tags;
    if (typeof product.tags === 'string') {
      return product.tags.split(',').map(tag => tag.trim()).filter(Boolean);
    }
    return [];
  };

  const regularPrice = getProductPrice(product);
  const salePrice = getSalePrice(product);
  const zwgPrice = getZwgPrice(product);
  const stockValue = getStockValue(product);
  const productStatus = getProductStatus(product);
  const images = getProductImages(product);
  const tags = getProductTags(product);

  const nextImage = () => {
    if (images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }
  };

  const prevImage = () => {
    if (images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  const handleImageError = (e) => {
    e.target.style.display = 'none';
    if (e.target.nextSibling) {
      e.target.nextSibling.style.display = 'flex';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="xl"
    >
      <div className="max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
            <p className="text-sm text-gray-500 mt-1">SKU: {product.sku}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={getStatusVariant(productStatus)}>
              {productStatus}
            </Badge>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Images */}
          <div>
            {/* Main Image */}
            <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-square mb-4">
              {images.length > 0 ? (
                <>
                  <img
                    src={images[currentImageIndex]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={handleImageError}
                  />
                  <div className="hidden w-full h-full bg-gray-200 items-center justify-center">
                    <ImageIcon className="h-16 w-16 text-gray-400" />
                  </div>
                  
                  {/* Navigation arrows */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </>
                  )}

                  {/* Image counter */}
                  {images.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                      {currentImageIndex + 1} / {images.length}
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <ImageIcon className="h-16 w-16 text-gray-400" />
                  <span className="ml-2 text-gray-500">No images</span>
                </div>
              )}
            </div>

            {/* Thumbnail Images */}
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`aspect-square rounded overflow-hidden border-2 ${
                      currentImageIndex === index 
                        ? 'border-primary-500' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={handleImageError}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Product Details */}
          <div className="space-y-6">
            {/* Price Section */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Pricing</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Regular Price:</span>
                  <span className={`font-semibold ${salePrice ? 'line-through text-gray-500' : 'text-green-600'}`}>
                    {formatCurrency(regularPrice, 'USD')}
                  </span>
                </div>
                {salePrice && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Sale Price:</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(salePrice, 'USD')}
                    </span>
                  </div>
                )}
                {zwgPrice && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">ZWG Price:</span>
                    <span className="font-medium text-gray-900">
                      ZWG {zwgPrice.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Product Details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Product Details</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Package className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-gray-600 mr-2">Category:</span>
                  <span className="font-medium">{getCategoryName(product)}</span>
                </div>

                {product.subcategory && (
                  <div className="flex items-center">
                    <Tag className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-gray-600 mr-2">Subcategory:</span>
                    <span className="font-medium">{product.subcategory}</span>
                  </div>
                )}

                <div className="flex items-center">
                  <Building2 className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-gray-600 mr-2">Branch:</span>
                  <span className="font-medium">{getBranchName(product)}</span>
                </div>

                <div className="flex items-center">
                  <BarChart3 className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-gray-600 mr-2">Stock:</span>
                  <span className={`font-medium ${
                    stockValue < 5 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {stockValue} units
                    {stockValue < 5 && (
                      <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                        Low Stock
                      </span>
                    )}
                  </span>
                </div>

                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-gray-600 mr-2">Created:</span>
                  <span className="font-medium">{formatDate(product.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            {(product.desc || product.description) && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {product.desc || product.description}
                  </p>
                </div>
              </div>
            )}

            {/* Tags */}
            {tags.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Info */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Additional Information</h3>
              <div className="text-sm text-blue-800 space-y-1">
                <div>Product ID: {product.id || product._id}</div>
                <div>Last Updated: {formatDate(product.updatedAt || product.createdAt)}</div>
                {product.vendor && (
                  <div>Vendor: {product.vendor.name || product.vendor}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};