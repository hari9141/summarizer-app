import React, { useState, useEffect } from 'react';

const Toast = ({ message, type = 'info', duration = 3000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500',
  }[type];

  const icon = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  }[type];

  return (
    <div className={`fixed bottom-4 right-4 ${bgColor} text-white rounded-lg shadow-lg p-4 max-w-xs flex items-start gap-3 animate-pulse`}>
      <span className="text-xl">{icon}</span>
      <p className="text-sm">{message}</p>
    </div>
  );
};

export default Toast;