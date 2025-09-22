// src/components/products/ProductForm.jsx
import React, { useState, useEffect } from 'react';
import { Button, Input, Select, Textarea, Modal } from '../ui';
import { Upload, X } from 'lucide-react';
import api from '../../services/api';

export const ProductForm = ({ 
  isOpen, 
  onClose, 
  product, 
  onSave, 
  loading = false 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    desc: '', // Changed from description to desc
    regular_price: '',
    sale_price: '',
    usd_price: '',
    zwg_price: '',
    category: '',
    subcategory: '',
    branch: '',
    stock: '',
    sku: '',
    tags: '',
    isActive: true,
  });
  
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [imageUrls, setImageUrls] = useState('');
  const [errors, setErrors] = useState({});
  const [categories, setCategories] = useState([]);
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    loadCategories();
    loadBranches();
  }, []);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        desc: product.desc || product.description || '',
        regular_price: product.price?.regular_price || product.regular_price || product.price || '',
        sale_price: product.price?.sale_price || product.sale_price || '',
        usd_price: product.price?.usd_price || product.usd_price || product.price || '',
        zwg_price: product.price?.zwg_price || product.zwg_price || '',
        category: product.category?._id || product.category || '',
        subcategory: product.subcategory || '',
        branch: product.branch?._id || product.branch || '',
        stock: product.stock?.quantity || product.stock || '',
        sku: product.sku || '',
        tags: Array.isArray(product.tags) ? product.tags.join(', ') : product.tags || '',
        isActive: product.isActive !== false,
      });
    } else {
      // Reset form for new product
      setFormData({
        name: '',
        desc: '',
        regular_price: '',
        sale_price: '',
        usd_price: '',
        zwg_price: '',
        category: '',
        subcategory: '',
        branch: '',
        stock: '',
        sku: '',
        tags: '',
        isActive: true,
      });
    }
    setSelectedFiles([]);
    setImageUrls('');
    setErrors({});
  }, [product, isOpen]);

  const loadCategories = async () => {
    try {
      const response = await api.getCategories();
      setCategories(response.data || response || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadBranches = async () => {
    try {
      const response = await api.getBranches();
      setBranches(response.data || response || []);
    } catch (error) {
      console.error('Failed to load branches:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!formData.sku.trim()) {
      newErrors.sku = 'SKU is required';
    }

    if (!formData.regular_price || formData.regular_price <= 0) {
      newErrors.regular_price = 'Valid price is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.stock || formData.stock < 0) {
      newErrors.stock = 'Valid stock quantity is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const formDataToSend = new FormData();
      
      // Add all fields with correct names as per API
      formDataToSend.append('name', formData.name);
      formDataToSend.append('desc', formData.desc); // Using desc instead of description
      formDataToSend.append('regular_price', formData.regular_price);
      
      if (formData.sale_price) {
        formDataToSend.append('sale_price', formData.sale_price);
      }
      
      // Add both USD and ZWG prices
      formDataToSend.append('usd_price', formData.usd_price || formData.regular_price);
      formDataToSend.append('zwg_price', formData.zwg_price || (formData.regular_price * 50)); // Default conversion
      
      formDataToSend.append('category', formData.category);
      formDataToSend.append('subcategory', formData.subcategory);
      
      if (formData.branch) {
        formDataToSend.append('branch', formData.branch);
      }
      
      formDataToSend.append('stock', formData.stock);
      formDataToSend.append('sku', formData.sku);
      formDataToSend.append('tags', formData.tags);
      formDataToSend.append('isActive', formData.isActive.toString());

      // Add image files
      selectedFiles.forEach(file => {
        formDataToSend.append('images', file);
      });

      // Add image URLs if provided
      if (imageUrls.trim()) {
        formDataToSend.append('imageUrls', imageUrls);
      }

      // Debug: Log what we're sending
      console.log('Sending product data:');
      for (let [key, value] of formDataToSend.entries()) {
        if (value instanceof File) {
          console.log(`${key}: [File] ${value.name}`);
        } else {
          console.log(`${key}: ${value}`);
        }
      }

      await onSave(formDataToSend, product?.id || product?._id);
      onClose();
    } catch (error) {
      console.error('Error saving product:', error);
      setErrors({ submit: error.message });
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    const validFiles = files.filter(file => {
      const isValidType = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
      return isValidType && isValidSize;
    });

    if (validFiles.length !== files.length) {
      alert('Some files were rejected. Please ensure all files are images under 5MB.');
    }

    setSelectedFiles(prev => [...prev, ...validFiles].slice(0, 10));
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-calculate ZWG price when USD price changes
    if (field === 'usd_price' || field === 'regular_price') {
      const usdValue = parseFloat(value) || 0;
      setFormData(prev => ({ 
        ...prev, 
        [field]: value,
        zwg_price: (usdValue * 50).toString() // Auto-calculate with 1:50 rate
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={product ? 'Edit Product' : 'Add New Product'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto px-1">
        {errors.submit && (
          <div className="bg-red-50 text-red-700 p-3 rounded">
            {errors.submit}
          </div>
        )}

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Product Name"
            required
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            error={errors.name}
            placeholder="Enter product name"
          />
          
          <Input
            label="SKU"
            required
            value={formData.sku}
            onChange={(e) => handleInputChange('sku', e.target.value.toUpperCase())}
            error={errors.sku}
            placeholder="Enter product SKU"
          />
        </div>

        <Textarea
          label="Description"
          rows={3}
          value={formData.desc}
          onChange={(e) => handleInputChange('desc', e.target.value)}
          placeholder="Enter product description"
        />

        {/* Pricing */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            label="Regular Price (USD)"
            type="number"
            step="0.01"
            required
            value={formData.regular_price}
            onChange={(e) => handleInputChange('regular_price', e.target.value)}
            error={errors.regular_price}
            placeholder="0.00"
          />

          <Input
            label="Sale Price (USD)"
            type="number"
            step="0.01"
            value={formData.sale_price}
            onChange={(e) => handleInputChange('sale_price', e.target.value)}
            placeholder="0.00"
          />

          <Input
            label="USD Price"
            type="number"
            step="0.01"
            value={formData.usd_price}
            onChange={(e) => handleInputChange('usd_price', e.target.value)}
            placeholder="0.00"
          />

          <Input
            label="ZWG Price"
            type="number"
            step="0.01"
            value={formData.zwg_price}
            onChange={(e) => handleInputChange('zwg_price', e.target.value)}
            placeholder="0.00"
          />
        </div>

        {/* Category and Stock */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select
            label="Category"
            required
            value={formData.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
            error={errors.category}
          >
            <option value="">Select Category</option>
            {categories.map(category => (
              <option key={category._id || category.id} value={category._id || category.id}>
                {category.name}
              </option>
            ))}
          </Select>

          <Input
            label="Subcategory"
            value={formData.subcategory}
            onChange={(e) => handleInputChange('subcategory', e.target.value)}
            placeholder="e.g., Excavators"
          />

          <Select
            label="Branch"
            value={formData.branch}
            onChange={(e) => handleInputChange('branch', e.target.value)}
          >
            <option value="">All Branches</option>
            {branches.map(branch => (
              <option key={branch._id || branch.id} value={branch._id || branch.id}>
                {branch.name}
              </option>
            ))}
          </Select>

          <Input
            label="Stock Quantity"
            type="number"
            required
            value={formData.stock}
            onChange={(e) => handleInputChange('stock', e.target.value)}
            error={errors.stock}
            placeholder="0"
          />
        </div>

        <Input
          label="Tags (comma separated)"
          value={formData.tags}
          onChange={(e) => handleInputChange('tags', e.target.value)}
          placeholder="mining, equipment, heavy-duty"
        />

        {/* Image Upload Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Images
          </label>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <div className="text-center">
              <Upload className="mx-auto h-8 w-8 text-gray-400" />
              <div className="mt-2">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="text-primary-600 hover:text-primary-500 font-medium">
                    Click to upload
                  </span>
                  <span className="text-gray-500"> or drag and drop</span>
                </label>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG, GIF, WebP up to 5MB each (max 10 images)
              </p>
            </div>
          </div>

          {/* Image URLs Input */}
          <div className="mt-3">
            <Input
              label="Or enter image URLs (comma separated)"
              value={imageUrls}
              onChange={(e) => setImageUrls(e.target.value)}
              placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
            />
          </div>

          {/* Selected Files Preview */}
          {selectedFiles.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Selected Images ({selectedFiles.length}/10)
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Active Status */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="active"
            checked={formData.isActive}
            onChange={(e) => handleInputChange('isActive', e.target.checked)}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
            Active Product
          </label>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
          >
            {product ? 'Update Product' : 'Create Product'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};