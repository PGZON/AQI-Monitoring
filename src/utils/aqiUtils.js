/**
 * Air Quality Index (AQI) Utility Functions
 * Provides color coding, health categories, and calculation methods for AQI data
 */

// AQI Categories with color codes and health information
export const AQI_CATEGORIES = {
  GOOD: {
    range: [0, 50],
    level: 'Good',
    color: '#00e400',
    bgColor: '#f0f9ff',
    textColor: '#065f46',
    emoji: '🟢',
    description: 'Air quality is satisfactory',
    healthAdvice: 'Enjoy outdoor activities'
  },
  MODERATE: {
    range: [51, 100],
    level: 'Moderate',
    color: '#ffff00',
    bgColor: '#fefce8',
    textColor: '#a16207',
    emoji: '🟡',
    description: 'Air quality is acceptable',
    healthAdvice: 'Unusually sensitive people should consider reducing prolonged outdoor exertion'
  },
  UNHEALTHY_SENSITIVE: {
    range: [101, 150],
    level: 'Unhealthy for Sensitive Groups',
    color: '#ff7e00',
    bgColor: '#fff7ed',
    textColor: '#c2410c',
    emoji: '🟠',
    description: 'Sensitive groups may experience health effects',
    healthAdvice: 'Sensitive individuals should reduce outdoor activities'
  },
  UNHEALTHY: {
    range: [151, 200],
    level: 'Unhealthy',
    color: '#ff0000',
    bgColor: '#fef2f2',
    textColor: '#dc2626',
    emoji: '🔴',
    description: 'Everyone may experience health effects',
    healthAdvice: 'Everyone should reduce outdoor activities'
  },
  VERY_UNHEALTHY: {
    range: [201, 300],
    level: 'Very Unhealthy',
    color: '#8f3f97',
    bgColor: '#faf5ff',
    textColor: '#7c3aed',
    emoji: '🟣',
    description: 'Health alert: everyone may experience serious health effects',
    healthAdvice: 'Everyone should avoid outdoor activities'
  },
  HAZARDOUS: {
    range: [301, 500],
    level: 'Hazardous',
    color: '#7e0023',
    bgColor: '#fdf2f8',
    textColor: '#be185d',
    emoji: '🆘',
    description: 'Health warnings of emergency conditions',
    healthAdvice: 'Everyone should remain indoors'
  }
};

// Pollutant information with safe thresholds
export const POLLUTANT_INFO = {
  pm2_5: {
    name: 'PM2.5',
    fullName: 'Fine Particulate Matter',
    unit: 'μg/m³',
    description: 'Particles smaller than 2.5 micrometers',
    safeThreshold: 15,
    moderateThreshold: 35,
    unhealthyThreshold: 65
  },
  pm10: {
    name: 'PM10',
    fullName: 'Particulate Matter',
    unit: 'μg/m³',
    description: 'Particles smaller than 10 micrometers',
    safeThreshold: 50,
    moderateThreshold: 100,
    unhealthyThreshold: 150
  },
  co: {
    name: 'CO',
    fullName: 'Carbon Monoxide',
    unit: 'mg/m³',
    description: 'Colorless, odorless gas',
    safeThreshold: 10,
    moderateThreshold: 20,
    unhealthyThreshold: 30
  },
  no2: {
    name: 'NO₂',
    fullName: 'Nitrogen Dioxide',
    unit: 'μg/m³',
    description: 'Reddish-brown gas',
    safeThreshold: 40,
    moderateThreshold: 80,
    unhealthyThreshold: 120
  },
  o3: {
    name: 'O₃',
    fullName: 'Ozone',
    unit: 'μg/m³',
    description: 'Ground-level ozone',
    safeThreshold: 100,
    moderateThreshold: 160,
    unhealthyThreshold: 240
  },
  so2: {
    name: 'SO₂',
    fullName: 'Sulfur Dioxide',
    unit: 'μg/m³',
    description: 'Colorless gas with strong odor',
    safeThreshold: 20,
    moderateThreshold: 80,
    unhealthyThreshold: 250
  },
  nh3: {
    name: 'NH₃',
    fullName: 'Ammonia',
    unit: 'μg/m³',
    description: 'Colorless gas with pungent smell',
    safeThreshold: 200,
    moderateThreshold: 400,
    unhealthyThreshold: 800
  }
};

/**
 * Get AQI category information based on AQI value
 * @param {number} aqiValue - The AQI index value
 * @returns {Object} Category information with colors, level, and health advice
 */
export const getAQICategory = (aqiValue) => {
  if (aqiValue <= 50) return AQI_CATEGORIES.GOOD;
  if (aqiValue <= 100) return AQI_CATEGORIES.MODERATE;
  if (aqiValue <= 150) return AQI_CATEGORIES.UNHEALTHY_SENSITIVE;
  if (aqiValue <= 200) return AQI_CATEGORIES.UNHEALTHY;
  if (aqiValue <= 300) return AQI_CATEGORIES.VERY_UNHEALTHY;
  return AQI_CATEGORIES.HAZARDOUS;
};

/**
 * Get pollutant risk level based on value and thresholds
 * @param {string} pollutantKey - The pollutant key (e.g., 'pm2_5')
 * @param {number} value - The pollutant value
 * @returns {Object} Risk level information with color and status
 */
export const getPollutantRiskLevel = (pollutantKey, value) => {
  const pollutant = POLLUTANT_INFO[pollutantKey];
  if (!pollutant || value === null || value === undefined) {
    return {
      level: 'Unknown',
      color: '#6b7280',
      bgColor: '#f9fafb',
      textColor: '#374151',
      percentage: 0
    };
  }

  let level, color, bgColor, textColor, percentage;

  if (value <= pollutant.safeThreshold) {
    level = 'Safe';
    color = '#10b981';
    bgColor = '#ecfdf5';
    textColor = '#065f46';
    percentage = Math.min((value / pollutant.safeThreshold) * 100, 100);
  } else if (value <= pollutant.moderateThreshold) {
    level = 'Moderate';
    color = '#f59e0b';
    bgColor = '#fefce8';
    textColor = '#a16207';
    percentage = Math.min(((value - pollutant.safeThreshold) / (pollutant.moderateThreshold - pollutant.safeThreshold)) * 100 + 100, 200);
  } else {
    level = 'High Risk';
    color = '#ef4444';
    bgColor = '#fef2f2';
    textColor = '#dc2626';
    percentage = Math.min(((value - pollutant.moderateThreshold) / (pollutant.unhealthyThreshold - pollutant.moderateThreshold)) * 100 + 200, 300);
  }

  return {
    level,
    color,
    bgColor,
    textColor,
    percentage: Math.round(percentage)
  };
};

/**
 * Format timestamp to readable time
 * @param {string|Date} timestamp - The timestamp to format
 * @returns {string} Formatted time string
 */
export const formatLastUpdated = (timestamp) => {
  if (!timestamp) return 'Unknown';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMinutes = Math.floor((now - date) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

/**
 * Generate mock AQI data for testing when backend is not available
 * @returns {Object} Mock AQI data structure
 */
export const generateMockAQIData = () => {
  const mockAQI = Math.floor(Math.random() * 200) + 20; // Random AQI between 20-220
  const category = getAQICategory(mockAQI);
  
  return {
    aqi: {
      index: mockAQI,
      level: category.level,
      category: category.level
    },
    location: {
      city: 'Mock City',
      country: 'Test Country',
      formatted: 'Mock City, Test Country'
    },
    coordinates: {
      latitude: 40.7128,
      longitude: -74.0060
    },
    pollutants: {
      pm2_5: { value: Math.floor(Math.random() * 50) + 5, unit: 'μg/m³' },
      pm10: { value: Math.floor(Math.random() * 80) + 10, unit: 'μg/m³' },
      co: { value: Math.floor(Math.random() * 15) + 2, unit: 'mg/m³' },
      no2: { value: Math.floor(Math.random() * 60) + 10, unit: 'μg/m³' },
      o3: { value: Math.floor(Math.random() * 120) + 20, unit: 'μg/m³' },
      so2: { value: Math.floor(Math.random() * 40) + 5, unit: 'μg/m³' },
      nh3: { value: Math.floor(Math.random() * 100) + 10, unit: 'μg/m³' }
    },
    weather: {
      temperature: Math.floor(Math.random() * 30) + 5,
      humidity: Math.floor(Math.random() * 40) + 40,
      windSpeed: Math.floor(Math.random() * 20) + 2
    },
    requestTimestamp: new Date().toISOString(),
    dataTimestamp: new Date().toISOString(),
    source: 'mock'
  };
};

/**
 * Calculate AQI trend based on previous and current values
 * @param {number} currentAQI - Current AQI value
 * @param {number} previousAQI - Previous AQI value
 * @returns {Object} Trend information with direction and color
 */
export const getAQITrend = (currentAQI, previousAQI) => {
  if (!previousAQI || !currentAQI) {
    return { direction: 'stable', arrow: '→', color: '#6b7280', change: 0 };
  }
  
  const change = currentAQI - previousAQI;
  const percentChange = Math.abs(change / previousAQI * 100);
  
  if (Math.abs(change) < 5) {
    return { 
      direction: 'stable', 
      arrow: '→', 
      color: '#6b7280', 
      change: 0,
      text: 'Stable'
    };
  }
  
  if (change > 0) {
    return { 
      direction: 'up', 
      arrow: '↗', 
      color: '#ef4444', 
      change: Math.round(percentChange),
      text: `+${Math.round(percentChange)}%`
    };
  }
  
  return { 
    direction: 'down', 
    arrow: '↘', 
    color: '#10b981', 
    change: Math.round(percentChange),
    text: `-${Math.round(percentChange)}%`
  };
};

/**
 * Get color for heatmap based on AQI value
 * @param {number} aqiValue - The AQI value
 * @returns {string} Hex color code for heatmap markers
 */
export const getHeatmapColor = (aqiValue) => {
  const category = getAQICategory(aqiValue);
  return category.color;
};

/**
 * Get marker size based on AQI value for heatmap (made bigger for visibility)
 * @param {number} aqiValue - The AQI value
 * @returns {number} Marker size in pixels
 */
export const getHeatmapMarkerSize = (aqiValue) => {
  if (aqiValue <= 50) return 12;   // Increased from 8
  if (aqiValue <= 100) return 16;  // Increased from 12
  if (aqiValue <= 150) return 20;  // Increased from 16
  if (aqiValue <= 200) return 24;  // Increased from 20
  if (aqiValue <= 300) return 28;  // Increased from 24
  return 32;                       // Increased from 28
};

/**
 * Generate mock heatmap data for multiple locations
 * @param {number} count - Number of locations to generate
 * @returns {Array} Array of location data with AQI values
 */
export const generateMockHeatmapData = (count = 20) => {
  const locations = [];
  
  // Base coordinates for different Indian cities (expanded list)
  const baseCities = [
    { name: 'Kolhapur', lat: 16.7050, lng: 74.2433 },
    { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
    { name: 'Delhi', lat: 28.6139, lng: 77.2090 },
    { name: 'Bangalore', lat: 12.9716, lng: 77.5946 },
    { name: 'Pune', lat: 18.5204, lng: 73.8567 },
    { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
    { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
    { name: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
    { name: 'Lucknow', lat: 26.8467, lng: 80.9462 },
    { name: 'Jaipur', lat: 26.9124, lng: 75.7873 },
    { name: 'Surat', lat: 21.1702, lng: 72.8311 },
    { name: 'Kanpur', lat: 26.4499, lng: 80.3319 },
    { name: 'Nagpur', lat: 21.1458, lng: 79.0882 },
    { name: 'Indore', lat: 22.7196, lng: 75.8577 },
    { name: 'Thane', lat: 19.2183, lng: 72.9781 },
    { name: 'Bhopal', lat: 23.2599, lng: 77.4126 },
    { name: 'Visakhapatnam', lat: 17.6868, lng: 83.2185 },
    { name: 'Patna', lat: 25.5941, lng: 85.1376 },
    { name: 'Vadodara', lat: 22.3072, lng: 73.1812 },
    { name: 'Ghaziabad', lat: 28.6692, lng: 77.4538 },
    { name: 'Ludhiana', lat: 30.9010, lng: 75.8573 },
    { name: 'Agra', lat: 27.1767, lng: 78.0081 },
    { name: 'Nashik', lat: 19.9975, lng: 73.7898 },
    { name: 'Faridabad', lat: 28.4089, lng: 77.3178 },
    { name: 'Meerut', lat: 28.9845, lng: 77.7064 },
    { name: 'Rajkot', lat: 22.3039, lng: 70.8022 },
    { name: 'Kalyan', lat: 19.2437, lng: 73.1355 },
    { name: 'Vasai', lat: 19.4911, lng: 72.8060 },
    { name: 'Varanasi', lat: 25.3176, lng: 82.9739 },
    { name: 'Srinagar', lat: 34.0837, lng: 74.7973 }
  ];
  
  for (let i = 0; i < count; i++) {
    const baseCity = baseCities[i % baseCities.length];
    
    // Generate truly unique AQI for each location using multiple factors
    const cityHash = baseCity.name.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const stationNumber = Math.floor(i / baseCities.length) + 1;
    const seed = cityHash + i * 17 + stationNumber * 7; // More variation
    
    // Create AQI value between 15-250 with good distribution
    const normalizedSeed = Math.abs(Math.sin(seed * 0.1)) * 0.8 + Math.abs(Math.cos(seed * 0.05)) * 0.2;
    const aqiValue = Math.floor(normalizedSeed * 235) + 15; // 15-250 range
    const category = getAQICategory(aqiValue);
    
    // Add realistic variation to coordinates based on station number
    const latVariation = (Math.sin(seed * 0.02) * 0.5) * 0.4; // ±0.2 degrees
    const lngVariation = (Math.cos(seed * 0.03) * 0.5) * 0.4; // ±0.2 degrees
    
    // Generate unique pollutant values correlated with AQI but with variation
    const pm25Base = Math.floor(aqiValue * 0.4); // Base PM2.5 from AQI
    const pm25Variation = Math.floor(Math.sin(seed * 0.07) * 15); // ±15 variation
    const pm25Value = Math.max(1, Math.min(150, pm25Base + pm25Variation));
    
    const pm10Base = Math.floor(aqiValue * 0.6); // Base PM10 from AQI  
    const pm10Variation = Math.floor(Math.cos(seed * 0.09) * 20); // ±20 variation
    const pm10Value = Math.max(2, Math.min(200, pm10Base + pm10Variation));
    
    locations.push({
      id: `location_${i}_${baseCity.name.toLowerCase().replace(/\s+/g, '_')}_st${stationNumber}`,
      name: `${baseCity.name} Station ${stationNumber}`,
      coordinates: {
        lat: baseCity.lat + latVariation,
        lng: baseCity.lng + lngVariation
      },
      aqi: {
        index: aqiValue,
        level: category.level,
        color: category.color
      },
      pollutants: {
        pm2_5: { value: pm25Value, unit: 'μg/m³' },
        pm10: { value: pm10Value, unit: 'μg/m³' },
        co: { value: Math.floor(Math.abs(Math.sin(seed * 0.11)) * 12) + 1, unit: 'mg/m³' },
        no2: { value: Math.floor(Math.abs(Math.cos(seed * 0.13)) * 55) + 5, unit: 'μg/m³' },
        o3: { value: Math.floor(Math.abs(Math.sin(seed * 0.17)) * 110) + 10, unit: 'μg/m³' }
      },
      lastUpdated: new Date(Date.now() - Math.floor(Math.abs(Math.sin(seed * 0.19)) * 7200000)).toISOString() // 0-2 hours ago
    });
    
    // Debug logging for first few locations
    if (i < 5) {
      console.log(`Location ${i}: ${baseCity.name} Station ${stationNumber} - AQI: ${aqiValue}, Seed: ${seed}`);
    }
  }
  
  return locations;
};

/**
 * Get forecast period labels
 * @returns {Array} Array of time period labels
 */
export const getForecastPeriods = () => {
  const periods = [];
  const now = new Date();
  
  for (let i = 0; i < 24; i += 3) {
    const time = new Date(now.getTime() + i * 60 * 60 * 1000);
    periods.push({
      label: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      hour: time.getHours(),
      timestamp: time.toISOString()
    });
  }
  
  return periods;
};

/**
 * Generate mock forecast data
 * @returns {Array} Array of forecast data points
 */
export const generateMockForecastData = () => {
  const periods = getForecastPeriods();
  let baseAQI = Math.floor(Math.random() * 100) + 50;
  
  return periods.map((period, index) => {
    // Add some realistic variation
    const variation = (Math.random() - 0.5) * 20;
    baseAQI = Math.max(20, Math.min(200, baseAQI + variation));
    
    const category = getAQICategory(baseAQI);
    
    return {
      time: period.label,
      timestamp: period.timestamp,
      aqi: Math.round(baseAQI),
      level: category.level,
      color: category.color,
      pm2_5: Math.floor(Math.random() * 50) + 10,
      pm10: Math.floor(Math.random() * 80) + 20,
      o3: Math.floor(Math.random() * 120) + 30,
      no2: Math.floor(Math.random() * 60) + 15
    };
  });
};
