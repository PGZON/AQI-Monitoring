import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Log API configuration
console.log('🔧 [API] API instance created with config:', {
  baseURL: api.defaults.baseURL,
  timeout: api.defaults.timeout,
  headers: api.defaults.headers,
  env_variable: process.env.REACT_APP_API_URL
});

// Simple health check function
export const checkBackendHealth = async () => {
  try {
    console.log('🏥 [API] Checking backend health...');
    const response = await api.get('/health');
    console.log('✅ [API] Backend is healthy:', response.data);
    return true;
  } catch (error) {
    console.error('❌ [API] Backend health check failed:', error.message);
    return false;
  }
};

// Test function to verify API endpoints
export const testAPIEndpoints = async () => {
  const endpoints = [
    { name: 'Health', path: '/health' },
    { name: 'Auth Me', path: '/auth/me' },
    { name: 'User Profile', path: '/user/me' }
  ];
  
  console.log('🧪 [API] Testing endpoints...');
  
  for (const endpoint of endpoints) {
    try {
      const response = await api.get(endpoint.path);
      console.log(`✅ [API] ${endpoint.name} endpoint working:`, response.status);
    } catch (error) {
      console.log(`❌ [API] ${endpoint.name} endpoint failed:`, error.response?.status || error.message);
    }
  }
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    console.log('📤 [API] Outgoing request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      headers: config.headers,
      data: config.data,
      timestamp: new Date().toISOString()
    });
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔐 [API] Added auth token to request');
    } else {
      console.log('🔓 [API] No auth token found in localStorage');
    }
    return config;
  },
  (error) => {
    console.error('❌ [API] Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('📥 [API] Incoming response:', {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data,
      config: {
        method: response.config.method,
        url: response.config.url
      },
      timestamp: new Date().toISOString()
    });
    return response;
  },
  (error) => {
    console.error('❌ [API] Response error details:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
      responseHeaders: error.response?.headers,
      requestConfig: {
        method: error.config?.method,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        data: error.config?.data
      },
      timestamp: new Date().toISOString(),
      stack: error.stack
    });
    
    // Special handling for 500 errors
    if (error.response?.status === 500) {
      console.error('🚨 [API] 500 INTERNAL SERVER ERROR DETECTED:', {
        endpoint: `${error.config?.method?.toUpperCase()} ${error.config?.baseURL}${error.config?.url}`,
        requestPayload: error.config?.data,
        serverResponse: error.response?.data,
        possibleCauses: [
          'Backend endpoint not found',
          'Backend method throwing exception',
          'Database connection issue',
          'Invalid request data format',
          'Backend service unavailable'
        ]
      });
    }
    
    // Handle 401 unauthorized responses
    if (error.response?.status === 401) {
      console.warn('🚨 [API] 401 Unauthorized - clearing token and redirecting to login');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    // Handle network errors
    if (!error.response) {
      console.error('🌐 [API] Network error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;

// AQI API functions
export const aqiAPI = {
  // Fetch AQI data for specific coordinates
  fetchAQI: async (lat, lon, saveToHistory = true) => {
    try {
      const response = await api.post('/aqi/fetch', {
        lat,
        lon,
        saveToHistory
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching AQI data:', error);
      throw error;
    }
  },

  // Get user's AQI history
  getHistory: async (params = {}) => {
    try {
      const response = await api.get('/aqi/history', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching AQI history:', error);
      throw error;
    }
  },

  // Get nearby AQI data
  getNearby: async (lat, lon, radius = 10, limit = 20) => {
    try {
      const response = await api.get('/aqi/nearby', {
        params: { lat, lon, radius, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching nearby AQI data:', error);
      throw error;
    }
  },

  // Get user's AQI analytics
  getAnalytics: async (days = 30) => {
    try {
      const response = await api.get('/aqi/analytics', {
        params: { days }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching AQI analytics:', error);
      throw error;
    }
  },

  // Toggle bookmark status
  toggleBookmark: async (id) => {
    try {
      const response = await api.patch(`/aqi/${id}/bookmark`);
      return response.data;
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      throw error;
    }
  },

  // Update note for AQI data
  updateNote: async (id, note) => {
    try {
      const response = await api.patch(`/aqi/${id}/note`, { note });
      return response.data;
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  },

  // Delete AQI data
  deleteData: async (id) => {
    try {
      const response = await api.delete(`/aqi/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting AQI data:', error);
      throw error;
    }
  },

  // Check service health
  getHealth: async () => {
    try {
      const response = await api.get('/aqi/health');
      return response.data;
    } catch (error) {
      console.error('Error checking AQI service health:', error);
      throw error;
    }
  }
};
