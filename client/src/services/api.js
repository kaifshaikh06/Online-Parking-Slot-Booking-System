import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
});

api.interceptors.request.use((config) => {
  const storedAuth = localStorage.getItem('parkingAuth');
  if (storedAuth) {
    const { token } = JSON.parse(storedAuth);
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getErrorMessage = (error) => error.response?.data?.message || 'Unable to complete the request. Please try again.';

export default api;
