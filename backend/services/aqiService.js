const axios = require('axios');

class AQIService {
  constructor() {
    this.openWeatherApiKey = process.env.OPENWEATHER_API_KEY;
    this.osmApiUrl = process.env.OSM_API_URL || 'https://nominatim.openstreetmap.org';
    
    // API endpoints
    this.endpoints = {
      openWeatherAQI: 'https://api.openweathermap.org/data/2.5/air_pollution',
      openWeatherWeather: 'https://api.openweathermap.org/data/2.5/weather',
      osmReverse: `${this.osmApiUrl}/reverse`
    };

    // Create axios instance with default config
    this.httpClient = axios.create({
      timeout: 10000,
      headers: {
        'User-Agent': 'AQI-Monitoring-App/1.0'
      }
    });
  }

  /**
   * Fetch AQI data from OpenWeatherMap
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @returns {Promise<Object>} AQI data
   */
  async fetchAQIData(lat, lon) {
    try {
      console.log(`🌍 Fetching AQI data for coordinates: ${lat}, ${lon}`);

      if (!this.openWeatherApiKey) {
        throw new Error('OpenWeatherMap API key is not configured');
      }

      // Validate coordinates
      if (!this.isValidCoordinates(lat, lon)) {
        throw new Error('Invalid coordinates provided');
      }

      const response = await this.httpClient.get(this.endpoints.openWeatherAQI, {
        params: {
          lat: parseFloat(lat),
          lon: parseFloat(lon),
          appid: this.openWeatherApiKey
        }
      });

      console.log('✅ AQI data fetched successfully from OpenWeatherMap');
      return this.formatAQIResponse(response.data, lat, lon);

    } catch (error) {
      console.error('❌ Error fetching AQI data:', error.message);
      
      if (error.response) {
        throw new Error(`OpenWeatherMap API error: ${error.response.data.message || error.response.statusText}`);
      } else if (error.request) {
        throw new Error('Unable to reach OpenWeatherMap API. Please check your internet connection.');
      } else {
        throw error;
      }
    }
  }

  /**
   * Fetch weather data from OpenWeatherMap
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @returns {Promise<Object>} Weather data
   */
  async fetchWeatherData(lat, lon) {
    try {
      const response = await this.httpClient.get(this.endpoints.openWeatherWeather, {
        params: {
          lat: parseFloat(lat),
          lon: parseFloat(lon),
          appid: this.openWeatherApiKey,
          units: 'metric'
        }
      });

      return this.formatWeatherResponse(response.data);
    } catch (error) {
      console.warn('⚠️ Weather data fetch failed:', error.message);
      return null; // Weather data is optional
    }
  }

  /**
   * Get location name from coordinates using OpenStreetMap
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @returns {Promise<Object>} Location information
   */
  async getLocationName(lat, lon) {
    try {
      console.log(`🗺️ Fetching location name for: ${lat}, ${lon}`);

      const response = await this.httpClient.get(this.endpoints.osmReverse, {
        params: {
          lat: parseFloat(lat),
          lon: parseFloat(lon),
          format: 'json',
          addressdetails: 1,
          zoom: 10
        }
      });

      return this.formatLocationResponse(response.data);
    } catch (error) {
      console.warn('⚠️ Location name fetch failed:', error.message);
      return {
        city: 'Unknown',
        country: 'Unknown',
        state: null,
        formatted: `${lat}, ${lon}`
      };
    }
  }

  /**
   * Fetch complete AQI data including location and weather
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @returns {Promise<Object>} Complete AQI data
   */
  async fetchCompleteAQIData(lat, lon) {
    try {
      // Fetch AQI data, location, and weather in parallel
      const [aqiData, locationData, weatherData] = await Promise.all([
        this.fetchAQIData(lat, lon),
        this.getLocationName(lat, lon),
        this.fetchWeatherData(lat, lon)
      ]);

      return {
        ...aqiData,
        location: locationData,
        weather: weatherData,
        coordinates: {
          latitude: parseFloat(lat),
          longitude: parseFloat(lon)
        },
        source: 'openweathermap',
        requestTimestamp: new Date(),
        dataTimestamp: new Date()
      };

    } catch (error) {
      console.error('❌ Error fetching complete AQI data:', error.message);
      throw error;
    }
  }

  /**
   * Format OpenWeatherMap AQI response
   * @param {Object} data - Raw AQI data from OpenWeatherMap
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @returns {Object} Formatted AQI data
   */
  formatAQIResponse(data, lat, lon) {
    const current = data.list[0];
    
    // OpenWeatherMap AQI scale: 1-5, convert to standard AQI scale
    const aqiMapping = {
      1: { index: 25, level: 'Good', category: 'Good' },
      2: { index: 75, level: 'Fair', category: 'Moderate' },
      3: { index: 125, level: 'Moderate', category: 'Unhealthy for Sensitive Groups' },
      4: { index: 175, level: 'Poor', category: 'Unhealthy' },
      5: { index: 250, level: 'Very Poor', category: 'Very Unhealthy' }
    };

    const aqi = aqiMapping[current.main.aqi] || { index: 100, level: 'Moderate', category: 'Moderate' };

    return {
      aqi: {
        index: aqi.index,
        level: aqi.level,
        category: aqi.category
      },
      pollutants: {
        co: {
          value: Math.round(current.components.co * 100) / 100,
          unit: 'μg/m³'
        },
        no: {
          value: Math.round(current.components.no * 100) / 100,
          unit: 'μg/m³'
        },
        no2: {
          value: Math.round(current.components.no2 * 100) / 100,
          unit: 'μg/m³'
        },
        o3: {
          value: Math.round(current.components.o3 * 100) / 100,
          unit: 'μg/m³'
        },
        so2: {
          value: Math.round(current.components.so2 * 100) / 100,
          unit: 'μg/m³'
        },
        pm2_5: {
          value: Math.round(current.components.pm2_5 * 100) / 100,
          unit: 'μg/m³'
        },
        pm10: {
          value: Math.round(current.components.pm10 * 100) / 100,
          unit: 'μg/m³'
        },
        nh3: {
          value: Math.round(current.components.nh3 * 100) / 100,
          unit: 'μg/m³'
        }
      }
    };
  }

  /**
   * Format OpenWeatherMap weather response
   * @param {Object} data - Raw weather data
   * @returns {Object} Formatted weather data
   */
  formatWeatherResponse(data) {
    return {
      temperature: Math.round(data.main.temp * 100) / 100,
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      windSpeed: Math.round((data.wind?.speed || 0) * 100) / 100,
      windDirection: data.wind?.deg || 0
    };
  }

  /**
   * Format OpenStreetMap location response
   * @param {Object} data - Raw location data
   * @returns {Object} Formatted location data
   */
  formatLocationResponse(data) {
    const address = data.address || {};
    
    return {
      city: address.city || address.town || address.village || address.hamlet || 'Unknown',
      country: address.country || 'Unknown',
      state: address.state || address.region || null,
      formatted: data.display_name || `${data.lat}, ${data.lon}`
    };
  }

  /**
   * Validate coordinates
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @returns {boolean} Is valid
   */
  isValidCoordinates(lat, lon) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    
    return (
      !isNaN(latitude) && 
      !isNaN(longitude) && 
      latitude >= -90 && 
      latitude <= 90 && 
      longitude >= -180 && 
      longitude <= 180
    );
  }

  /**
   * Get AQI health recommendations
   * @param {number} aqiIndex - AQI index value
   * @returns {Object} Health recommendations
   */
  getHealthRecommendations(aqiIndex) {
    if (aqiIndex <= 50) {
      return {
        level: 'Good',
        message: 'Air quality is considered satisfactory, and air pollution poses little or no risk.',
        recommendations: [
          'Great day for outdoor activities!',
          'No restrictions on outdoor activities'
        ]
      };
    } else if (aqiIndex <= 100) {
      return {
        level: 'Moderate',
        message: 'Air quality is acceptable for most people. However, sensitive people may experience minor symptoms.',
        recommendations: [
          'Unusually sensitive people should consider limiting prolonged outdoor exertion'
        ]
      };
    } else if (aqiIndex <= 150) {
      return {
        level: 'Unhealthy for Sensitive Groups',
        message: 'Sensitive people may experience health effects. The general public is not likely to be affected.',
        recommendations: [
          'Sensitive individuals should limit outdoor activities',
          'General public can enjoy outdoor activities normally'
        ]
      };
    } else if (aqiIndex <= 200) {
      return {
        level: 'Unhealthy',
        message: 'Everyone may begin to experience health effects. Sensitive people may experience more serious effects.',
        recommendations: [
          'Avoid prolonged outdoor activities',
          'Consider wearing a mask outdoors'
        ]
      };
    } else if (aqiIndex <= 300) {
      return {
        level: 'Very Unhealthy',
        message: 'Health warnings of emergency conditions. The entire population is more likely to be affected.',
        recommendations: [
          'Stay indoors and keep windows closed',
          'Wear N95 masks if you must go outside'
        ]
      };
    } else {
      return {
        level: 'Hazardous',
        message: 'Health alert: everyone may experience more serious health effects.',
        recommendations: [
          'Stay indoors and keep windows closed',
          'Wear N95 masks if you must go outside',
          'Seek medical attention if experiencing symptoms'
        ]
      };
    }
  }
}

module.exports = new AQIService();
