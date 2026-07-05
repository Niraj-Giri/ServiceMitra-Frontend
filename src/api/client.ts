import axios from 'axios';

// Configure the base instance pointing to our Spring Boot backend
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8086/api/v1',
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

// Interceptor to automatically unwrap standard ApiResponse wrapper
apiClient.interceptors.response.use(
  (response) => {
    const resData = response.data;
    if (resData && typeof resData === 'object' && 'success' in resData) {
      if (resData.success) {
        // Replace response.data with the actual inner data payload
        response.data = resData.data;
      } else {
        // Treat success: false as an error
        const errorMsg = resData.error?.message || 'Server error';
        return Promise.reject({
          response: response,
          message: errorMsg
        });
      }
    }
    return response;
  },
  (error) => {
    // If the server returns a structured error response
    if (error.response && error.response.data && typeof error.response.data === 'object') {
      const resData = error.response.data;
      if (resData.error && resData.error.message) {
        error.message = resData.error.message;
      }
    }
    return Promise.reject(error);
  }
);

