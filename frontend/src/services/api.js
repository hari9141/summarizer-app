import axios from 'axios';

// PRODUCTION API URL (no environment variable dependency)
const PRODUCTION_API_URL = 'https://precisai-backend-ryt8.onrender.com/api';
const DEVELOPMENT_API_URL = 'http://localhost:5000/api';

// Detect if running in production or development
const isProduction = window.location.hostname !== 'localhost';
const API_BASE_URL = isProduction ? PRODUCTION_API_URL : DEVELOPMENT_API_URL;

console.log('Current Environment:', isProduction ? 'PRODUCTION' : 'DEVELOPMENT');
console.log('API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true  
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Response error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
