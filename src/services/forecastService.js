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
    try {
      const response = await api.get('/forecast', {
        params: { lat, lng, hours }
      });
      
      return response.data.forecast || [];
    } catch (error) {
      console.warn('Failed to fetch forecast data, using mock data:', error);
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
      const response = await api.get('/ml/predict', {
        params: { lat, lng, target_time: targetTime }
      });
      
      return response.data;
    } catch (error) {
      console.warn('Failed to fetch ML prediction, using mock data:', error);
      
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
      const response = await api.get('/heatmap', {
        params: { 
          ...bounds, 
          limit 
        }
      });
      
      return response.data.locations || [];
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
      const response = await api.get('/history', {
        params: { lat, lng, days }
      });
      
      return response.data.history || [];
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
