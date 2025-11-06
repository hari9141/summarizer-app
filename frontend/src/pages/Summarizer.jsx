import React, { useState, useContext , useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const Summarizer = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const sleep = (ms) => new Promise(res => setTimeout(res, ms));
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [summary, setSummary] = useState(null);
  const [summaryLength, setSummaryLength] = useState('medium');
  const pollingRef = useRef(false);
  const [taskId, setTaskId] = useState(null);
  const contentLength = content.length;
  const contentWords = content.trim() ? content.trim().split(/\s+/).length : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSummary(null);
    setTaskId(null);
  
    if (!content.trim() || content.length < 50) {
      setError('Content must be at least 50 characters');
      return;
    }
  
    try {
      setLoading(true);
      const articleTitle = content.substring(0, 50);
      const originalLength = content.length;
  
      // Step 1: Create article
      const articleRes = await api.post('/articles', {
        title: articleTitle,
        content: content.trim(),
      });
  
      const articleId = articleRes.data.article.id;
      setSuccess('📝 Article saved. Generating summary...');
  
      // Step 2: Queue summarization task (returns immediately)
      const summaryRes = await api.post('/summaries', {
        article_id: articleId,
        length: summaryLength,
      });
  
      const { task_id } = summaryRes.data;
      setTaskId(task_id);
      pollingRef.current = true;
  
      // Step 3: Poll for result
      let polledSummary = null;
      for (let i = 0; i < 60; i++) { // Poll up to 2 minutes (60 * 2 seconds)
        await sleep(2000); // Wait 2 seconds before polling
  
        if (!pollingRef.current) return;
  
        try {
          const pollRes = await api.get(`/summaries/status/${task_id}`);
          
          if (pollRes.status === 200 && pollRes.data.status === 'done') {
            // Task completed!
            polledSummary = {
              summary_text: pollRes.data.summary,
              length: summaryLength,
              originalLength,
            };
            break;
          }
  
          if (pollRes.data.status === 'failed') {
            setError(`❌ Summarization failed: ${pollRes.data.error}`);
            setLoading(false);
            pollingRef.current = false;
            return;
          }
  
          // Still processing, continue polling
          setSuccess(`⏳ Processing... (${i + 1}s)`);
        } catch (pollErr) {
          console.error('Polling error:', pollErr);
        }
      }
  
      if (polledSummary) {
        setSummary(polledSummary);
        setSuccess('✅ Summary generated!');
      } else {
        setError('❌ Timed out waiting for summary.');
      }
  
      setLoading(false);
      pollingRef.current = false;
  
    } catch (err) {
      setError('❌ ' + (err.response?.data?.error || 'Failed to summarize'));
      setLoading(false);
      pollingRef.current = false;
    }
  };


  
  const handleReset = () => {
    setContent('');
    setSummary(null);
    setError('');
    setSuccess('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
      <div className="container mx-auto px-4">
        
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-6 text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2 hover:gap-3 transition-all"
        >
          ← Back to Dashboard
        </button>

        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">📝 Generate Summary</h1>
            <p className="text-gray-600">Paste your article below and AI will create a concise summary</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 animate-slide-in">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4 text-green-700 animate-slide-in">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Article Content
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste your article here... (minimum 50 characters)"
                  rows={10}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition"
                  disabled={loading}
                />
                <div className="flex justify-between mt-2 text-sm text-gray-500">
                  <span>{contentLength} characters</span>
                  <span>{contentWords} words</span>
                  <span className={contentLength >= 50 ? 'text-green-600 font-bold' : 'text-orange-600'}>
                    {contentLength >= 50 ? '✓ Ready' : '⚠ Too short'}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">Summary Length</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'short', label: '📄 Short', desc: '2-3 sentences' },
                    { value: 'medium', label: '📋 Medium', desc: '4-5 sentences' },
                    { value: 'long', label: '📚 Long', desc: '6-8 sentences' }
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSummaryLength(opt.value)}
                      className={`p-3 rounded-lg font-medium transition border-2 ${
                        summaryLength === opt.value
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div>{opt.label}</div>
                      <div className="text-xs opacity-70">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading || contentLength < 50}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin">⏳</span> Processing...
                    </>
                  ) : (
                    <>
                       Summarize Now
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={loading}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-6 rounded-lg transition"
                >
                  🔄 Clear
                </button>
              </div>
            </form>
          </div>
          {summary && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">✨ Generated Summary</h2>
              
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border-2 border-green-200 mb-6">
                <div className="flex items-center justify-between mb-4">
                <span className={`px-4 py-2 rounded-lg text-sm font-bold ${
                  (summary.length || '') === 'short' ? 'bg-green-200 text-green-800' :
                  (summary.length || '') === 'medium' ? 'bg-blue-200 text-blue-800' :
                  'bg-purple-200 text-purple-800'
                }`}>
                  {(summary.length || '').toUpperCase()}
                </span>
                </div>
                <p className="text-gray-800 leading-relaxed text-lg">
                  {summary.summary_text}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 text-center">
                  <p className="text-sm text-blue-600 font-bold">Original</p>
                  <p className="text-3xl font-bold text-blue-900 mt-1">{summary.originalLength}</p>
                  <p className="text-xs text-blue-600 mt-1">characters</p>
                </div>

                <div className="bg-green-50 rounded-lg p-4 border border-green-200 text-center">
                  <p className="text-sm text-green-600 font-bold">Summary</p>
                  <p className="text-3xl font-bold text-green-900 mt-1">{summary.summary_text.length}</p>
                  <p className="text-xs text-green-600 mt-1">characters</p>
                </div>

                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200 text-center">
                  <p className="text-sm text-purple-600 font-bold">Compressed</p>
                  <p className="text-3xl font-bold text-purple-900 mt-1">
                    {summary.originalLength > 0 ? ((1 - summary.summary_text.length / summary.originalLength) * 100).toFixed(0) : 0}%
                  </p>
                  <p className="text-xs text-purple-600 mt-1">reduction</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Summarizer;
