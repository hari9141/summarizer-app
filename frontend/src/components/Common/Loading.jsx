import React from 'react';

const Loading = ({ message = 'Loading...', fullScreen = false }) => {
  const container = fullScreen
    ? 'fixed inset-0 bg-black bg-opacity-50 z-50'
    : '';

  return (
    <div className={`flex flex-col items-center justify-center ${container}`}>
      <svg className="animate-spin h-12 w-12 text-blue-600 mb-4" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
        <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
      <p className="text-gray-600 text-lg">{message}</p>
    </div>
  );
};

export default Loading;