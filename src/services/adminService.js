/**
 * Admin Service - Phase 13
 * Handles all admin-related API calls and data management
 */

import api from './api';

class AdminService {
  /**
   * Dashboard Overview Methods
   */
  async getDashboardMetrics() {
    try {
      const response = await api.get('/admin/dashboard/metrics');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch dashboard metrics:', error);
      // Return mock data for development
      return this.getMockDashboardMetrics();
    }
  }

  async getSystemHealth() {
    try {
      const response = await api.get('/admin/system/health');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch system health:', error);
      return {
        status: 'unknown',
        uptime: '0h 0m',
        memory: { used: 0, total: 0 },
        database: { status: 'unknown', connections: 0 },
        api: { status: 'unknown', responseTime: 0 }
      };
    }
  }

  /**
   * User Management Methods
   */
  async getUsers(page = 1, limit = 50, search = '') {
    try {
      const response = await api.get('/admin/users', {
        params: { page, limit, search }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch users:', error);
      return this.getMockUsers();
    }
  }

  async getUserActivity(userId, days = 30) {
    try {
      const response = await api.get(`/admin/users/${userId}/activity`, {
        params: { days }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user activity:', error);
      return { activities: [], totalRequests: 0, averageDaily: 0 };
    }
  }

  async updateUserRole(userId, role) {
    try {
      const response = await api.put(`/admin/users/${userId}/role`, { role });
      return response.data;
    } catch (error) {
      console.error('Failed to update user role:', error);
      throw error;
    }
  }

  async deactivateUser(userId, reason = '') {
    try {
      const response = await api.put(`/admin/users/${userId}/deactivate`, { reason });
      return response.data;
    } catch (error) {
      console.error('Failed to deactivate user:', error);
      throw error;
    }
  }

  /**
   * ML Model Monitoring Methods
   */
  async getMLModelStatus() {
    try {
      const response = await api.get('/admin/ml/status');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch ML model status:', error);
      return this.getMockMLStatus();
    }
  }

  async getModelPerformanceHistory(days = 30) {
    try {
      const response = await api.get('/admin/ml/performance', {
        params: { days }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch model performance history:', error);
      return this.getMockPerformanceHistory();
    }
  }

  async triggerModelRetraining() {
    try {
      const response = await api.post('/admin/ml/retrain');
      return response.data;
    } catch (error) {
      console.error('Failed to trigger model retraining:', error);
      throw error;
    }
  }

  async getModelPredictionAccuracy(timeRange = '7d') {
    try {
      const response = await api.get('/admin/ml/accuracy', {
        params: { timeRange }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch prediction accuracy:', error);
      return { accuracy: 0.75, mae: 15.2, rmse: 22.1, samples: 0 };
    }
  }

  /**
   * Data Monitoring Methods
   */
  async getLivePollutantData(page = 1, limit = 100, filters = {}) {
    try {
      const response = await api.get('/admin/data/pollutants', {
        params: { page, limit, ...filters }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch live pollutant data:', error);
      return this.getMockPollutantData();
    }
  }

  async getDataQualityMetrics(timeRange = '24h') {
    try {
      const response = await api.get('/admin/data/quality', {
        params: { timeRange }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch data quality metrics:', error);
      return {
        completeness: 0.95,
        accuracy: 0.87,
        freshness: 0.92,
        totalRecords: 0,
        errorRate: 0.03
      };
    }
  }

  async exportData(format = 'csv', timeRange = '24h', filters = {}) {
    try {
      const response = await api.get('/admin/data/export', {
        params: { format, timeRange, ...filters },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Failed to export data:', error);
      throw error;
    }
  }

  /**
   * Log and Error Monitoring Methods
   */
  async getSystemLogs(level = 'all', page = 1, limit = 100) {
    try {
      const response = await api.get('/admin/logs', {
        params: { level, page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch system logs:', error);
      return this.getMockLogs();
    }
  }

  async getErrorSummary(timeRange = '24h') {
    try {
      const response = await api.get('/admin/logs/errors', {
        params: { timeRange }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch error summary:', error);
      return {
        totalErrors: 0,
        criticalErrors: 0,
        warningCount: 0,
        categories: {}
      };
    }
  }

  async clearLogs(olderThan = '30d') {
    try {
      const response = await api.delete('/admin/logs', {
        params: { olderThan }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to clear logs:', error);
      throw error;
    }
  }

  /**
   * System Control Methods
   */
  async toggleMaintenanceMode(enabled, message = '') {
    try {
      const response = await api.put('/admin/system/maintenance', {
        enabled,
        message
      });
      return response.data;
    } catch (error) {
      console.error('Failed to toggle maintenance mode:', error);
      throw error;
    }
  }

  async clearSystemCache(cacheType = 'all') {
    try {
      const response = await api.delete('/admin/system/cache', {
        params: { type: cacheType }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to clear system cache:', error);
      throw error;
    }
  }

  async getAPIUsageStats(timeRange = '24h') {
    try {
      const response = await api.get('/admin/api/usage', {
        params: { timeRange }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch API usage stats:', error);
      return this.getMockAPIUsage();
    }
  }

  /**
   * Mock Data Methods (for development/fallback)
   */
  getMockDashboardMetrics() {
    return {
      totalUsers: 1247,
      activeUsers: 342,
      apiRequests: 15648,
      averageAQI: 87,
      modelRuns: 24,
      systemUptime: '15d 4h 23m',
      dataPoints: 50234,
      alertsSent: 156
    };
  }

  getMockUsers() {
    return {
      users: Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        email: `user${i + 1}@example.com`,
        name: `User ${i + 1}`,
        role: i === 0 ? 'admin' : 'user',
        status: Math.random() > 0.1 ? 'active' : 'inactive',
        lastLogin: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
        requestCount: Math.floor(Math.random() * 1000),
        preferences: {
          location: `City ${i + 1}`,
          notifications: Math.random() > 0.5
        }
      })),
      total: 1247,
      page: 1,
      totalPages: 63
    };
  }

  getMockMLStatus() {
    return {
      modelVersion: '2.1.0',
      lastTraining: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'healthy',
      accuracy: 0.847,
      mae: 12.3,
      rmse: 18.7,
      trainingData: {
        samples: 125000,
        features: 15,
        timeRange: '90 days'
      },
      predictions: {
        total24h: 2456,
        avgConfidence: 0.82,
        accuracyRate: 0.76
      }
    };
  }

  getMockPerformanceHistory() {
    const days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return {
        date: date.toISOString().split('T')[0],
        accuracy: 0.75 + Math.random() * 0.15,
        mae: 10 + Math.random() * 10,
        rmse: 15 + Math.random() * 15,
        predictions: Math.floor(1000 + Math.random() * 500)
      };
    });
    return { history: days };
  }

  getMockPollutantData() {
    const locations = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia'];
    const data = locations.map((location, i) => ({
      id: i + 1,
      location,
      latitude: 40.7128 + Math.random() * 10,
      longitude: -74.0060 + Math.random() * 10,
      aqi: Math.floor(Math.random() * 200),
      pm25: Math.floor(Math.random() * 100),
      pm10: Math.floor(Math.random() * 150),
      no2: Math.floor(Math.random() * 80),
      so2: Math.floor(Math.random() * 50),
      co: Math.floor(Math.random() * 10),
      o3: Math.floor(Math.random() * 120),
      lastUpdated: new Date(Date.now() - Math.random() * 60 * 60 * 1000).toISOString(),
      status: Math.random() > 0.1 ? 'active' : 'offline'
    }));
    return { data, total: locations.length };
  }

  getMockLogs() {
    const levels = ['info', 'warn', 'error', 'debug'];
    const modules = ['api', 'ml', 'database', 'auth', 'scheduler'];
    
    const logs = Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      level: levels[Math.floor(Math.random() * levels.length)],
      module: modules[Math.floor(Math.random() * modules.length)],
      message: `Sample log message ${i + 1}`,
      details: Math.random() > 0.7 ? `Additional details for log ${i + 1}` : null
    }));

    return {
      logs: logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
      total: 50,
      page: 1,
      totalPages: 1
    };
  }

  getMockAPIUsage() {
    const endpoints = ['/api/aqi', '/api/forecast', '/api/history', '/api/auth', '/api/preferences'];
    const hours = Array.from({ length: 24 }, (_, i) => {
      const hour = new Date();
      hour.setHours(hour.getHours() - (23 - i), 0, 0, 0);
      
      return {
        time: hour.toISOString(),
        requests: Math.floor(Math.random() * 500) + 100,
        errors: Math.floor(Math.random() * 20),
        avgResponseTime: Math.floor(Math.random() * 200) + 50
      };
    });

    const byEndpoint = endpoints.map(endpoint => ({
      endpoint,
      requests: Math.floor(Math.random() * 10000) + 1000,
      errors: Math.floor(Math.random() * 100),
      avgResponseTime: Math.floor(Math.random() * 300) + 100
    }));

    return {
      hourly: hours,
      byEndpoint,
      total: {
        requests: byEndpoint.reduce((sum, ep) => sum + ep.requests, 0),
        errors: byEndpoint.reduce((sum, ep) => sum + ep.errors, 0),
        avgResponseTime: Math.floor(byEndpoint.reduce((sum, ep) => sum + ep.avgResponseTime, 0) / byEndpoint.length)
      }
    };
  }
}

const adminService = new AdminService();
export default adminService;
