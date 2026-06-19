import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://herride.onrender.com/api/v1' : '/api/v1'),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if unauthorized and not already retried
    if (
      error.response?.status === 401 && 
      !originalRequest._retry && 
      !originalRequest.url.includes('/auth/refresh-token')
    ) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (refreshToken) {
        try {
          // Use direct axios to avoid interceptor loop
          const response = await axios.post('/api/v1/auth/refresh-token', {
            refreshToken: refreshToken
          });
          
          if (response.data && response.data.success) {
            const { accessToken, refreshToken: newRefreshToken } = response.data.data;
            
            localStorage.setItem('token', accessToken);
            localStorage.setItem('refreshToken', newRefreshToken);
            
            // Retry original request with new access token
            originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          console.error('Session expired. Redirecting to login.', refreshError);
          // Clear credentials and force logout
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/auth?flow=login';
        }
      } else {
        // No refresh token available, force logout
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/auth?flow=login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
