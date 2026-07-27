import axios from 'axios';

const api = axios.create({
  // Adjusted for FastAPI default port and global routing
  baseURL: 'http://localhost:8000', 
});

// Automatically attach the token to every request if the user is logged in
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;