// API Configuration for both development and production
const getApiUrl = () => {
  // In production (Railway/Render), use same origin
  if (process.env.NODE_ENV === 'production') {
    return window.location.origin + '/api';
  }

  // In development, use environment variable or localhost
  return process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
};

export const API_BASE_URL = getApiUrl();

export const config = {
  apiUrl: API_BASE_URL,
  timeout: 30000,
  retryAttempts: 3
};

export default config;