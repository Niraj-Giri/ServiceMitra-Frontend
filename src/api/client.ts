import axios from 'axios';

// Configure the base instance pointing to our Spring Boot backend
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8086/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor: attach JWT token ─────────────────────────────────────
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

// ── Response interceptor: unwrap ApiResponse + handle auth errors ─────────────
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
          message: errorMsg,
        });
      }
    }
    return response;
  },
  (error) => {
    // ── SEC-14: Auto-logout on expired / invalid JWT ───────────────────────
    // When the backend returns 401 (token expired, invalid, or missing) or
    // 403 (role not authorized for this endpoint), clear the local session
    // and redirect to login so the user is never stuck in a broken auth state.
    if (error.response) {
      const status = error.response.status;

      if (status === 401) {
        // Token is expired or invalid — force re-login
        console.warn('[Auth] Session expired. Redirecting to login.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Avoid redirect loops if we're already on the login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login?reason=session_expired';
        }
        return Promise.reject(error);
      }

      if (status === 403) {
        // Authenticated but not authorized — user tried to access a resource
        // they don't have the role for. Redirect to an appropriate page.
        console.warn('[Auth] Access denied (403). Insufficient permissions.');
        // Don't logout — the session itself is valid, just not authorized.
        // Redirect to the root of their dashboard instead.
        return Promise.reject(
          new Error('Access denied. You do not have permission to perform this action.')
        );
      }

      // Extract structured error message from ApiResponse body if available
      const resData = error.response.data;
      if (resData && typeof resData === 'object') {
        if (resData.error?.message) {
          error.message = resData.error.message;
        } else if (resData.message) {
          error.message = resData.message;
        }
      }
    }

    return Promise.reject(error);
  }
);
