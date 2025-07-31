/**
 * AQI Service - Frontend service for air quality data management
 */

import { aqiAPI } from '../utils/api';
import { generateMockAQIData } from '../utils/aqiUtils';

class AQIService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get cache key for coordinates
   */
  getCacheKey(latitude, longitude) {
    return `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
  }

  /**
   * Check if cached data is still valid
   */
  isCacheValid(cacheEntry) {
    return cacheEntry && (Date.now() - cacheEntry.timestamp) < this.cacheTimeout;
  }

  /**
   * Fetch current AQI data for coordinates
   */
  async getCurrentAQI(latitude, longitude, useCache = true) {
    const cacheKey = this.getCacheKey(latitude, longitude);
    
    // Check cache first
    if (useCache) {
      const cached = this.cache.get(cacheKey);
      if (this.isCacheValid(cached)) {
        return {
          success: true,
          data: cached.data,
          source: 'cache',
          timestamp: cached.timestamp
        };
      }
    }

    try {
      // Try to fetch from API
      const response = await aqiAPI.fetchAQI(latitude, longitude, true);
      
      if (response.success && response.data) {
        // Cache the successful response
        this.cache.set(cacheKey, {
          data: response.data,
          timestamp: Date.now()
        });

        return {
          success: true,
          data: response.data,
          source: 'api',
          timestamp: Date.now()
        };
      }
      
      // Fallback to mock data
      const mockData = generateMockAQIData({ latitude, longitude });
      
      // Cache mock data with shorter timeout
      this.cache.set(cacheKey, {
        data: mockData,
        timestamp: Date.now()
      });

      return {
        success: true,
        data: mockData,
        source: 'mock',
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('AQI Service: API request failed:', error);
      
      // Try to return stale cache data if available
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return {
          success: true,
          data: cached.data,
          source: 'stale-cache',
          timestamp: cached.timestamp,
          warning: 'Using stale data due to API failure'
        };
      }

      // Last resort: generate mock data
      const mockData = generateMockAQIData({ latitude, longitude });
      return {
        success: false,
        data: mockData,
        source: 'mock-fallback',
        timestamp: Date.now(),
        error: error.message
      };
    }
  }

  /**
   * Get AQI index only (for alert monitoring)
   */
  async getAQIIndex(latitude, longitude, useCache = true) {
    const result = await this.getCurrentAQI(latitude, longitude, useCache);
    
    if (result.data && result.data.aqi && typeof result.data.aqi.index === 'number') {
      return {
        success: result.success,
        aqi: result.data.aqi.index,
        source: result.source,
        timestamp: result.timestamp,
        location: { latitude, longitude }
      };
    }
    
    return {
      success: false,
      aqi: null,
      error: 'Unable to extract AQI index from response',
      source: result.source,
      timestamp: result.timestamp
    };
  }

  /**
   * Batch fetch AQI for multiple locations
   */
  async getMultipleAQI(locations, useCache = true) {
    const promises = locations.map(location => 
      this.getCurrentAQI(location.latitude, location.longitude, useCache)
        .then(result => ({
          location,
          ...result
        }))
        .catch(error => ({
          location,
          success: false,
          error: error.message,
          data: null
        }))
    );

    return Promise.all(promises);
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheTimeout) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const [, value] of this.cache.entries()) {
      if (now - value.timestamp < this.cacheTimeout) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      cacheTimeout: this.cacheTimeout
    };
  }

  /**
   * Set cache timeout
   */
  setCacheTimeout(milliseconds) {
    this.cacheTimeout = milliseconds;
  }
}

// Create and export singleton instance
const aqiService = new AQIService();

export default aqiService;
