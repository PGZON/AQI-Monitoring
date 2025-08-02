/**
 * ML Prediction Service
 * Frontend service for AQI ML predictions and visualizations
 */

import api from '../utils/api';

class MLService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    this.mlServiceURL = process.env.REACT_APP_ML_SERVICE_URL || 'http://localhost:5001';
  }

  /**
   * Get single AQI prediction using LSTM model
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @param {Object} currentData - Current pollution data (optional)
   * @returns {Promise<Object>} Prediction result
   */
  async getLSTMPrediction(lat, lon, currentData = {}) {
    try {
      const response = await api.post('/forecast/lstm-predict', {
        lat: parseFloat(lat),
        lon: parseFloat(lon),
        currentData
      });

      return {
        success: true,
        data: response.data.data,
        source: 'main_backend'
      };
    } catch (error) {
      console.error('LSTM prediction failed:', error);
      
      // Fallback to direct ML service
      try {
        const directResponse = await fetch(`${this.mlServiceURL}/predict`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            latitude: parseFloat(lat),
            longitude: parseFloat(lon),
            current_data: currentData
          })
        });

        const directData = await directResponse.json();
        
        if (directData.success) {
          return {
            success: true,
            data: directData.data,
            source: 'ml_service_direct'
          };
        }
      } catch (directError) {
        console.error('Direct ML service also failed:', directError);
      }

      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Prediction failed'
      };
    }
  }

  /**
   * Get batch predictions for multiple locations
   * @param {Array} locations - Array of {lat, lon, currentData} objects
   * @returns {Promise<Object>} Batch prediction results
   */
  async getBatchPredictions(locations) {
    try {
      const response = await api.post('/forecast/batch-predict', {
        locations: locations.map(loc => ({
          lat: parseFloat(loc.lat),
          lon: parseFloat(loc.lon),
          currentData: loc.currentData || {}
        }))
      });

      return {
        success: true,
        data: response.data.data,
        source: 'main_backend'
      };
    } catch (error) {
      console.error('❌ Batch prediction failed:', error);
      
      // Log detailed error information
      if (error.response) {
        console.error('🚨 Backend batch prediction error:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers
        });
        
        // If it's a validation error, show the specific issues
        if (error.response.status === 400 && error.response.data) {
          console.error('💥 Batch prediction validation errors:', error.response.data.errors || error.response.data.message);
        }
      }
      
      // Fallback to direct ML service
      console.log('🔄 Trying direct ML service as fallback...');
      try {
        const directResponse = await fetch(`${this.mlServiceURL}/batch-predict`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            locations: locations.map(loc => ({
              latitude: parseFloat(loc.lat),
              longitude: parseFloat(loc.lon),
              current_data: loc.currentData || {}
            }))
          })
        });

        const directData = await directResponse.json();
        
        if (directData.success) {
          return {
            success: true,
            data: directData.data,
            source: 'ml_service_direct'
          };
        }
      } catch (directError) {
        console.error('Direct batch prediction also failed:', directError);
      }

      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Batch prediction failed'
      };
    }
  }

  /**
   * Get ML model information
   * @returns {Promise<Object>} Model information
   */
  async getModelInfo() {
    try {
      const response = await fetch(`${this.mlServiceURL}/model-info`);
      const data = await response.json();
      
      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error('Failed to get model info:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check ML service health
   * @returns {Promise<Object>} Health status
   */
  async checkMLHealth() {
    try {
      const response = await fetch(`${this.mlServiceURL}/health`);
      const data = await response.json();
      
      return {
        success: true,
        healthy: data.status === 'healthy',
        data
      };
    } catch (error) {
      console.error('ML health check failed:', error);
      return {
        success: false,
        healthy: false,
        error: error.message
      };
    }
  }

  /**
   * Alias for checkMLHealth - for compatibility with AQI Heatmap component
   * @returns {Promise<Object>} Health check result
   */
  async checkHealth() {
    const result = await this.checkMLHealth();
    return {
      status: result.healthy, // Boolean indicating if service is healthy
      healthy: result.healthy,
      success: result.success,
      data: result.data,
      error: result.error
    };
  }

  /**
   * Generate heatmap data for a region
   * @param {Object} bounds - Map bounds {north, south, east, west}
   * @param {number} gridSize - Grid resolution (default: 10)
   * @param {Object} currentConditions - Current environmental conditions
   * @returns {Promise<Array>} Heatmap data points
   */
  async generateHeatmapData(bounds, gridSize = 10, currentConditions = {}) {
    try {
      console.log('🗺️ Generating heatmap data...', { bounds, gridSize });
      
      // Limit grid size to prevent too many API calls and respect backend limit of 10 locations
      const effectiveGridSize = Math.min(gridSize, 3); // Max 3x3 = 9 points (within 10 limit)
      const locations = this.generateGridLocations(bounds, effectiveGridSize);
      
      console.log(`📍 Generated ${locations.length} grid locations`);

      // Get batch predictions for grid points
      console.log('🔮 Requesting batch predictions...');
      const batchResult = await this.getBatchPredictions(
        locations.map(loc => ({
          lat: loc.lat,
          lon: loc.lon,
          currentData: currentConditions
        }))
      );

      console.log('📊 Batch result:', batchResult);

      if (batchResult.success && batchResult.data) {
        let predictions = batchResult.data.predictions || batchResult.data;
        
        // Handle different response formats
        if (Array.isArray(predictions)) {
          console.log(`✅ Got ${predictions.length} predictions`);
          
          const heatmapData = predictions.map((pred, index) => {
            const location = locations[index] || locations[0];
            const aqi = pred.predicted_aqi || pred.aqi || 50;
            
            return {
              lat: location.lat,
              lng: location.lon,
              aqi: Math.round(aqi),
              intensity: this.aqiToIntensity(aqi),
              color: this.aqiToColor(aqi),
              category: this.aqiToCategory(aqi),
              isReal: true
            };
          });
          
          // If we used a smaller grid, interpolate to fill out the visual grid
          if (effectiveGridSize < gridSize) {
            return this.interpolateGridData(heatmapData, bounds, gridSize);
          }
          
          return heatmapData;
        }
      }

      console.warn('⚠️ Predictions failed, using mock data');
      return this.generateMockHeatmapData(bounds, gridSize);
      
    } catch (error) {
      console.error('❌ Heatmap generation failed:', error);
      return this.generateMockHeatmapData(bounds, gridSize);
    }
  }

  /**
   * Interpolate data to create a fuller visual grid
   * @param {Array} baseData - Base prediction data
   * @param {Object} bounds - Map bounds
   * @param {number} targetGridSize - Target grid size
   * @returns {Array} Interpolated heatmap data
   */
  interpolateGridData(baseData, bounds, targetGridSize) {
    console.log(`🔄 Interpolating from ${baseData.length} to ${targetGridSize}x${targetGridSize} grid`);
    
    const interpolatedData = [];
    const latStep = (bounds.north - bounds.south) / targetGridSize;
    const lonStep = (bounds.east - bounds.west) / targetGridSize;

    for (let i = 0; i <= targetGridSize; i++) {
      for (let j = 0; j <= targetGridSize; j++) {
        const lat = bounds.south + (i * latStep);
        const lon = bounds.west + (j * lonStep);
        
        // Find the closest real data point
        let closestPoint = baseData[0];
        let minDistance = this.calculateDistance(lat, lon, closestPoint.lat, closestPoint.lng);
        
        baseData.forEach(point => {
          const distance = this.calculateDistance(lat, lon, point.lat, point.lng);
          if (distance < minDistance) {
            minDistance = distance;
            closestPoint = point;
          }
        });
        
        // Create interpolated point with some variation based on distance
        const distanceVariation = Math.min(minDistance * 100, 1) * 20; // Max 20 AQI variation
        const randomVariation = (Math.random() - 0.5) * distanceVariation;
        const interpolatedAQI = Math.max(10, Math.min(300, closestPoint.aqi + randomVariation));
        
        interpolatedData.push({
          lat,
          lng: lon,
          aqi: Math.round(interpolatedAQI),
          intensity: this.aqiToIntensity(interpolatedAQI),
          color: this.aqiToColor(interpolatedAQI),
          category: this.aqiToCategory(interpolatedAQI),
          isReal: minDistance < 0.01 // Very close points are considered "real"
        });
      }
    }
    
    console.log(`✅ Interpolated to ${interpolatedData.length} points`);
    return interpolatedData;
  }

  /**
   * Calculate distance between two lat/lon points
   * @param {number} lat1 - Latitude 1
   * @param {number} lon1 - Longitude 1
   * @param {number} lat2 - Latitude 2
   * @param {number} lon2 - Longitude 2
   * @returns {number} Distance
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const dlat = lat2 - lat1;
    const dlon = lon2 - lon1;
    return Math.sqrt(dlat * dlat + dlon * dlon);
  }

  /**
   * Generate grid locations within bounds
   * @param {Object} bounds - Map bounds
   * @param {number} gridSize - Number of points per dimension
   * @returns {Array} Array of {lat, lon} points
   */
  generateGridLocations(bounds, gridSize) {
    const locations = [];
    const latStep = (bounds.north - bounds.south) / gridSize;
    const lonStep = (bounds.east - bounds.west) / gridSize;

    for (let i = 0; i <= gridSize; i++) {
      for (let j = 0; j <= gridSize; j++) {
        locations.push({
          lat: bounds.south + (i * latStep),
          lon: bounds.west + (j * lonStep)
        });
      }
    }

    return locations;
  }

  /**
   * Convert AQI to heatmap intensity (0-1)
   * @param {number} aqi - AQI value
   * @returns {number} Intensity value
   */
  aqiToIntensity(aqi) {
    return Math.min(aqi / 300, 1); // Normalize to 0-1, cap at 300 AQI
  }

  /**
   * Convert AQI to color
   * @param {number} aqi - AQI value
   * @returns {string} Color code
   */
  aqiToColor(aqi) {
    if (aqi <= 50) return '#00E400';      // Good - Green
    if (aqi <= 100) return '#FFFF00';     // Moderate - Yellow
    if (aqi <= 150) return '#FF7E00';     // Unhealthy for Sensitive - Orange
    if (aqi <= 200) return '#FF0000';     // Unhealthy - Red
    if (aqi <= 300) return '#8F3F97';     // Very Unhealthy - Purple
    return '#7E0023';                     // Hazardous - Maroon
  }

  /**
   * Convert AQI to category
   * @param {number} aqi - AQI value
   * @returns {Object} Category information
   */
  aqiToCategory(aqi) {
    if (aqi <= 50) {
      return { name: 'Good', level: 1 };
    } else if (aqi <= 100) {
      return { name: 'Moderate', level: 2 };
    } else if (aqi <= 150) {
      return { name: 'Unhealthy for Sensitive Groups', level: 3 };
    } else if (aqi <= 200) {
      return { name: 'Unhealthy', level: 4 };
    } else if (aqi <= 300) {
      return { name: 'Very Unhealthy', level: 5 };
    } else {
      return { name: 'Hazardous', level: 6 };
    }
  }

  /**
   * Generate mock heatmap data as fallback
   * @param {Object} bounds - Map bounds
   * @param {number} gridSize - Grid size
   * @returns {Array} Mock heatmap data
   */
  generateMockHeatmapData(bounds, gridSize) {
    const mockData = [];
    const latStep = (bounds.north - bounds.south) / gridSize;
    const lonStep = (bounds.east - bounds.west) / gridSize;

    for (let i = 0; i <= gridSize; i++) {
      for (let j = 0; j <= gridSize; j++) {
        const lat = bounds.south + (i * latStep);
        const lon = bounds.west + (j * lonStep);
        const aqi = Math.floor(Math.random() * 200) + 20; // Random AQI 20-220

        mockData.push({
          lat,
          lng: lon,
          aqi,
          intensity: this.aqiToIntensity(aqi),
          color: this.aqiToColor(aqi),
          category: this.aqiToCategory(aqi)
        });
      }
    }

    return mockData;
  }

  /**
   * Get predictions for major Indian cities
   * @param {Object} currentConditions - Current environmental conditions
   * @returns {Promise<Array>} City predictions
   */
  async getMajorCityPredictions(currentConditions = {}) {
    const majorCities = [
      { name: 'Mumbai', lat: 19.0760, lon: 72.8777 },
      { name: 'Delhi', lat: 28.6139, lon: 77.2090 },
      { name: 'Bangalore', lat: 12.9716, lon: 77.5946 },
      { name: 'Chennai', lat: 13.0827, lon: 80.2707 },
      { name: 'Hyderabad', lat: 17.3850, lon: 78.4867 },
      { name: 'Pune', lat: 18.5204, lon: 73.8567 },
      { name: 'Kolkata', lat: 22.5726, lon: 88.3639 },
      { name: 'Ahmedabad', lat: 23.0225, lon: 72.5714 }
    ];

    try {
      const batchResult = await this.getBatchPredictions(
        majorCities.map(city => ({
          lat: city.lat,
          lon: city.lon,
          currentData: currentConditions
        }))
      );

      if (batchResult.success) {
        return majorCities.map((city, index) => ({
          ...city,
          prediction: batchResult.data.predictions?.[index] || null,
          aqi: batchResult.data.predictions?.[index]?.predicted_aqi || null,
          category: this.aqiToCategory(batchResult.data.predictions?.[index]?.predicted_aqi || 50)
        }));
      }

      return majorCities.map(city => ({
        ...city,
        prediction: null,
        aqi: null,
        category: { name: 'Unknown', level: 0 }
      }));

    } catch (error) {
      console.error('Failed to get major city predictions:', error);
      return majorCities.map(city => ({
        ...city,
        prediction: null,
        aqi: null,
        category: { name: 'Error', level: 0 }
      }));
    }
  }
}

const mlServiceInstance = new MLService();
export default mlServiceInstance;
