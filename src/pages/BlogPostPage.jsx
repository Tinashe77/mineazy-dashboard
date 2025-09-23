import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader } from '../components/layout';
import { Badge, Alert, Card } from '../components/ui';
import { formatDate } from '../utils';
import api from '../services/api';

export const BlogPostPage = () => {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const response = await api.getBlogBySlug(slug);
        setPost(response.data);
      } catch (err) {
        setError(err.message || 'Failed to load post.');
      } finally {
        setLoading(false);
      }
    };
    if (slug) {
      fetchPost();
    }
  }, [slug]);

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (error) {
    return <Alert variant="error">{error}</Alert>;
  }

  if (!post) {
    return <p>Post not found.</p>;
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <article className="space-y-8">
        <header className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">{post.name}</h1>
          <div className="mt-4 flex items-center justify-center space-x-4 text-sm text-gray-500">
            <span>By {post.author?.name || 'Unknown'}</span>
            <span>&bull;</span>
            <span>{formatDate(post.publishedAt)}</span>
            <span>&bull;</span>
            <span>{post.readingTime} min read</span>
          </div>
          <div className="mt-4">
            <Badge variant="secondary">{post.category?.name}</Badge>
          </div>
        </header>

        {post.image && post.image[0] && (
          <figure>
            <img src={post.image[0]} alt={post.name} className="w-full h-auto object-cover rounded-lg" />
          </figure>
        )}

        <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />

        <footer className="border-t pt-8">
          <div className="flex flex-wrap gap-2">
            <span className="font-semibold">Tags:</span>
            {(post.tags || []).map(tag => (
              <Badge key={tag} variant="outline">{tag}</Badge>
            ))}
          </div>
        </footer>
      </article>
    </div>
  );
};
