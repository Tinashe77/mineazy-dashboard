// src/components/blog/BlogList.jsx
import React, { useState } from 'react';
import { Button, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui';
import { formatDate, getStatusVariant, truncateText } from '../../utils';
import { Edit, Trash2, Eye, FileText, ExternalLink } from 'lucide-react';

export const BlogList = ({ 
  posts, 
  loading, 
  onEdit, 
  onDelete, 
  onView 
}) => {
  const [selectedPosts, setSelectedPosts] = useState([]);

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedPosts(posts.map(p => p.id || p._id));
    } else {
      setSelectedPosts([]);
    }
  };

  const handleSelectPost = (postId, checked) => {
    if (checked) {
      setSelectedPosts(prev => [...prev, postId]);
    } else {
      setSelectedPosts(prev => prev.filter(id => id !== postId));
    }
  };

  const handleBulkDelete = () => {
    if (selectedPosts.length === 0) return;
    
    if (confirm(`Delete ${selectedPosts.length} selected posts?`)) {
      selectedPosts.forEach(id => onDelete(id));
      setSelectedPosts([]);
    }
  };

  const getStatusVariantForPost = (status) => {
    const statusMap = {
      'published': 'success',
      'draft': 'warning',
      'archived': 'default',
    };
    return statusMap[status] || 'default';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading blog posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Bulk actions */}
      {selectedPosts.length > 0 && (
        <div className="bg-primary-50 px-6 py-3 border-b">
          <div className="flex items-center justify-between">
            <span className="text-sm text-primary-700">
              {selectedPosts.length} post(s) selected
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
                checked={selectedPosts.length === posts.length && posts.length > 0}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
            </TableHead>
            <TableHead>Post</TableHead>
            <TableHead>Author</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead>Published</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts.map((post) => {
            const postId = post.id || post._id;
            const isSelected = selectedPosts.includes(postId);
            
            return (
              <TableRow key={postId}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => handleSelectPost(postId, e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0">
                      {post.featuredImage ? (
                        <img
                          src={post.featuredImage}
                          alt={post.title}
                          className="h-10 w-10 rounded object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded bg-gray-200 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-gray-500" />
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {post.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {truncateText(post.excerpt, 60)}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-900">
                    {post.author?.name || post.createdBy || 'Admin'}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariantForPost(post.status)}>
                    {post.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {(post.tags || []).slice(0, 2).map((tag, index) => (
                      <span
                        key={index}
                        className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                    {(post.tags || []).length > 2 && (
                      <span className="text-xs text-gray-500">
                        +{(post.tags || []).length - 2} more
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-900">
                    {formatDate(post.publishedAt || post.createdAt)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(post)}
                      title="Preview"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(post)}
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {post.status === 'published' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                        title="View Live"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(postId)}
                      title="Delete"
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

      {posts.length === 0 && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No blog posts</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first blog post.
          </p>
        </div>
      )}
    </div>
  );
};
