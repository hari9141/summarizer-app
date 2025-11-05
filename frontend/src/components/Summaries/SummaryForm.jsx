import React, { useState } from 'react';
import api from '../../services/api';

const SummaryForm = ({ article, onSummaryCreated }) => {
  const [length, setLength] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [aiInfo, setAiInfo] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setAiInfo('');

    if (!article) {
      setError('Please create an article first');
      return;
    }

    try {
      setLoading(true);
      setAiInfo('🤖 Generating summary with Cohere AI...');

      const response = await api.post('/summaries', {
        article_id: article.id,
        length: length,
      });

      setAiInfo('✅ Summary generated successfully!');
      
      if (onSummaryCreated) {
        onSummaryCreated(response.data.summary);
      }

      setTimeout(() => setAiInfo(''), 2000);

    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to generate summary';
      setError(`❌ ${errorMsg}`);
      console.error('Generate summary error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        🤖 Generate Summary with Cohere AI
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        {aiInfo && (
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
            {aiInfo}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Summary Length
          </label>
          <div className="grid grid-cols-3 gap-3">
            {['short', 'medium', 'long'].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setLength(option)}
                disabled={loading}
                className={`px-4 py-3 rounded-lg font-medium transition ${
                  length === option
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50'
                }`}
              >
                {option === 'short' && '📄 Short'}
                {option === 'medium' && '📋 Medium'}
                {option === 'long' && '📚 Long'}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {length === 'short' && '2-3 sentences (concise summary)'}
            {length === 'medium' && '4-5 sentences (balanced summary)'}
            {length === 'long' && '6-8 sentences (comprehensive summary)'}
          </p>
        </div>
        {article && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
            <p className="text-sm font-medium text-gray-900">
              📄 Article: {article.title}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {article.content.length} characters • {article.content.split(/\s+/).length} words
            </p>
            <p className="text-xs text-purple-600 font-medium mt-2">
              ✨ This will be summarized using Cohere AI (High Quality)
            </p>
          </div>
        )}
        <button
          type="submit"
          disabled={loading || !article}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Generating with AI...
            </span>
          ) : (
            '🚀 Generate Summary with Cohere AI'
          )}
        </button>
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 text-sm">
          <p className="text-purple-900">
            💡 <strong>Powered by Cohere AI:</strong> Enterprise-grade language model for accurate, natural summaries. Free tier: 100 API calls/month.
          </p>
        </div>
      </form>
    </div>
  );
};

export default SummaryForm;
