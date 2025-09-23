import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/layout';
import { Button, Input, Select, Textarea, Alert, Card } from '../components/ui';
import { Save, Image as ImageIcon, Tag, Globe, Type } from 'lucide-react';
import api from '../services/api';

export const BlogPostForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    name: '',
    desc: '',
    content: '',
    category: '',
    excerpt: '',
    slug: '',
    tags: '',
    metaTitle: '',
    metaDescription: '',
    keywords: '',
    status: 'draft',
  });
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPostAndCategories = async () => {
      setLoading(true);
      try {
        const catResponse = await api.getBlogCategories();
        setCategories(catResponse.data || []);

        if (isEditing) {
          const postResponse = await api.getBlogById(id);
          const post = postResponse.data;
          setFormData({
            name: post.name || '',
            desc: post.desc || '',
            content: post.content || '',
            category: post.category?._id || '',
            excerpt: post.excerpt || '',
            slug: post.slug || '',
            tags: (post.tags || []).join(', '),
            metaTitle: post.seo?.metaTitle || '',
            metaDescription: post.seo?.metaDescription || '',
            keywords: (post.seo?.keywords || []).join(', '),
            status: post.status || 'draft',
          });
        }
      } catch (err) {
        setError(err.message || 'Failed to load data.');
      } finally {
        setLoading(false);
      }
    };
    fetchPostAndCategories();
  }, [id, isEditing]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    setImages([...e.target.files]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const postData = new FormData();
    postData.append('name', formData.name);
    postData.append('desc', formData.desc);
    postData.append('content', formData.content);
    postData.append('category', formData.category);
    if (formData.excerpt) postData.append('excerpt', formData.excerpt);
    if (formData.slug) postData.append('slug', formData.slug);
    if (formData.tags) postData.append('tags', formData.tags);

    const seo = {
        metaTitle: formData.metaTitle,
        metaDescription: formData.metaDescription,
        keywords: formData.keywords.split(',').map(k => k.trim()),
    };
    postData.append('seo', JSON.stringify(seo));

    for (let i = 0; i < images.length; i++) {
      postData.append('images', images[i]);
    }

    try {
      if (isEditing) {
        await api.updateBlog(id, postData);
      } else {
        await api.createBlog(postData);
      }
      navigate('/blog');
    } catch (err) {
      setError(err.message || 'Failed to save blog post.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEditing ? 'Edit Blog Post' : 'Create New Blog Post'}
        subtitle="Fill in the details to create or update your post"
        onBack={() => navigate('/blog')}
      >
        <Button onClick={handleSubmit} loading={loading} disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {isEditing ? 'Save Changes' : 'Create Post'}
        </Button>
      </PageHeader>

      {error && <Alert variant="error" onClose={() => setError(null)}>{error}</Alert>}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="p-6 space-y-4">
              <h3 className="text-lg font-semibold flex items-center"><Type className="h-5 w-5 mr-2" />Content</h3>
              <Input label="Post Title" name="name" value={formData.name} onChange={handleInputChange} required />
              <Textarea label="Description" name="desc" value={formData.desc} onChange={handleInputChange} rows={3} />
              <Textarea label="Main Content" name="content" value={formData.content} onChange={handleInputChange} rows={15} required />
            </div>
          </Card>
          <Card>
            <div className="p-6 space-y-4">
              <h3 className="text-lg font-semibold flex items-center"><Globe className="h-5 w-5 mr-2" />SEO</h3>
              <Input label="Meta Title" name="metaTitle" value={formData.metaTitle} onChange={handleInputChange} />
              <Textarea label="Meta Description" name="metaDescription" value={formData.metaDescription} onChange={handleInputChange} rows={2} />
              <Input label="Keywords (comma-separated)" name="keywords" value={formData.keywords} onChange={handleInputChange} />
            </div>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <div className="p-6 space-y-4">
              <h3 className="text-lg font-semibold flex items-center"><Tag className="h-5 w-5 mr-2" />Details</h3>
              <Select label="Category" name="category" value={formData.category} onChange={handleInputChange} required>
                <option value="">Select a category</option>
                {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
              </Select>
              <Input label="Tags (comma-separated)" name="tags" value={formData.tags} onChange={handleInputChange} />
              <Input label="URL Slug" name="slug" value={formData.slug} onChange={handleInputChange} placeholder="auto-generated if empty" />
              <Textarea label="Excerpt" name="excerpt" value={formData.excerpt} onChange={handleInputChange} rows={3} placeholder="auto-generated if empty" />
            </div>
          </Card>
          <Card>
            <div className="p-6 space-y-4">
              <h3 className="text-lg font-semibold flex items-center"><ImageIcon className="h-5 w-5 mr-2" />Images</h3>
              <Input type="file" label="Upload Images" name="images" onChange={handleImageChange} multiple />
            </div>
          </Card>
        </div>
      </form>
    </div>
  );
};
