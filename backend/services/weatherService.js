/**
 * Weather Service - Handles weather data from OpenWeatherMap API
 */

const axios = require('axios');

class WeatherService {
  constructor() {
    this.apiKey = process.env.OPENWEATHER_API_KEY || 'demo_key';
    this.baseUrl = 'https://api.openweathermap.org/data/2.5';
  }

  /**
   * Get current weather data
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @returns {Object} Weather data
   */
  async getCurrentWeather(lat, lon) {
    try {
      const response = await axios.get(`${this.baseUrl}/weather`, {
        params: {
          lat,
          lon,
          appid: this.apiKey,
          units: 'metric'
        },
        timeout: 10000
      });

      return this.formatCurrentWeather(response.data);
    } catch (error) {
      console.error('OpenWeatherMap API error:', error.message);
      
      // Return mock data if API fails
      return this.getMockCurrentWeather(lat, lon);
    }
  }

  /**
   * Get weather forecast
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @param {number} days - Number of days
   * @returns {Object} Forecast data
   */
  async getWeatherForecast(lat, lon, days = 7) {
    try {
      const response = await axios.get(`${this.baseUrl}/forecast`, {
        params: {
          lat,
          lon,
          appid: this.apiKey,
          units: 'metric',
          cnt: days * 8 // 8 forecasts per day (3-hour intervals)
        },
        timeout: 10000
      });

      return this.formatForecastData(response.data);
    } catch (error) {
      console.error('Weather forecast API error:', error.message);
      
      // Return mock data if API fails
      return this.getMockForecastData(days);
    }
  }

  /**
   * Get hourly weather forecast
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @param {number} hours - Number of hours
   * @returns {Object} Hourly forecast data
   */
  async getHourlyForecast(lat, lon, hours = 24) {
    try {
      const response = await axios.get(`${this.baseUrl}/forecast`, {
        params: {
          lat,
          lon,
          appid: this.apiKey,
          units: 'metric',
          cnt: Math.min(hours, 40) // API limit is 40 forecasts
        },
        timeout: 10000
      });

      return this.formatHourlyData(response.data);
    } catch (error) {
      console.error('Hourly forecast API error:', error.message);
      
      // Return mock data if API fails
      return this.getMockHourlyData(hours);
    }
  }

  /**
   * Get weather alerts
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @returns {Object} Weather alerts
   */
  async getWeatherAlerts(lat, lon) {
    try {
      const response = await axios.get(`${this.baseUrl}/onecall`, {
        params: {
          lat,
          lon,
          appid: this.apiKey,
          exclude: 'minutely,daily,hourly,current'
        },
        timeout: 10000
      });

      return response.data.alerts || [];
    } catch (error) {
      console.error('Weather alerts API error:', error.message);
      
      // Return empty alerts if API fails
      return [];
    }
  }

  /**
   * Format current weather data
   */
  formatCurrentWeather(data) {
    return {
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      visibility: data.visibility ? Math.round(data.visibility / 1000) : null,
      windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
      windDirection: data.wind.deg,
      cloudCover: data.clouds.all,
      condition: data.weather[0].main,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      location: {
        name: data.name,
        country: data.sys.country,
        lat: data.coord.lat,
        lon: data.coord.lon
      },
      timestamp: new Date().toISOString(),
      isDay: data.weather[0].icon.includes('d')
    };
  }

  /**
   * Format forecast data
   */
  formatForecastData(data) {
    const dailyForecasts = {};
    
    data.list.forEach(item => {
      const date = new Date(item.dt * 1000).toDateString();
      
      if (!dailyForecasts[date]) {
        dailyForecasts[date] = {
          date,
          day: new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'long' }),
          temps: [],
          conditions: [],
          humidity: [],
          windSpeed: []
        };
      }
      
      dailyForecasts[date].temps.push(item.main.temp);
      dailyForecasts[date].conditions.push(item.weather[0].main);
      dailyForecasts[date].humidity.push(item.main.humidity);
      dailyForecasts[date].windSpeed.push(item.wind.speed * 3.6);
    });

    return Object.values(dailyForecasts).map(day => ({
      day: day.day,
      date: day.date,
      high: Math.round(Math.max(...day.temps)),
      low: Math.round(Math.min(...day.temps)),
      condition: this.getMostCommonCondition(day.conditions),
      avgHumidity: Math.round(day.humidity.reduce((a, b) => a + b, 0) / day.humidity.length),
      avgWindSpeed: Math.round(day.windSpeed.reduce((a, b) => a + b, 0) / day.windSpeed.length)
    }));
  }

  /**
   * Format hourly data
   */
  formatHourlyData(data) {
    return data.list.map(item => ({
      time: new Date(item.dt * 1000).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        hour12: true 
      }),
      temp: Math.round(item.main.temp),
      condition: item.weather[0].main,
      humidity: item.main.humidity,
      windSpeed: Math.round(item.wind.speed * 3.6),
      timestamp: item.dt
    }));
  }

  /**
   * Get most common weather condition
   */
  getMostCommonCondition(conditions) {
    const frequency = {};
    conditions.forEach(condition => {
      frequency[condition] = (frequency[condition] || 0) + 1;
    });
    
    return Object.keys(frequency).reduce((a, b) => 
      frequency[a] > frequency[b] ? a : b
    );
  }

  /**
   * Mock current weather data (fallback)
   */
  getMockCurrentWeather(lat, lon) {
    return {
      temperature: Math.floor(Math.random() * 20) + 15,
      feelsLike: Math.floor(Math.random() * 20) + 18,
      humidity: Math.floor(Math.random() * 40) + 40,
      pressure: Math.floor(Math.random() * 100) + 1000,
      visibility: Math.floor(Math.random() * 10) + 5,
      windSpeed: Math.floor(Math.random() * 20) + 5,
      windDirection: Math.floor(Math.random() * 360),
      cloudCover: Math.floor(Math.random() * 100),
      condition: ['Clear', 'Clouds', 'Rain', 'Mist'][Math.floor(Math.random() * 4)],
      description: 'mock weather data',
      location: {
        name: 'Mock Location',
        lat: parseFloat(lat),
        lon: parseFloat(lon)
      },
      timestamp: new Date().toISOString(),
      isDay: new Date().getHours() >= 6 && new Date().getHours() < 18
    };
  }

  /**
   * Mock forecast data (fallback)
   */
  getMockForecastData(days) {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const conditions = ['Clear', 'Cloudy', 'Rainy', 'Partly Cloudy'];
    
    return Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      return {
        day: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : daysOfWeek[date.getDay()],
        date: date.toDateString(),
        high: Math.floor(Math.random() * 15) + 25,
        low: Math.floor(Math.random() * 10) + 15,
        condition: conditions[Math.floor(Math.random() * conditions.length)],
        avgHumidity: Math.floor(Math.random() * 40) + 40,
        avgWindSpeed: Math.floor(Math.random() * 20) + 5
      };
    });
  }

  /**
   * Mock hourly data (fallback)
   */
  getMockHourlyData(hours) {
    return Array.from({ length: hours }, (_, i) => {
      const time = new Date(Date.now() + i * 60 * 60 * 1000);
      
      return {
        time: time.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),
        temp: Math.floor(Math.random() * 20) + 15,
        condition: ['Clear', 'Cloudy', 'Rainy'][Math.floor(Math.random() * 3)],
        humidity: Math.floor(Math.random() * 40) + 40,
        windSpeed: Math.floor(Math.random() * 20) + 5,
        timestamp: Math.floor(time.getTime() / 1000)
      };
    });
  }
}

module.exports = new WeatherService();
