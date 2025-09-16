/ src/components/blog/BlogForm.jsx
import React, { useState, useEffect } from 'react';
import { Button, Input, Textarea, Select, Modal } from '../ui';
import { Upload, X, Eye } from 'lucide-react';

export const BlogForm = ({ 
  isOpen, 
  onClose, 
  post, 
  onSave, 
  loading = false 
}) => {
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    tags: '',
    status: 'draft',
    featuredImage: '',
  });
  
  const [selectedImage, setSelectedImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    if (post) {
      setFormData({
        title: post.title || '',
        slug: post.slug || '',
        content: post.content || '',
        excerpt: post.excerpt || '',
        tags: Array.isArray(post.tags) ? post.tags.join(', ') : post.tags || '',
        status: post.status || 'draft',
        featuredImage: post.featuredImage || '',
      });
    } else {
      setFormData({
        title: '',
        slug: '',
        content: '',
        excerpt: '',
        tags: '',
        status: 'draft',
        featuredImage: '',
      });
    }
    setSelectedImage(null);
    setErrors({});
    setPreviewMode(false);
  }, [post, isOpen]);

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug is required';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    }

    if (!formData.excerpt.trim()) {
      newErrors.excerpt = 'Excerpt is required';
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
      const postData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      };

      await onSave(postData, post?.id || post?._id);
      onClose();
    } catch (error) {
      console.error('Error saving blog post:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-generate slug from title
      if (field === 'title' && !post) {
        updated.slug = generateSlug(value);
      }
      
      return updated;
    });
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file
      const isValidType = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB

      if (!isValidType) {
        alert('Please select a valid image file (JPEG, PNG, GIF, WebP)');
        return;
      }

      if (!isValidSize) {
        alert('Image size must be less than 5MB');
        return;
      }

      setSelectedImage(file);
      // Create preview URL
      const imageUrl = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, featuredImage: imageUrl }));
    }
  };

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' },
    { value: 'archived', label: 'Archived' },
  ];

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={post ? 'Edit Blog Post' : 'Create New Blog Post'}
      size="xl"
    >
      <div className="space-y-6">
        {/* Header with preview toggle */}
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <Button
              type="button"
              variant={!previewMode ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setPreviewMode(false)}
            >
              Edit
            </Button>
            <Button
              type="button"
              variant={previewMode ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setPreviewMode(true)}
            >
              <Eye className="h-4 w-4 mr-1" />
              Preview
            </Button>
          </div>
          <Select
            value={formData.status}
            onChange={(e) => handleInputChange('status', e.target.value)}
            className="w-32"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        {previewMode ? (
          /* Preview Mode */
          <div className="border rounded-lg p-6 bg-gray-50 max-h-96 overflow-y-auto">
            {formData.featuredImage && (
              <img
                src={formData.featuredImage}
                alt="Featured"
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
            )}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {formData.title || 'Post Title'}
            </h1>
            <p className="text-gray-600 mb-4">
              {formData.excerpt || 'Post excerpt...'}
            </p>
            <div className="prose max-w-none">
              {formData.content.split('\n').map((paragraph, index) => (
                <p key={index} className="mb-3">
                  {paragraph}
                </p>
              ))}
            </div>
            {formData.tags && (
              <div className="mt-4 flex flex-wrap gap-2">
                {formData.tags.split(',').map((tag, index) => (
                  <span
                    key={index}
                    className="bg-primary-100 text-primary-700 px-2 py-1 rounded-full text-xs"
                  >
                    {tag.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Edit Mode */
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Post Title"
                required
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                error={errors.title}
                placeholder="Enter post title"
              />
              
              <Input
                label="URL Slug"
                required
                value={formData.slug}
                onChange={(e) => handleInputChange('slug', e.target.value)}
                error={errors.slug}
                placeholder="post-url-slug"
              />
            </div>

            <Textarea
              label="Excerpt"
              required
              rows={3}
              value={formData.excerpt}
              onChange={(e) => handleInputChange('excerpt', e.target.value)}
              error={errors.excerpt}
              placeholder="Brief description of the post..."
            />

            <Textarea
              label="Content"
              required
              rows={8}
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              error={errors.content}
              placeholder="Write your blog post content here..."
            />

            <Input
              label="Tags (comma separated)"
              value={formData.tags}
              onChange={(e) => handleInputChange('tags', e.target.value)}
              placeholder="mining, equipment, safety, industry"
            />

            {/* Featured Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Featured Image
              </label>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                {formData.featuredImage ? (
                  <div className="relative">
                    <img
                      src={formData.featuredImage}
                      alt="Featured"
                      className="w-full h-32 object-cover rounded"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, featuredImage: '' }));
                        setSelectedImage(null);
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="mx-auto h-8 w-8 text-gray-400" />
                    <div className="mt-2">
                      <label htmlFor="featured-image" className="cursor-pointer">
                        <span className="text-primary-600 hover:text-primary-500 font-medium">
                          Click to upload featured image
                        </span>
                      </label>
                      <input
                        id="featured-image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="sr-only"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG, GIF, WebP up to 5MB
                    </p>
                  </div>
                )}
              </div>

              {/* Or enter URL */}
              <div className="mt-2">
                <Input
                  placeholder="Or enter image URL"
                  value={!selectedImage ? formData.featuredImage : ''}
                  onChange={(e) => handleInputChange('featuredImage', e.target.value)}
                  disabled={!!selectedImage}
                />
              </div>
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
                {post ? 'Update Post' : 'Create Post'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
