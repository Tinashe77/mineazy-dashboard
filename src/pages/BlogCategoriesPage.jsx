import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '../components/layout';
import { Button, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge, Alert, Modal, Input, Textarea } from '../components/ui';
import { formatDate, getStatusVariant } from '../utils';
import { Plus, Edit, Trash2 } from 'lucide-react';
import api from '../services/api';

export const BlogCategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', desc: '', slug: '' });

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getBlogCategories();
      setCategories(response.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load categories.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openForm = (category = null) => {
    if (category) {
      setSelectedCategory(category);
      setFormData({ name: category.name, desc: category.desc, slug: category.slug });
    } else {
      setSelectedCategory(null);
      setFormData({ name: '', desc: '', slug: '' });
    }
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (selectedCategory) {
        await api.updateBlogCategory(selectedCategory._id, formData);
      } else {
        await api.createBlogCategory(formData);
      }
      setShowForm(false);
      fetchCategories();
    } catch (err) {
      setError(err.message || 'Failed to save category.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await api.deleteBlogCategory(categoryId);
        fetchCategories();
      } catch (err) {
        setError(err.message || 'Failed to delete category.');
      }
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Blog Categories"
        subtitle="Manage your blog post categories"
      >
        <Button onClick={() => openForm()}>
          <Plus className="h-4 w-4 mr-2" />
          New Category
        </Button>
      </PageHeader>

      {error && <Alert variant="error" onClose={() => setError(null)}>{error}</Alert>}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created On</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div></TableCell></TableRow>
            ) : categories.map((cat) => (
              <TableRow key={cat._id}>
                <TableCell className="font-medium">{cat.name}</TableCell>
                <TableCell>{cat.slug}</TableCell>
                <TableCell>{cat.desc}</TableCell>
                <TableCell><Badge variant={getStatusVariant(cat.isActive ? 'active' : 'inactive')}>{cat.isActive ? 'Active' : 'Inactive'}</Badge></TableCell>
                <TableCell>{formatDate(cat.createdAt)}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Button variant="ghost" size="sm" title="Edit Category" onClick={() => openForm(cat)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" title="Delete Category" onClick={() => handleDelete(cat._id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={selectedCategory ? 'Edit Category' : 'Create New Category'}>
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Name" name="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
          <Textarea label="Description" name="desc" value={formData.desc} onChange={(e) => setFormData({...formData, desc: e.target.value})} rows={3} required />
          <Input label="Slug" name="slug" value={formData.slug} onChange={(e) => setFormData({...formData, slug: e.target.value})} placeholder="auto-generated if empty" />
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" loading={loading}>{loading ? 'Saving...' : 'Save'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
