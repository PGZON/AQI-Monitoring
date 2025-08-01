/**
 * Weather Controller - Handles weather data requests
 */

const weatherService = require('../services/weatherService');

class WeatherController {
  /**
   * Get current weather data for coordinates
   */
  async getCurrentWeather(req, res) {
    try {
      const { lat, lon } = req.query;
      
      if (!lat || !lon) {
        return res.status(400).json({
          success: false,
          message: 'Latitude and longitude are required'
        });
      }

      const weatherData = await weatherService.getCurrentWeather(lat, lon);
      
      res.json({
        success: true,
        data: weatherData
      });
    } catch (error) {
      console.error('Weather fetch error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch weather data',
        error: error.message
      });
    }
  }

  /**
   * Get weather forecast for coordinates
   */
  async getWeatherForecast(req, res) {
    try {
      const { lat, lon, days = 7 } = req.query;
      
      if (!lat || !lon) {
        return res.status(400).json({
          success: false,
          message: 'Latitude and longitude are required'
        });
      }

      const forecastData = await weatherService.getWeatherForecast(lat, lon, days);
      
      res.json({
        success: true,
        data: forecastData
      });
    } catch (error) {
      console.error('Weather forecast error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch weather forecast',
        error: error.message
      });
    }
  }

  /**
   * Get hourly weather forecast
   */
  async getHourlyForecast(req, res) {
    try {
      const { lat, lon, hours = 24 } = req.query;
      
      if (!lat || !lon) {
        return res.status(400).json({
          success: false,
          message: 'Latitude and longitude are required'
        });
      }

      const hourlyData = await weatherService.getHourlyForecast(lat, lon, hours);
      
      res.json({
        success: true,
        data: hourlyData
      });
    } catch (error) {
      console.error('Hourly forecast error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch hourly forecast',
        error: error.message
      });
    }
  }

  /**
   * Get weather alerts for location
   */
  async getWeatherAlerts(req, res) {
    try {
      const { lat, lon } = req.query;
      
      if (!lat || !lon) {
        return res.status(400).json({
          success: false,
          message: 'Latitude and longitude are required'
        });
      }

      const alerts = await weatherService.getWeatherAlerts(lat, lon);
      
      res.json({
        success: true,
        data: alerts
      });
    } catch (error) {
      console.error('Weather alerts error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch weather alerts',
        error: error.message
      });
    }
  }
}

module.exports = new WeatherController();
