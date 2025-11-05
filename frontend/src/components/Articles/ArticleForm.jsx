import React, { useState } from 'react';
import api from '../../services/api';

const ArticleForm = ({ onArticleCreated }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const titleLength = title.length;
  const contentLength = content.length;
  const contentWords = content.trim() ? content.trim().split(/\s+/).length : 0;

  const validateForm = () => {
    if (!title.trim()) {
      setError('Title is required');
      return false;
    }

    if (title.length < 5) {
      setError('Title must be at least 5 characters');
      return false;
    }

    if (title.length > 200) {
      setError('Title cannot exceed 200 characters');
      return false;
    }

    if (!content.trim()) {
      setError('Content is required');
      return false;
    }

    if (content.length < 20) {
      setError('Content must be at least 20 characters');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const response = await api.post('/articles', {
        title: title.trim(),
        content: content.trim(),
      });

      setSuccess('Article created successfully!');
      
      if (onArticleCreated) {
        onArticleCreated(response.data.article);
      }

      setTimeout(() => {
        setTitle('');
        setContent('');
        setSuccess('');
      }, 1500);

    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to create article. Please try again.';
      setError(errorMsg);
      console.error('Create article error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        📝 Create Article
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-start gap-3">
            <span className="text-xl">❌</span>
            <p>{error}</p>
          </div>
        )}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded flex items-start gap-3">
            <span className="text-xl">✅</span>
            <p>{success}</p>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Article Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setError('');
            }}
            placeholder="Enter article title..."
            maxLength={200}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition ${
              error && !title.trim()
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
            disabled={loading}
          />
          <div className="flex justify-between mt-1">
            <p className={`text-xs ${titleLength >= 200 ? 'text-red-500' : 'text-gray-500'}`}>
              {titleLength}/200 characters
            </p>
            <p className="text-xs text-gray-500">
              Minimum: 5 characters
            </p>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Article Content *
          </label>
          <textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              setError('');
            }}
            placeholder="Paste or type your article content here..."
            rows={10}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition resize-none ${
              error && !content.trim()
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
            disabled={loading}
          />
          <div className="flex justify-between mt-1">
            <span className={`text-xs ${contentLength < 20 ? 'text-red-500' : 'text-gray-500'}`}>
              {contentLength} characters (minimum 20)
            </span>
            <span className="text-xs text-gray-500">
              {contentWords} words
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !title.trim() || !content.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Creating Article...
            </span>
          ) : (
            '✨ Create Article'
          )}
        </button>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900">
          💡 <strong>Tip:</strong> Write longer articles for better summaries. Include key points and detailed information.
        </div>
      </form>
    </div>
  );
};

export default ArticleForm;
