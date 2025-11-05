import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalArticles: 0, totalSummaries: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const summariesRes = await api.get('/summaries', { params: { per_page: 1 } });
      const articlesRes = await api.get('/articles', { params: { per_page: 1 } });
      
      setStats({
        totalArticles: articlesRes.data?.pagination?.total || 0,
        totalSummaries: summariesRes.data?.pagination?.total || 0,
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-3">
            Welcome, <span className="text-blue-600">{user?.username}!</span>
          </h1>
          <p className="text-gray-600 text-lg">
            Quick access to your summarization hub
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <button
            onClick={() => navigate('/summarizer')}
            className="group bg-white rounded-lg shadow-lg p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="text-5xl group-hover:scale-110 transition-transform">📝</div>
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                Start Here
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Generate Summary</h2>
            <p className="text-gray-600 mb-4">Paste your article and let AI summarize it instantly</p>
            <div className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg font-medium group-hover:bg-blue-700 transition">
              Begin Summarizing →
            </div>
          </button>

          <button
            onClick={() => navigate('/history')}
            className="group bg-white rounded-lg shadow-lg p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="text-5xl group-hover:scale-110 transition-transform">📚</div>
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                {stats.totalSummaries > 0 ? `${stats.totalSummaries} Items` : 'Empty'}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Summary History</h2>
            <p className="text-gray-600 mb-4">View all your previously generated summaries</p>
            <div className="inline-block bg-green-600 text-white px-4 py-2 rounded-lg font-medium group-hover:bg-green-700 transition">
              View All →
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
