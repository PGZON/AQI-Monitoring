const axios = require('axios');

class MLService {
  constructor() {
    this.mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:5001';
    this.timeout = 30000; // 30 seconds timeout
    this.isMLServiceAvailable = null;
    this.lastHealthCheck = null;
  }

  /**
   * Check if ML service is available
   */
  async checkMLServiceHealth() {
    try {
      const now = Date.now();
      
      // Cache health check for 5 minutes
      if (this.lastHealthCheck && (now - this.lastHealthCheck) < 5 * 60 * 1000) {
        return this.isMLServiceAvailable;
      }

      const response = await axios.get(`${this.mlServiceUrl}/health`, {
        timeout: 5000
      });

      this.isMLServiceAvailable = response.status === 200;
      this.lastHealthCheck = now;

      return this.isMLServiceAvailable;
    } catch (error) {
      console.error('ML Service health check failed:', error.message);
      this.isMLServiceAvailable = false;
      this.lastHealthCheck = Date.now();
      return false;
    }
  }

  /**
   * Train ML models for a specific location
   */
  async trainModel(params = {}) {
    try {
      const isAvailable = await this.checkMLServiceHealth();
      if (!isAvailable) {
        throw new Error('ML service is not available');
      }

      const {
        city,
        lat,
        lon,
        days = 30,
        forceRetrain = false
      } = params;

      const payload = {
        city,
        lat,
        lon,
        days,
        force_retrain: forceRetrain
      };

      const response = await axios.post(
        `${this.mlServiceUrl}/train`,
        payload,
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      console.error('ML training request failed:', error.message);
      
      if (error.response) {
        return {
          success: false,
          error: error.response.data?.message || 'ML training failed',
          statusCode: error.response.status,
          details: error.response.data
        };
      }

      return {
        success: false,
        error: error.message || 'ML service connection failed'
      };
    }
  }

  /**
   * Get AQI forecast predictions
   */
  async getForecast(params = {}) {
    try {
      const isAvailable = await this.checkMLServiceHealth();
      if (!isAvailable) {
        return this.getFallbackForecast(params);
      }

      const {
        city,
        lat,
        lon,
        days = 3,
        autoTrain = true
      } = params;

      const payload = {
        city,
        lat,
        lon,
        days,
        auto_train: autoTrain
      };

      const response = await axios.post(
        `${this.mlServiceUrl}/predict`,
        payload,
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        return {
          success: true,
          data: response.data,
          source: 'ml_service'
        };
      } else {
        throw new Error(response.data.message || 'Prediction failed');
      }

    } catch (error) {
      console.error('ML forecast request failed:', error.message);
      
      // Fall back to simple forecasting if ML service fails
      return this.getFallbackForecast(params);
    }
  }

  /**
   * Simple fallback forecasting when ML service is unavailable
   */
  getFallbackForecast(params = {}) {
    const { city, days = 3, currentAQI = 100 } = params;
    
    const forecasts = [];
    const baseDate = new Date();
    
    for (let i = 1; i <= days; i++) {
      const forecastDate = new Date(baseDate);
      forecastDate.setDate(baseDate.getDate() + i);
      
      // Simple prediction: slight random variation around current AQI
      const variation = (Math.random() - 0.5) * 20; // ±10 AQI variation
      const predictedAQI = Math.max(0, Math.min(500, currentAQI + variation));
      
      forecasts.push({
        date: forecastDate.toISOString().split('T')[0],
        aqi: Math.round(predictedAQI * 10) / 10,
        confidence: 'low'
      });
    }

    return {
      success: true,
      data: {
        city: city || 'Unknown',
        generated_at: new Date().toISOString(),
        model_used: 'fallback',
        forecast_days: days,
        forecast: forecasts,
        trend: 'stable',
        overall_confidence: 'low'
      },
      source: 'fallback'
    };
  }

  /**
   * Get information about ML models
   */
  async getModelsInfo() {
    try {
      const isAvailable = await this.checkMLServiceHealth();
      if (!isAvailable) {
        return {
          success: false,
          error: 'ML service is not available'
        };
      }

      const response = await axios.get(`${this.mlServiceUrl}/models`, {
        timeout: 10000
      });

      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      console.error('ML models info request failed:', error.message);
      return {
        success: false,
        error: error.message || 'Failed to get models info'
      };
    }
  }

  /**
   * Trigger retraining for all locations
   */
  async retrainAllModels() {
    try {
      const isAvailable = await this.checkMLServiceHealth();
      if (!isAvailable) {
        throw new Error('ML service is not available');
      }

      const response = await axios.post(
        `${this.mlServiceUrl}/retrain-all`,
        {},
        {
          timeout: 60000, // 1 minute timeout for bulk operation
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      console.error('ML bulk retraining request failed:', error.message);
      return {
        success: false,
        error: error.message || 'Bulk retraining failed'
      };
    }
  }

  /**
   * Get forecast using GET endpoint (for specific city)
   */
  async getForecastByCity(city, days = 3) {
    try {
      const isAvailable = await this.checkMLServiceHealth();
      if (!isAvailable) {
        return this.getFallbackForecast({ city, days });
      }

      const response = await axios.get(
        `${this.mlServiceUrl}/forecast/${encodeURIComponent(city)}?days=${days}`,
        {
          timeout: this.timeout
        }
      );

      if (response.data.success) {
        return {
          success: true,
          data: response.data,
          source: 'ml_service'
        };
      } else {
        throw new Error(response.data.message || 'Forecast failed');
      }

    } catch (error) {
      console.error('ML city forecast request failed:', error.message);
      return this.getFallbackForecast({ city, days });
    }
  }

  /**
   * Format forecast data for consistent API response
   */
  async formatForecastResponse(mlResponse, additionalData = {}) {
    if (!mlResponse.success) {
      return mlResponse;
    }

    const data = mlResponse.data;
    
    return {
      success: true,
      message: 'Forecast generated successfully',
      source: mlResponse.source || 'ml_service',
      city: data.city,
      forecast: {
        generated_at: data.generated_at,
        model_used: data.model_used,
        forecast_days: data.forecast_days,
        overall_confidence: data.overall_confidence,
        trend: data.trend,
        predictions: data.forecast
      },
      ml_service_status: await this.checkMLServiceHealth(),
      ...additionalData
    };
  }

  /**
   * Validate forecast parameters
   */
  validateForecastParams(params) {
    const errors = [];
    
    if (!params.city && (!params.lat || !params.lon)) {
      errors.push('Either city name or coordinates (lat, lon) are required');
    }
    
    if (params.lat && (params.lat < -90 || params.lat > 90)) {
      errors.push('Latitude must be between -90 and 90');
    }
    
    if (params.lon && (params.lon < -180 || params.lon > 180)) {
      errors.push('Longitude must be between -180 and 180');
    }
    
    if (params.days && (params.days < 1 || params.days > 7)) {
      errors.push('Forecast days must be between 1 and 7');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = new MLService();
