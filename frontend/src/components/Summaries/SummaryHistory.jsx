import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const SummaryHistory = ({ refreshTrigger }) => {
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchSummaries();
  }, [page, refreshTrigger]);

  const fetchSummaries = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get('/summaries', {
        params: {
          page: page,
          per_page: 10,
        },
      });

      setSummaries(response.data.summaries);
      setTotalPages(response.data.pagination.pages);

    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to fetch summaries';
      setError(errorMsg);
      console.error('Fetch summaries error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (summaryId) => {
    setDeletingId(summaryId);

    try {
      await api.delete(`/summaries/${summaryId}`);
      
      setSummaries(summaries.filter(s => s.id !== summaryId));
      
      setTimeout(() => {
        setDeletingId(null);
      }, 300);
      
    } catch (err) {
      setDeletingId(null);
      alert('Failed to delete summary');
      console.error('Delete error:', err);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        ✨ Summary History
      </h2>

      {loading && (
        <div className="text-center py-8">
          <svg className="animate-spin h-8 w-8 mx-auto text-blue-600" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-600 mt-2">Loading summaries...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {!loading && summaries.length === 0 && !error && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-lg">No summaries yet</p>
          <p className="text-sm">Create an article and generate a summary</p>
        </div>
      )}

      <div className="space-y-3">
        {summaries.map((summary) => (
          <div
            key={summary.id}
            className={`bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200 hover:shadow-md transition-all duration-300 ${
              deletingId === summary.id
                ? 'opacity-0 scale-95 h-0 overflow-hidden'
                : 'opacity-100 scale-100'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-gray-900">
                    {summary.article.title}
                  </h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    summary.length === 'short' ? 'bg-green-200 text-green-800' :
                    summary.length === 'medium' ? 'bg-blue-200 text-blue-800' :
                    'bg-purple-200 text-purple-800'
                  }`}>
                    {summary.length}
                  </span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {summary.summary_text}
                </p>
              </div>
              <button
                onClick={() => handleDelete(summary.id)}
                disabled={deletingId === summary.id}
                className={`ml-2 px-3 py-2 rounded font-medium text-sm transition-all duration-200 ${
                  deletingId === summary.id
                    ? 'bg-red-200 text-red-800 cursor-wait'
                    : 'text-red-600 hover:text-red-800 hover:bg-red-100'
                }`}
              >
                {deletingId === summary.id ? '⏳ Deleting...' : '🗑️ Delete'}
              </button>
            </div>

            <div className="flex gap-4 text-xs text-gray-600">
              <span>📊 {summary.summary_text.length} chars</span>
              <span>📅 {new Date(summary.created_at).toLocaleDateString()}</span>
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

export default SummaryHistory;
