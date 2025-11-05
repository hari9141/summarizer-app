import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const ArticleList = ({ refreshTrigger }) => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchArticles();
  }, [page, refreshTrigger]);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get('/articles', {
        params: {
          page: page,
          per_page: 10,
        },
      });

      setArticles(response.data.articles);
      setTotalPages(response.data.pagination.pages);

    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to fetch articles';
      setError(errorMsg);
      console.error('Fetch articles error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (articleId) => {
    setDeletingId(articleId);

    try {
      await api.delete(`/articles/${articleId}`);
      
      setArticles(articles.filter(a => a.id !== articleId));
      
      setTimeout(() => {
        setDeletingId(null);
      }, 300);
      
    } catch (err) {
      setDeletingId(null);
      alert('Failed to delete article');
      console.error('Delete error:', err);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        📚 My Articles
      </h2>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search articles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <p className="text-xs text-gray-500 mt-1">
          Found {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''}
        </p>
      </div>

      {loading && (
        <div className="text-center py-8">
          <svg className="animate-spin h-8 w-8 mx-auto text-blue-600" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-600 mt-2">Loading articles...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {!loading && filteredArticles.length === 0 && !error && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-lg">No articles yet</p>
          <p className="text-sm">Create your first article to get started</p>
        </div>
      )}

      <div className="space-y-3">
        {filteredArticles.map((article) => (
          <div
            key={article.id}
            className={`bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200 hover:shadow-md transition-all duration-300 ${
              deletingId === article.id
                ? 'opacity-0 scale-95 h-0 overflow-hidden'
                : 'opacity-100 scale-100'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">
                  {article.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {article.content}
                </p>
              </div>
              <button
                onClick={() => handleDelete(article.id)}
                disabled={deletingId === article.id}
                className={`ml-2 px-3 py-2 rounded font-medium text-sm transition-all duration-200 ${
                  deletingId === article.id
                    ? 'bg-red-200 text-red-800 cursor-wait'
                    : 'text-red-600 hover:text-red-800 hover:bg-red-100'
                }`}
              >
                {deletingId === article.id ? '⏳ Deleting...' : '🗑️ Delete'}
              </button>
            </div>

            <div className="flex gap-4 text-xs text-gray-600">
              <span>📝 {article.content.length} chars</span>
              <span>💬 {article.summaries_count} summaries</span>
              <span>📅 {new Date(article.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-gray-700">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ArticleList;
