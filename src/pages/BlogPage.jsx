import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/layout';
import { Button, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge, Alert, Input, Select } from '../components/ui';
import { formatDate, getStatusVariant } from '../utils';
import { Plus, Edit, Trash2, Eye, UploadCloud, Archive } from 'lucide-react';
import api from '../services/api';

const statusOptions = [
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Archived' },
];

export const BlogPage = () => {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    search: '',
  });
  const navigate = useNavigate();

  const fetchBlogPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { ...filters, page: pagination.page, limit: pagination.limit, q: filters.search };
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });

      const response = await api.getBlogs(params);
      setPosts(response.data || []);
      setPagination(response.pagination || { page: 1, limit: 10, total: 0, pages: 1 });
    } catch (err) {
      setError(err.message || 'Failed to load blog posts.');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchBlogPosts();
  }, [fetchBlogPosts]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.getBlogCategories();
        setCategories(response.data || []);
      } catch (err) {
        console.error("Failed to fetch blog categories:", err);
      }
    };
    fetchCategories();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm('Are you sure you want to delete this blog post?')) {
      try {
        await api.deleteBlog(postId);
        fetchBlogPosts();
      } catch (err) {
        setError(err.message || 'Failed to delete post.');
      }
    }
  };

  const handlePublishPost = async (postId) => {
    if (window.confirm('Are you sure you want to publish this blog post?')) {
      try {
        await api.publishBlog(postId);
        fetchBlogPosts();
      } catch (err) {
        setError(err.message || 'Failed to publish post.');
      }
    }
  };

  const handleArchivePost = async (postId) => {
    if (window.confirm('Are you sure you want to archive this blog post?')) {
      try {
        await api.archiveBlog(postId);
        fetchBlogPosts();
      } catch (err) {
        setError(err.message || 'Failed to archive post.');
      }
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Blog Management"
        subtitle="Create, edit, and manage your blog posts"
      >
        <Button onClick={() => navigate('/blog/new')}>
          <Plus className="h-4 w-4 mr-2" />
          New Post
        </Button>
      </PageHeader>

      {error && <Alert variant="error" onClose={() => setError(null)}>{error}</Alert>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white rounded-lg shadow">
        <Input placeholder="Search posts..." name="search" value={filters.search} onChange={handleFilterChange} />
        <Select name="category" value={filters.category} onChange={handleFilterChange}>
          <option value="">All Categories</option>
          {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
        </Select>
        <Select name="status" value={filters.status} onChange={handleFilterChange}>
          <option value="">All Statuses</option>
          {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </Select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Published On</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div></TableCell></TableRow>
            ) : posts.length > 0 ? posts.map((post) => (
              <TableRow key={post._id}>
                <TableCell className="font-medium">{post.name}</TableCell>
                <TableCell>{post.category?.name || 'N/A'}</TableCell>
                <TableCell>{post.author?.name || 'N/A'}</TableCell>
                <TableCell><Badge variant={getStatusVariant(post.status)}>{post.status}</Badge></TableCell>
                <TableCell>{post.publishedAt ? formatDate(post.publishedAt) : 'Draft'}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Button variant="ghost" size="sm" title="Edit Post" onClick={() => navigate(`/blog/edit/${post._id}`)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" title="View Post" onClick={() => navigate(`/blog/slug/${post.slug}`)}><Eye className="h-4 w-4" /></Button>
                    {post.status === 'draft' && (
                      <Button variant="ghost" size="sm" title="Publish Post" onClick={() => handlePublishPost(post._id)}><UploadCloud className="h-4 w-4 text-green-600" /></Button>
                    )}
                    {post.status === 'published' && (
                      <Button variant="ghost" size="sm" title="Archive Post" onClick={() => handleArchivePost(post._id)}><Archive className="h-4 w-4 text-yellow-600" /></Button>
                    )}
                    <Button variant="ghost" size="sm" title="Delete Post" onClick={() => handleDeletePost(post._id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={6} className="text-center py-12"><p>No blog posts found.</p></TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-700">
          Page {pagination.page} of {pagination.pages}, Total {pagination.total} posts
        </span>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page <= 1}>Previous</Button>
          <Button variant="outline" onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page >= pagination.pages}>Next</Button>
        </div>
      </div>
    </div>
  );
};
