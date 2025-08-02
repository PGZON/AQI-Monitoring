/**
 * Enhanced Forecast Service for ML forecast dashboard integration
 */

import api from '../utils/api';
import { generateMockForecastData, generateMockHeatmapData } from '../utils/aqiUtils';

class ForecastService {
  /**
   * Get forecast data for a specific location
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {number} hours - Number of hours to forecast (default: 24)
   * @returns {Promise<Array>} Forecast data array
   */
  async getForecastData(lat, lng, hours = 24) {
    const debugId = `forecast-${Date.now()}`;
    console.log(`🔍 [${debugId}] Starting getForecastData...`);
    
    try {
      // Log incoming parameters for debugging
      console.log(`🔍 [${debugId}] Raw parameters received:`, { 
        lat, lng, hours, 
        types: { lat: typeof lat, lng: typeof lng, hours: typeof hours } 
      });

      // Validate and convert parameters
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      const forecastDays = Math.max(1, Math.ceil(hours / 24) || 1);

      console.log(`🔍 [${debugId}] Converted parameters:`, { 
        latitude, longitude, forecastDays,
        isValidLat: !isNaN(latitude),
        isValidLng: !isNaN(longitude)
      });

      // Validate coordinates with detailed error messages
      if (lat === null || lat === undefined || lng === null || lng === undefined) {
        const error = new Error(`Coordinates cannot be null/undefined. Received lat: ${lat}, lng: ${lng}`);
        console.error(`❌ [${debugId}] Validation failed:`, error.message);
        throw error;
      }

      if (isNaN(latitude) || isNaN(longitude)) {
        const error = new Error(`Invalid coordinates provided. Could not convert to numbers: lat="${lat}" (${typeof lat}) -> ${latitude}, lng="${lng}" (${typeof lng}) -> ${longitude}`);
        console.error(`❌ [${debugId}] Conversion failed:`, error.message);
        throw error;
      }
      
      if (latitude < -90 || latitude > 90) {
        const error = new Error(`Latitude must be between -90 and 90. Received: ${latitude}`);
        console.error(`❌ [${debugId}] Latitude range failed:`, error.message);
        throw error;
      }
      
      if (longitude < -180 || longitude > 180) {
        const error = new Error(`Longitude must be between -180 and 180. Received: ${longitude}`);
        console.error(`❌ [${debugId}] Longitude range failed:`, error.message);
        throw error;
      }

      console.log(`🌍 [${debugId}] Requesting forecast data:`, { lat: latitude, lon: longitude, days: forecastDays });

      // Use the correct backend endpoint for forecast predictions
      console.log(`📡 [${debugId}] Making API call to /forecast/predict...`);
      
      const requestPayload = {
        lat: latitude,
        lon: longitude, // Backend expects 'lon' not 'lng'
        days: forecastDays
      };
      
      console.log(`📡 [${debugId}] Request payload:`, requestPayload);
      
      const response = await api.post('/forecast/predict', requestPayload);

      console.log(`✅ [${debugId}] API call successful! Status:`, response.status);
      console.log(`✅ [${debugId}] Forecast response received:`, response.data);
      console.log(`📊 [${debugId}] Response structure check:`, {
        hasForecast: !!response.data?.forecast,
        hasPredictions: !!response.data?.predictions,
        hasData: !!response.data?.data,
        nestedPredictions: !!response.data?.forecast?.predictions,
        actualStructure: Object.keys(response.data || {}),
        responseType: typeof response.data,
        responseSuccess: response.data?.success
      });
      
      // Extract forecast data from the nested structure
      if (response.data && response.data.forecast && response.data.forecast.predictions) {
        console.log(`📈 [${debugId}] Using nested predictions:`, response.data.forecast.predictions.length, 'items');
        return response.data.forecast.predictions;
      } else if (response.data && response.data.forecast) {
        console.log(`📈 [${debugId}] Using forecast object:`, response.data.forecast);
        return response.data.forecast;
      } else if (response.data && response.data.predictions) {
        console.log(`📈 [${debugId}] Using direct predictions:`, response.data.predictions.length, 'items');
        return response.data.predictions;
      } else if (response.data && response.data.data) {
        console.log(`📈 [${debugId}] Using data property:`, response.data.data);
        return response.data.data;
      } else {
        console.warn(`⚠️ [${debugId}] Unexpected response structure:`, response.data);
        return [];
      }
    } catch (error) {
      console.error(`❌ [${debugId}] Failed to fetch forecast data:`, error);
      
      // Log detailed error information
      if (error.response) {
        console.error(`🚨 [${debugId}] Server responded with error:`, {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers,
          url: error.response.config?.url,
          method: error.response.config?.method,
          requestData: error.response.config?.data
        });
        
        // If it's a validation error, show the specific issues
        if (error.response.status === 400 && error.response.data) {
          console.error(`💥 [${debugId}] Validation errors:`, error.response.data.errors || error.response.data.message);
        }
        
        // Special handling for 500 errors
        if (error.response.status === 500) {
          console.error(`🚨 [${debugId}] 500 SERVER ERROR - BACKEND ISSUE:`, {
            message: 'The backend server encountered an internal error',
            endpoint: '/forecast/predict',
            requestSent: error.response.config?.data,
            serverResponse: error.response.data,
            troubleshooting: [
              '1. Check backend server logs',
              '2. Verify ML service is running',
              '3. Check database connectivity',
              '4. Validate request format matches backend expectations'
            ]
          });
        }
      } else if (error.request) {
        console.error(`🌐 [${debugId}] No response received:`, error.request);
        console.error(`🌐 [${debugId}] Request details:`, {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data,
          timeout: error.config?.timeout
        });
      } else {
        console.error(`⚙️ [${debugId}] Request setup error:`, error.message);
        console.error(`⚙️ [${debugId}] Error stack:`, error.stack);
      }
      
      console.warn(`🔄 [${debugId}] Using mock data as fallback`);
      return generateMockForecastData();
    }
  }

  /**
   * Get ML prediction for specific location and time
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {string} targetTime - Target time for prediction (ISO string)
   * @returns {Promise<Object>} ML prediction data
   */
  async getMLPrediction(lat, lng, targetTime) {
    try {
      // Validate and convert parameters
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);

      // Validate coordinates
      if (isNaN(latitude) || isNaN(longitude)) {
        throw new Error('Invalid coordinates provided');
      }
      
      if (latitude < -90 || latitude > 90) {
        throw new Error('Latitude must be between -90 and 90');
      }
      
      if (longitude < -180 || longitude > 180) {
        throw new Error('Longitude must be between -180 and 180');
      }

      console.log('🔮 Requesting LSTM prediction:', { lat: latitude, lon: longitude, targetTime });

      // Use the LSTM prediction endpoint  
      const response = await api.post('/forecast/lstm-predict', {
        lat: latitude,
        lon: longitude, // Backend expects 'lon' not 'lng'
        currentData: {} // Add empty currentData object as it's expected
      });

      console.log('✅ LSTM prediction response:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch ML prediction:', error);
      
      // Log detailed error information
      if (error.response) {
        console.error('🚨 Server responded with error:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers
        });
        
        // If it's a validation error, show the specific issues
        if (error.response.status === 400 && error.response.data) {
          console.error('💥 Validation errors:', error.response.data.errors || error.response.data.message);
        }
      } else if (error.request) {
        console.error('🌐 No response received:', error.request);
      } else {
        console.error('⚙️ Request setup error:', error.message);
      }
      
      console.warn('Using mock prediction data as fallback');
      
      // Return mock ML prediction data
      const baseAQI = Math.floor(Math.random() * 150) + 50;
      return {
        predicted_aqi: baseAQI,
        confidence: Math.random() * 0.3 + 0.7, // 70-100% confidence
        factors: {
          weather_impact: Math.random() * 0.4 + 0.1,
          traffic_impact: Math.random() * 0.3 + 0.1,
          industrial_impact: Math.random() * 0.2 + 0.05,
          seasonal_impact: Math.random() * 0.1 + 0.05
        },
        model_version: 'v1.2.3',
        prediction_time: new Date().toISOString()
      };
    }
  }

  /**
   * Get heatmap data for multiple locations
   * @param {Object} bounds - Map bounds { north, south, east, west }
   * @param {number} limit - Maximum number of locations (default: 50)
   * @returns {Promise<Array>} Array of location data with AQI values
   */
  async getHeatmapData(bounds, limit = 50) {
    try {
      // Use the nearby AQI endpoint to get multiple locations
      const centerLat = (bounds.north + bounds.south) / 2;
      const centerLng = (bounds.east + bounds.west) / 2;
      
      const response = await api.get('/aqi/nearby', {
        params: { 
          lat: centerLat,
          lng: centerLng,
          radius: 50, // 50km radius
          limit 
        }
      });
      
      return response.data.locations || response.data.data || [];
    } catch (error) {
      console.warn('Failed to fetch heatmap data, using mock data:', error);
      return generateMockHeatmapData(limit);
    }
  }

  /**
   * Get historical AQI data for trend analysis
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {number} days - Number of days to look back (default: 7)
   * @returns {Promise<Array>} Historical data array
   */
  async getHistoricalData(lat, lng, days = 7) {
    try {
      const response = await api.get('/aqi/history', {
        params: { lat, lng, days }
      });
      
      return response.data.history || response.data.data || [];
    } catch (error) {
      console.warn('Failed to fetch historical data, using mock data:', error);
      
      // Generate mock historical data
      const historicalData = [];
      const now = new Date();
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const baseAQI = Math.floor(Math.random() * 120) + 30;
        
        historicalData.push({
          date: date.toISOString().split('T')[0],
          aqi: baseAQI,
          pm2_5: Math.floor(Math.random() * 40) + 10,
          pm10: Math.floor(Math.random() * 60) + 15,
          o3: Math.floor(Math.random() * 100) + 20,
          no2: Math.floor(Math.random() * 50) + 10
        });
      }
      
      return historicalData;
    }
  }

  /**
   * Get weather forecast data that affects AQI
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {number} hours - Number of hours to forecast
   * @returns {Promise<Array>} Weather forecast data
   */
  async getWeatherForecast(lat, lng, hours = 24) {
    try {
      const response = await api.get('/weather/forecast', {
        params: { lat, lng, hours }
      });
      
      return response.data.weather || [];
    } catch (error) {
      console.warn('Failed to fetch weather forecast, using mock data:', error);
      
      // Generate mock weather data
      const weatherData = [];
      const now = new Date();
      
      for (let i = 0; i < hours; i += 3) {
        const time = new Date(now.getTime() + i * 60 * 60 * 1000);
        
        weatherData.push({
          time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: time.toISOString(),
          temperature: Math.floor(Math.random() * 20) + 15, // 15-35°C
          humidity: Math.floor(Math.random() * 40) + 40, // 40-80%
          windSpeed: Math.floor(Math.random() * 15) + 2, // 2-17 km/h
          windDirection: Math.floor(Math.random() * 360), // 0-360 degrees
          pressure: Math.floor(Math.random() * 50) + 1000, // 1000-1050 hPa
          visibility: Math.floor(Math.random() * 10) + 5 // 5-15 km
        });
      }
      
      return weatherData;
    }
  }

  /**
   * Get AQI alerts for specific location
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Promise<Array>} Array of active alerts
   */
  async getAQIAlerts(lat, lng) {
    try {
      const response = await api.get('/alerts', {
        params: { lat, lng }
      });
      
      return response.data.alerts || [];
    } catch (error) {
      console.warn('Failed to fetch alerts, using mock data:', error);
      
      // Generate mock alerts
      const alerts = [];
      const alertProbability = Math.random();
      
      if (alertProbability > 0.7) {
        alerts.push({
          id: 'alert_1',
          type: 'high_aqi',
          level: 'warning',
          title: 'High AQI Expected',
          message: 'AQI levels may reach unhealthy levels in the next 6 hours',
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
          affectedPollutants: ['pm2_5', 'o3']
        });
      }
      
      if (alertProbability > 0.9) {
        alerts.push({
          id: 'alert_2',
          type: 'health_advisory',
          level: 'advisory',
          title: 'Sensitive Groups Advisory',
          message: 'People with respiratory conditions should limit outdoor activities',
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
          affectedPollutants: ['pm2_5', 'pm10']
        });
      }
      
      return alerts;
    }
  }
}

// Create and export singleton instance
const forecastService = new ForecastService();
export default forecastService;
