import React from 'react';

const SummaryDisplay = ({ summary, article }) => {
  if (!summary) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center text-gray-500">
          <p className="text-lg">No summary yet</p>
          <p className="text-sm mt-2">Create an article to generate a summary</p>
        </div>
      </div>
    );
  }

  const originalLength = article?.content?.length || 0;
  const summaryLength = summary.summary_text?.length || 0;
  const compressionRatio = originalLength > 0 
    ? ((1 - summaryLength / originalLength) * 100).toFixed(1)
    : 0;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900">
           Summary
        </h2>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          summary.length === 'short' ? 'bg-green-100 text-green-800' :
          summary.length === 'medium' ? 'bg-blue-100 text-blue-800' :
          'bg-purple-100 text-purple-800'
        }`}>
          {summary.length}
        </span>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
          {summary.summary_text}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-sm text-gray-600">Original</p>
          <p className="text-2xl font-bold text-blue-600">
            {originalLength}
          </p>
          <p className="text-xs text-gray-500">characters</p>
        </div>

        <div className="bg-green-50 rounded-lg p-3">
          <p className="text-sm text-gray-600">Summary</p>
          <p className="text-2xl font-bold text-green-600">
            {summaryLength}
          </p>
          <p className="text-xs text-gray-500">characters</p>
        </div>

        <div className="bg-purple-50 rounded-lg p-3">
          <p className="text-sm text-gray-600">Compressed</p>
          <p className="text-2xl font-bold text-purple-600">
            {compressionRatio}%
          </p>
          <p className="text-xs text-gray-500">reduction</p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
        <p>Created: {new Date(summary.created_at).toLocaleString()}</p>
        {article && (
          <p className="mt-1">Article: {article.title}</p>
        )}
      </div>
    </div>
  );
};

export default SummaryDisplay;
