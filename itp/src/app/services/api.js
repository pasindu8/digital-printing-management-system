import axios from 'axios';

const api = axios.create({ 
  baseURL: 'http://localhost:5000/api',
  timeout: 10000
});

// attach token automatically
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  // Only add token if it exists and is not 'mock-jwt-token' (which is invalid)
  if (token && token !== 'mock-jwt-token') {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to handle errors
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('Backend server is not running on http://localhost:5000');
    }
    return Promise.reject(error);
  }
);

export default api;
