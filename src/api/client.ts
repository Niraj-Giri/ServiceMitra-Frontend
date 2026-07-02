import axios from 'axios';

// Configure the base instance pointing to our Spring Boot backend
export const apiClient = axios.create({
  baseURL: 'http://localhost:8085/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add JWT token if it exists
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
