/**
 * Analytics Service - Handles data analytics and insights
 */

import api from '../utils/api';

class AnalyticsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 10 * 60 * 1000; // 10 minutes
  }

  /**
   * Get historical analytics data
   */
  async getHistoricalAnalytics(days = 30, location = null) {
    const cacheKey = `historical-${days}-${location?.latitude}-${location?.longitude}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return { success: true, data: cached.data, source: 'cache' };
    }

    try {
      const params = { days };
      if (location) {
        params.latitude = location.latitude;
        params.longitude = location.longitude;
      }

      const response = await api.get('/analytics/historical', { params });

      if (response.status === 200) {
        const data = response.data;
        
        this.cache.set(cacheKey, {
          data: data.data,
          timestamp: Date.now()
        });

        return { success: true, data: data.data, source: 'api' };
      }
      
      // Generate mock data for development
      const mockData = this.generateMockHistoricalData(days, location);
      return { success: true, data: mockData, source: 'mock' };
    } catch (error) {
      console.error('Analytics Service: Failed to fetch historical data:', error);
      
      const mockData = this.generateMockHistoricalData(days, location);
      return { success: false, data: mockData, source: 'mock', error: error.message };
    }
  }

  /**
   * Get weekly comparison data
   */
  async getWeeklyComparison(location = null) {
    const cacheKey = `weekly-${location?.latitude}-${location?.longitude}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return { success: true, data: cached.data, source: 'cache' };
    }

    try {
      const params = {};
      if (location) {
        params.latitude = location.latitude;
        params.longitude = location.longitude;
      }

      const response = await api.get('/analytics/weekly-comparison', { params });

      if (response.status === 200) {
        const data = response.data;
        
        this.cache.set(cacheKey, {
          data: data.data,
          timestamp: Date.now()
        });

        return { success: true, data: data.data, source: 'api' };
      }
      
      // Generate mock data for development
      const mockData = this.generateMockWeeklyData(location);
      return { success: true, data: mockData, source: 'mock' };
    } catch (error) {
      console.error('Analytics Service: Failed to fetch weekly comparison:', error);
      
      const mockData = this.generateMockWeeklyData(location);
      return { success: false, data: mockData, source: 'mock', error: error.message };
    }
  }

  /**
   * Get location history analytics
   */
  async getLocationHistory(location, days = 30) {
    const cacheKey = `location-history-${location.latitude}-${location.longitude}-${days}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return { success: true, data: cached.data, source: 'cache' };
    }

    try {
      const params = {
        latitude: location.latitude,
        longitude: location.longitude,
        days
      };

      const response = await api.get('/analytics/location-history', { params });

      if (response.status === 200) {
        const data = response.data;
        
        this.cache.set(cacheKey, {
          data: data.data,
          timestamp: Date.now()
        });

        return { success: true, data: data.data, source: 'api' };
      }
      
      // Generate mock data for development
      const mockData = this.generateMockLocationHistory(location, days);
      return { success: true, data: mockData, source: 'mock' };
    } catch (error) {
      console.error('Analytics Service: Failed to fetch location history:', error);
      
      const mockData = this.generateMockLocationHistory(location, days);
      return { success: false, data: mockData, source: 'mock', error: error.message };
    }
  }

  /**
   * Get insights and recommendations
   */
  async getInsights(location = null) {
    const cacheKey = `insights-${location?.latitude}-${location?.longitude}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return { success: true, data: cached.data, source: 'cache' };
    }

    try {
      const params = {};
      if (location) {
        params.latitude = location.latitude;
        params.longitude = location.longitude;
      }

      const response = await api.get('/analytics/insights', { params });

      if (response.status === 200) {
        const data = response.data;
        
        this.cache.set(cacheKey, {
          data: data.data,
          timestamp: Date.now()
        });

        return { success: true, data: data.data, source: 'api' };
      }
      
      // Generate mock insights for development
      const mockData = this.generateMockInsights(location);
      return { success: true, data: mockData, source: 'mock' };
    } catch (error) {
      console.error('Analytics Service: Failed to fetch insights:', error);
      
      const mockData = this.generateMockInsights(location);
      return { success: false, data: mockData, source: 'mock', error: error.message };
    }
  }

  /**
   * Generate mock historical AQI data
   */
  generateMockHistoricalData(days = 7, location = null) {
    const data = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Generate realistic AQI values with some variation
      const baseAQI = 50 + Math.sin(i * 0.5) * 30 + Math.random() * 40;
      const pm25 = baseAQI * 0.6 + Math.random() * 20;
      const pm10 = baseAQI * 0.8 + Math.random() * 25;
      const no2 = Math.max(5, baseAQI * 0.3 + Math.random() * 15);
      const o3 = Math.max(10, baseAQI * 0.4 + Math.random() * 20);
      const co = Math.max(1, baseAQI * 0.1 + Math.random() * 5);
      const so2 = Math.max(2, baseAQI * 0.2 + Math.random() * 8);
      
      data.push({
        date: date.toISOString().split('T')[0],
        time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        datetime: date.toISOString(),
        aqi: Math.round(Math.max(1, baseAQI)),
        pm25: Math.round(Math.max(1, pm25)),
        pm10: Math.round(Math.max(1, pm10)),
        no2: Math.round(Math.max(1, no2)),
        o3: Math.round(Math.max(1, o3)),
        co: parseFloat(Math.max(0.1, co).toFixed(1)),
        so2: Math.round(Math.max(1, so2)),
        location: location ? `Location ${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)}` : `Location ${Math.random() * 100 - 50}.${Math.random() * 100}, ${Math.random() * 100 - 50}.${Math.random() * 100}`,
        temperature: Math.round(20 + Math.random() * 15),
        humidity: Math.round(40 + Math.random() * 40),
        windSpeed: Math.round(Math.random() * 15)
      });
    }
    
    return {
      historical: data,
      summary: {
        avgAQI: Math.round(data.reduce((sum, item) => sum + item.aqi, 0) / data.length),
        maxAQI: Math.max(...data.map(item => item.aqi)),
        minAQI: Math.min(...data.map(item => item.aqi)),
        totalDays: days,
        location: location ? `Location ${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)}` : `Location ${Math.random() * 100 - 50}.${Math.random() * 100}, ${Math.random() * 100 - 50}.${Math.random() * 100}`
      }
    };
  }

  /**
   * Generate mock weekly comparison data
   */
  generateMockWeeklyData(location = null) {
    const thisWeekAvg = 45 + Math.random() * 50;
    const lastWeekAvg = 40 + Math.random() * 60;
    const change = ((thisWeekAvg - lastWeekAvg) / lastWeekAvg) * 100;
    
    return {
      thisWeek: {
        average: Math.round(thisWeekAvg),
        days: 7,
        bestDay: Math.round(thisWeekAvg - 10 - Math.random() * 15),
        worstDay: Math.round(thisWeekAvg + 10 + Math.random() * 20)
      },
      lastWeek: {
        average: Math.round(lastWeekAvg),
        days: 7,
        bestDay: Math.round(lastWeekAvg - 10 - Math.random() * 15),
        worstDay: Math.round(lastWeekAvg + 10 + Math.random() * 20)
      },
      change: {
        percentage: parseFloat(change.toFixed(1)),
        direction: change > 0 ? 'worse' : change < 0 ? 'better' : 'same',
        arrow: change > 0 ? '↑' : change < 0 ? '↓' : '→'
      }
    };
  }

  /**
   * Generate mock location history
   */
  generateMockLocationHistory(location = null, days = 30) {
    const locations = [
      { name: 'Downtown', lat: 40.7128, lng: -74.0060, aqi: 65 },
      { name: 'Central Park', lat: 40.7829, lng: -73.9654, aqi: 42 },
      { name: 'Brooklyn Heights', lat: 40.6962, lng: -73.9962, aqi: 58 },
      { name: 'Queens Plaza', lat: 40.7505, lng: -73.9370, aqi: 71 },
      { name: 'Staten Island', lat: 40.5795, lng: -74.1502, aqi: 38 }
    ];
    
    return locations.map((loc, index) => ({
      id: index + 1,
      name: loc.name,
      latitude: loc.lat,
      longitude: loc.lng,
      lastAQI: loc.aqi + Math.round(Math.random() * 20 - 10),
      lastViewed: new Date(Date.now() - Math.random() * days * 24 * 60 * 60 * 1000).toISOString(),
      viewCount: Math.round(1 + Math.random() * 10),
      isFavorite: Math.random() > 0.7
    }));
  }

  /**
   * Generate mock personal insights
   */
  generateMockInsights(location = null) {
    const insights = [
      "You've been tracking air quality for 12 days. Great job staying informed!",
      "Your most viewed location had 15% better air quality this week.",
      "You checked AQI 23 times this week - that's 3x more than last week!",
      "The best air quality you experienced was 28 AQI on Tuesday.",
      "You spent time in 4 different locations with varying air quality levels."
    ];
    
    return {
      primary: insights[Math.floor(Math.random() * insights.length)],
      stats: {
        daysTracked: Math.round(7 + Math.random() * 14),
        locationsVisited: Math.round(2 + Math.random() * 6),
        checksThisWeek: Math.round(10 + Math.random() * 20),
        bestAQIThisWeek: Math.round(20 + Math.random() * 30),
        avgAQIThisWeek: Math.round(45 + Math.random() * 40)
      },
      trend: {
        direction: Math.random() > 0.5 ? 'improving' : 'declining',
        percentage: Math.round(5 + Math.random() * 20)
      }
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    console.log('🗑️ [AnalyticsService] Cache cleared');
  }

  /**
   * Clear all browser storage
   */
  clearAllStorage() {
    // Clear localStorage cache keys
    const cacheKeys = ['analytics-data', 'historical-data', 'user-preferences'];
    cacheKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        console.log(`🗑️ [AnalyticsService] Cleared localStorage: ${key}`);
      }
    });
    
    // Clear sessionStorage
    sessionStorage.clear();
    console.log('🗑️ [AnalyticsService] Cleared sessionStorage');
    
    // Clear service worker cache
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
          console.log(`🗑️ [AnalyticsService] Cleared cache: ${name}`);
        });
      });
    }
    
    // Clear internal cache
    this.clearCache();
  }

  /**
   * Clear specific cache entry
   */
  clearCacheEntry(endpoint, params = {}) {
    const cacheKey = this.getCacheKey(endpoint, params);
    this.cache.delete(cacheKey);
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
export default analyticsService;
