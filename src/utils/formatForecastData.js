/**
 * Utility functions for formatting and processing forecast data
 */

import { getAQICategory, getAQICategoryColor } from './getAQICategoryColor';

/**
 * Format forecast data for chart visualization
 * @param {Array} rawForecastData - Raw forecast data from API
 * @returns {Array} Formatted data suitable for charts
 */
export const formatForecastData = (rawForecastData) => {
  if (!Array.isArray(rawForecastData) || rawForecastData.length === 0) {
    return [];
  }

  return rawForecastData.map((item, index) => {
    const aqi = item.predicted_aqi || item.aqi || 0;
    const category = getAQICategory(aqi);
    const colors = getAQICategoryColor(aqi);
    
    // Parse timestamp
    let timestamp = item.timestamp || item.time;
    if (typeof timestamp === 'string') {
      timestamp = new Date(timestamp);
    } else if (typeof timestamp === 'number') {
      timestamp = new Date(timestamp * 1000); // Convert Unix timestamp
    } else {
      // Generate timestamp if missing (hourly intervals)
      timestamp = new Date(Date.now() + (index * 60 * 60 * 1000));
    }

    return {
      id: index,
      timestamp: timestamp.toISOString(),
      time: timestamp.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      }),
      date: timestamp.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      dateTime: timestamp.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }),
      
      // AQI data
      aqi: Math.round(aqi),
      category: category.label,
      categoryColor: colors.hex,
      categoryEmoji: category.emoji,
      
      // Pollutant data
      pm2_5: item.pollutant_levels?.pm2_5 || item.pm2_5 || null,
      pm10: item.pollutant_levels?.pm10 || item.pm10 || null,
      co: item.pollutant_levels?.co || item.co || null,
      no2: item.pollutant_levels?.no2 || item.no2 || null,
      o3: item.pollutant_levels?.o3 || item.o3 || null,
      so2: item.pollutant_levels?.so2 || item.so2 || null,
      nh3: item.pollutant_levels?.nh3 || item.nh3 || null,
      
      // Confidence and prediction metadata
      confidence: item.confidence || 0.85,
      confidencePercent: Math.round((item.confidence || 0.85) * 100),
      
      // Additional metadata
      temperature: item.weather?.temperature || item.temperature || null,
      humidity: item.weather?.humidity || item.humidity || null,
      windSpeed: item.weather?.wind_speed || item.wind_speed || null,
      
      // Derived values
      isHigh: aqi >= 151,
      isCritical: aqi >= 201,
      trend: index > 0 ? (aqi > rawForecastData[index - 1]?.predicted_aqi ? 'up' : 'down') : 'stable'
    };
  });
};

/**
 * Format forecast data for specific pollutant visualization
 * @param {Array} formattedData - Already formatted forecast data
 * @param {string} pollutant - Pollutant key (pm2_5, pm10, etc.)
 * @returns {Array} Data formatted for pollutant-specific charts
 */
export const formatPollutantData = (formattedData, pollutant) => {
  if (!Array.isArray(formattedData) || !pollutant) {
    return [];
  }

  return formattedData
    .filter(item => item[pollutant] !== null && item[pollutant] !== undefined)
    .map(item => ({
      ...item,
      value: item[pollutant],
      pollutant: pollutant,
      pollutantName: getPollutantDisplayName(pollutant),
      unit: getPollutantUnit(pollutant),
      formattedValue: `${item[pollutant]} ${getPollutantUnit(pollutant)}`
    }));
};

/**
 * Get display name for pollutant
 * @param {string} pollutant - Pollutant key
 * @returns {string} Display name
 */
export const getPollutantDisplayName = (pollutant) => {
  const names = {
    pm2_5: 'PM2.5',
    pm10: 'PM10',
    co: 'Carbon Monoxide',
    no2: 'Nitrogen Dioxide',
    o3: 'Ozone',
    so2: 'Sulfur Dioxide',
    nh3: 'Ammonia'
  };
  return names[pollutant] || pollutant.toUpperCase();
};

/**
 * Get unit for pollutant
 * @param {string} pollutant - Pollutant key
 * @returns {string} Unit string
 */
export const getPollutantUnit = (pollutant) => {
  const units = {
    pm2_5: 'μg/m³',
    pm10: 'μg/m³',
    co: 'μg/m³',
    no2: 'μg/m³',
    o3: 'μg/m³',
    so2: 'μg/m³',
    nh3: 'μg/m³'
  };
  return units[pollutant] || 'μg/m³';
};

/**
 * Generate time range options for forecast
 * @returns {Array} Time range options
 */
export const getTimeRangeOptions = () => [
  { id: '6h', label: '6 Hours', hours: 6, interval: 'hour' },
  { id: '24h', label: '24 Hours', hours: 24, interval: 'hour' },
  { id: '3d', label: '3 Days', hours: 72, interval: 'day' },
  { id: '7d', label: '7 Days', hours: 168, interval: 'day' }
];

/**
 * Generate pollutant options for tabs
 * @returns {Array} Pollutant options
 */
export const getPollutantOptions = () => [
  { id: 'aqi', label: 'Overall AQI', icon: '📊', color: '#3b82f6' },
  { id: 'pm2_5', label: 'PM2.5', icon: '🔴', color: '#ef4444' },
  { id: 'pm10', label: 'PM10', icon: '🟠', color: '#f97316' },
  { id: 'co', label: 'CO', icon: '🟤', color: '#a3a3a3' },
  { id: 'no2', label: 'NO₂', icon: '🟡', color: '#eab308' },
  { id: 'o3', label: 'O₃', icon: '🟢', color: '#22c55e' },
  { id: 'so2', label: 'SO₂', icon: '🟣', color: '#a855f7' }
];

/**
 * Calculate confidence intervals for forecast data
 * @param {Array} formattedData - Formatted forecast data
 * @param {number} confidenceLevel - Confidence level (0.8 for 80%, etc.)
 * @returns {Array} Data with confidence intervals
 */
export const calculateConfidenceIntervals = (formattedData, confidenceLevel = 0.8) => {
  return formattedData.map(item => {
    const baseValue = item.aqi;
    const confidence = item.confidence || 0.85;
    
    // Calculate margin of error based on confidence
    const marginOfError = baseValue * (1 - confidence) * 2;
    
    return {
      ...item,
      confidenceLower: Math.max(0, Math.round(baseValue - marginOfError)),
      confidenceUpper: Math.round(baseValue + marginOfError),
      marginOfError: Math.round(marginOfError)
    };
  });
};

/**
 * Group forecast data by time periods (hourly, daily)
 * @param {Array} formattedData - Formatted forecast data
 * @param {string} groupBy - Grouping period ('hour', 'day')
 * @returns {Array} Grouped data
 */
export const groupForecastData = (formattedData, groupBy = 'hour') => {
  if (!Array.isArray(formattedData) || formattedData.length === 0) {
    return [];
  }

  const grouped = {};
  
  formattedData.forEach(item => {
    const timestamp = new Date(item.timestamp);
    let key;
    
    if (groupBy === 'day') {
      key = timestamp.toDateString();
    } else {
      // Default to hour
      key = `${timestamp.toDateString()} ${timestamp.getHours()}:00`;
    }
    
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(item);
  });
  
  // Average values for each group
  return Object.entries(grouped).map(([key, items]) => {
    const avgItem = items.reduce((acc, item) => {
      acc.aqi += item.aqi;
      acc.confidence += item.confidence;
      if (item.pm2_5) acc.pm2_5 += item.pm2_5;
      if (item.pm10) acc.pm10 += item.pm10;
      if (item.co) acc.co += item.co;
      if (item.no2) acc.no2 += item.no2;
      if (item.o3) acc.o3 += item.o3;
      if (item.so2) acc.so2 += item.so2;
      return acc;
    }, {
      aqi: 0, confidence: 0, pm2_5: 0, pm10: 0, 
      co: 0, no2: 0, o3: 0, so2: 0
    });
    
    const count = items.length;
    const representative = items[0]; // Use first item for metadata
    
    return {
      ...representative,
      aqi: Math.round(avgItem.aqi / count),
      confidence: avgItem.confidence / count,
      pm2_5: avgItem.pm2_5 > 0 ? Math.round(avgItem.pm2_5 / count) : null,
      pm10: avgItem.pm10 > 0 ? Math.round(avgItem.pm10 / count) : null,
      co: avgItem.co > 0 ? Math.round(avgItem.co / count) : null,
      no2: avgItem.no2 > 0 ? Math.round(avgItem.no2 / count) : null,
      o3: avgItem.o3 > 0 ? Math.round(avgItem.o3 / count) : null,
      so2: avgItem.so2 > 0 ? Math.round(avgItem.so2 / count) : null,
      groupKey: key,
      itemCount: count
    };
  });
};

/**
 * Generate mock forecast data for development
 * @param {number} hours - Number of hours to generate
 * @param {Object} baseLocation - Base location coordinates
 * @returns {Array} Mock forecast data
 */
export const generateMockMLForecast = (hours = 24, baseLocation = { lat: 40.7128, lng: -74.0060 }) => {
  const data = [];
  const now = new Date();
  
  for (let i = 0; i < hours; i++) {
    const timestamp = new Date(now.getTime() + (i * 60 * 60 * 1000));
    
    // Generate realistic AQI trend
    const baseAQI = 80 + Math.sin(i / 4) * 30 + Math.random() * 20;
    const aqi = Math.max(10, Math.min(300, Math.round(baseAQI)));
    
    data.push({
      timestamp: timestamp.toISOString(),
      predicted_aqi: aqi,
      confidence: 0.75 + Math.random() * 0.2, // 75-95% confidence
      pollutant_levels: {
        pm2_5: Math.round(aqi * 0.6 + Math.random() * 10),
        pm10: Math.round(aqi * 0.8 + Math.random() * 15),
        co: Math.round(aqi * 1.2 + Math.random() * 50),
        no2: Math.round(aqi * 0.4 + Math.random() * 8),
        o3: Math.round(aqi * 0.3 + Math.random() * 5),
        so2: Math.round(aqi * 0.2 + Math.random() * 3)
      },
      weather: {
        temperature: 20 + Math.random() * 15,
        humidity: 40 + Math.random() * 40,
        wind_speed: Math.random() * 10
      }
    });
  }
  
  return data;
};

const forecastUtils = {
  formatForecastData,
  formatPollutantData,
  getPollutantDisplayName,
  getPollutantUnit,
  getTimeRangeOptions,
  getPollutantOptions,
  calculateConfidenceIntervals,
  groupForecastData,
  generateMockMLForecast
};

export default forecastUtils;
