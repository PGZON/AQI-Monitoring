/**
 * Analytics Service - Handles user analytics and historical AQI data
 */

class AnalyticsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 10 * 60 * 1000; // 10 minutes for analytics data
  }

  /**
   * Get cache key for analytics requests
   */
  getCacheKey(endpoint, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    return `${endpoint}?${sortedParams}`;
  }

  /**
   * Check if cached data is still valid
   */
  isCacheValid(cacheEntry) {
    return cacheEntry && (Date.now() - cacheEntry.timestamp) < this.cacheTimeout;
  }

  /**
   * Fetch historical AQI data for a location
   */
  async getHistoricalAQI(latitude, longitude, days = 7) {
    const params = { latitude, longitude, days };
    const cacheKey = this.getCacheKey('historical-aqi', params);
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (this.isCacheValid(cached)) {
      return {
        success: true,
        data: cached.data,
        source: 'cache'
      };
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/analytics/historical`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(params)
      });

      if (response.ok) {
        const data = await response.json();
        
        // Cache the successful response
        this.cache.set(cacheKey, {
          data: data.data,
          timestamp: Date.now()
        });

        return {
          success: true,
          data: data.data,
          source: 'api'
        };
      }
      
      // Fallback to mock data if API fails
      const mockData = this.generateMockHistoricalData(latitude, longitude, days);
      return {
        success: true,
        data: mockData,
        source: 'mock'
      };
    } catch (error) {
      console.error('Analytics Service: Historical AQI fetch failed:', error);
      
      // Return mock data on error
      const mockData = this.generateMockHistoricalData(latitude, longitude, days);
      return {
        success: false,
        data: mockData,
        source: 'mock',
        error: error.message
      };
    }
  }

  /**
   * Get weekly comparison data
   */
  async getWeeklyComparison(latitude, longitude) {
    const params = { latitude, longitude };
    const cacheKey = this.getCacheKey('weekly-comparison', params);
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (this.isCacheValid(cached)) {
      return {
        success: true,
        data: cached.data,
        source: 'cache'
      };
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/analytics/weekly-comparison`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(params)
      });

      if (response.ok) {
        const data = await response.json();
        
        // Cache the successful response
        this.cache.set(cacheKey, {
          data: data.data,
          timestamp: Date.now()
        });

        return {
          success: true,
          data: data.data,
          source: 'api'
        };
      }
      
      // Fallback to mock data
      const mockData = this.generateMockWeeklyComparison();
      return {
        success: true,
        data: mockData,
        source: 'mock'
      };
    } catch (error) {
      console.error('Analytics Service: Weekly comparison fetch failed:', error);
      
      const mockData = this.generateMockWeeklyComparison();
      return {
        success: false,
        data: mockData,
        source: 'mock',
        error: error.message
      };
    }
  }

  /**
   * Get user's location history
   */
  async getLocationHistory() {
    const cacheKey = this.getCacheKey('location-history');
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (this.isCacheValid(cached)) {
      return {
        success: true,
        data: cached.data,
        source: 'cache'
      };
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/analytics/location-history`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        // Cache the successful response
        this.cache.set(cacheKey, {
          data: data.data,
          timestamp: Date.now()
        });

        return {
          success: true,
          data: data.data,
          source: 'api'
        };
      }
      
      // Fallback to mock data
      const mockData = this.generateMockLocationHistory();
      return {
        success: true,
        data: mockData,
        source: 'mock'
      };
    } catch (error) {
      console.error('Analytics Service: Location history fetch failed:', error);
      
      const mockData = this.generateMockLocationHistory();
      return {
        success: false,
        data: mockData,
        source: 'mock',
        error: error.message
      };
    }
  }

  /**
   * Get personal insights
   */
  async getPersonalInsights(latitude, longitude) {
    const params = { latitude, longitude };
    const cacheKey = this.getCacheKey('personal-insights', params);
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (this.isCacheValid(cached)) {
      return {
        success: true,
        data: cached.data,
        source: 'cache'
      };
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/analytics/insights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(params)
      });

      if (response.ok) {
        const data = await response.json();
        
        // Cache the successful response
        this.cache.set(cacheKey, {
          data: data.data,
          timestamp: Date.now()
        });

        return {
          success: true,
          data: data.data,
          source: 'api'
        };
      }
      
      // Fallback to mock data
      const mockData = this.generateMockInsights();
      return {
        success: true,
        data: mockData,
        source: 'mock'
      };
    } catch (error) {
      console.error('Analytics Service: Insights fetch failed:', error);
      
      const mockData = this.generateMockInsights();
      return {
        success: false,
        data: mockData,
        source: 'mock',
        error: error.message
      };
    }
  }

  /**
   * Generate mock historical AQI data
   */
  generateMockHistoricalData(latitude, longitude, days = 7) {
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
        location: `Location ${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
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
        location: `Location ${latitude.toFixed(2)}, ${longitude.toFixed(2)}`
      }
    };
  }

  /**
   * Generate mock weekly comparison data
   */
  generateMockWeeklyComparison() {
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
  generateMockLocationHistory() {
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
      lastViewed: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      viewCount: Math.round(1 + Math.random() * 10),
      isFavorite: Math.random() > 0.7
    }));
  }

  /**
   * Generate mock personal insights
   */
  generateMockInsights() {
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
