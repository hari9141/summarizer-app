import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const History = () => {
  const navigate = useNavigate();
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchSummaries();
  }, []);

  const fetchSummaries = async () => {
    try {
      setLoading(true);
      const response = await api.get('/summaries', {
        params: { page: 1, per_page: 100 },
      });
      setSummaries(response.data.summaries || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (summaryId) => {
    setDeletingId(summaryId);
    try {
      await api.delete(`/summaries/${summaryId}`);
      setSummaries(summaries.filter(s => s.id !== summaryId));
    } catch (err) {
      alert('Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4">
        
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-6 text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2"
        >
          ← Back to Dashboard
        </button>

        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-8">
          
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            📚 Summary History
          </h1>
          <p className="text-gray-600 mb-8">
            All your generated summaries
          </p>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Loading summaries...</p>
            </div>
          ) : summaries.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-gray-600 mb-4">No summaries yet</p>
              <button
                onClick={() => navigate('/summarizer')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg"
              >
                Create Your First Summary
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {summaries.map((summary) => (
                <div
                  key={summary.id}
                  className={`bg-green-50 rounded-lg p-6 border border-green-200 hover:shadow-md transition-all ${
                    deletingId === summary.id ? 'opacity-0' : 'opacity-100'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">
                        {summary.article.title}
                      </h3>
                      <span className={`mt-2 inline-block px-3 py-1 rounded text-sm font-medium ${
                        summary.length === 'short' ? 'bg-green-200 text-green-800' :
                        summary.length === 'medium' ? 'bg-blue-200 text-blue-800' :
                        'bg-purple-200 text-purple-800'
                      }`}>
                        {summary.length}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDelete(summary.id)}
                      disabled={deletingId === summary.id}
                      className="text-red-600 hover:bg-red-100 p-2 rounded text-xl"
                    >
                      🗑️
                    </button>
                  </div>

                  <p className="text-gray-700 mb-3 leading-relaxed">
                    {summary.summary_text}
                  </p>

                  <div className="flex gap-4 text-xs text-gray-600">
                    <span> {summary.summary_text.length} chars</span>
                    <span> {new Date(summary.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default History;
