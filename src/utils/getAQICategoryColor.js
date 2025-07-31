/**
 * Utility functions for AQI color categorization and styling
 */

// AQI Categories based on US EPA standards
export const AQI_CATEGORIES = {
  GOOD: { min: 0, max: 50, label: 'Good', emoji: '🟢' },
  MODERATE: { min: 51, max: 100, label: 'Moderate', emoji: '🟡' },
  UNHEALTHY_SENSITIVE: { min: 101, max: 150, label: 'Unhealthy for Sensitive Groups', emoji: '🟠' },
  UNHEALTHY: { min: 151, max: 200, label: 'Unhealthy', emoji: '🔴' },
  VERY_UNHEALTHY: { min: 201, max: 300, label: 'Very Unhealthy', emoji: '🟣' },
  HAZARDOUS: { min: 301, max: 500, label: 'Hazardous', emoji: '🟤' }
};

/**
 * Get AQI category based on index value
 * @param {number} aqi - AQI index value
 * @returns {Object} Category object with min, max, label, emoji
 */
export const getAQICategory = (aqi) => {
  if (aqi <= 50) return AQI_CATEGORIES.GOOD;
  if (aqi <= 100) return AQI_CATEGORIES.MODERATE;
  if (aqi <= 150) return AQI_CATEGORIES.UNHEALTHY_SENSITIVE;
  if (aqi <= 200) return AQI_CATEGORIES.UNHEALTHY;
  if (aqi <= 300) return AQI_CATEGORIES.VERY_UNHEALTHY;
  return AQI_CATEGORIES.HAZARDOUS;
};

/**
 * Get color scheme for AQI value
 * @param {number} aqi - AQI index value
 * @returns {Object} Color scheme with various properties
 */
export const getAQICategoryColor = (aqi) => {
  if (aqi <= 50) {
    return {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      accent: 'text-green-600',
      button: 'bg-green-600 hover:bg-green-700',
      gradient: 'from-green-50 to-green-100',
      ring: 'ring-green-500',
      hex: '#22c55e',
      severity: 'low'
    };
  } else if (aqi <= 100) {
    return {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      accent: 'text-yellow-600',
      button: 'bg-yellow-600 hover:bg-yellow-700',
      gradient: 'from-yellow-50 to-yellow-100',
      ring: 'ring-yellow-500',
      hex: '#eab308',
      severity: 'moderate'
    };
  } else if (aqi <= 150) {
    return {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-800',
      accent: 'text-orange-600',
      button: 'bg-orange-600 hover:bg-orange-700',
      gradient: 'from-orange-50 to-orange-100',
      ring: 'ring-orange-500',
      hex: '#f97316',
      severity: 'unhealthy-sensitive'
    };
  } else if (aqi <= 200) {
    return {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      accent: 'text-red-600',
      button: 'bg-red-600 hover:bg-red-700',
      gradient: 'from-red-50 to-red-100',
      ring: 'ring-red-500',
      hex: '#ef4444',
      severity: 'unhealthy'
    };
  } else if (aqi <= 300) {
    return {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-800',  
      accent: 'text-purple-600',
      button: 'bg-purple-600 hover:bg-purple-700',
      gradient: 'from-purple-50 to-purple-100',
      ring: 'ring-purple-500',
      hex: '#a855f7',
      severity: 'very-unhealthy'
    };
  } else {
    return {
      bg: 'bg-gray-900',
      border: 'border-gray-700',
      text: 'text-white',
      accent: 'text-gray-100',
      button: 'bg-gray-800 hover:bg-gray-900',
      gradient: 'from-gray-800 to-gray-900',
      ring: 'ring-gray-500',
      hex: '#1f2937',
      severity: 'hazardous'
    };
  }
};

/**
 * Get health recommendation based on AQI
 * @param {number} aqi - AQI index value
 * @returns {Object} Health recommendation with message and actions
 */
export const getHealthRecommendation = (aqi) => {
  const category = getAQICategory(aqi);
  
  switch (category) {
    case AQI_CATEGORIES.GOOD:
      return {
        message: "Air quality is satisfactory. Enjoy outdoor activities!",
        actions: ["Perfect for outdoor exercise", "Great day for a walk"],
        urgency: 'low'
      };
      
    case AQI_CATEGORIES.MODERATE:
      return {
        message: "Air quality is acceptable for most people.",
        actions: ["Unusually sensitive people should consider reducing prolonged outdoor exertion"],
        urgency: 'low'
      };
      
    case AQI_CATEGORIES.UNHEALTHY_SENSITIVE:
      return {
        message: "Sensitive groups should limit outdoor exposure.",
        actions: [
          "Children, elderly, and people with respiratory conditions should reduce outdoor activities",
          "Consider indoor exercise alternatives"
        ],
        urgency: 'medium'
      };
      
    case AQI_CATEGORIES.UNHEALTHY:
      return {
        message: "Everyone should limit outdoor exposure.",
        actions: [
          "Avoid outdoor exercise",
          "Keep windows closed",
          "Use air purifiers if available"
        ],
        urgency: 'high'
      };
      
    case AQI_CATEGORIES.VERY_UNHEALTHY:
      return {
        message: "Avoid all outdoor activities.",
        actions: [
          "Stay indoors with windows and doors closed",
          "Use air purifiers",
          "Wear N95 masks if you must go outside"
        ],
        urgency: 'very-high'
      };
      
    case AQI_CATEGORIES.HAZARDOUS:
      return {
        message: "Emergency conditions - avoid all outdoor exposure.",
        actions: [
          "Stay indoors at all times",
          "Seal doors and windows",
          "Consider evacuation if possible"
        ],
        urgency: 'emergency'
      };
      
    default:
      return {
        message: "Unable to determine air quality status.",
        actions: ["Monitor conditions and check official sources"],
        urgency: 'unknown'
      };
  }
};

/**
 * Check if AQI value should trigger an alert
 * @param {number} currentAQI - Current AQI value
 * @param {number} threshold - User's alert threshold
 * @param {number} previousAQI - Previous AQI value (optional)
 * @returns {Object} Alert information
 */
export const shouldTriggerAlert = (currentAQI, threshold, previousAQI = null) => {
  const shouldAlert = currentAQI >= threshold;
  const category = getAQICategory(currentAQI);
  const colors = getAQICategoryColor(currentAQI);
  const recommendation = getHealthRecommendation(currentAQI);
  
  let alertType = 'info';
  let alertTitle = `AQI is ${currentAQI}`;
  
  if (currentAQI >= 201) {
    alertType = 'error';
    alertTitle = `🚨 Critical Air Quality Alert`;
  } else if (currentAQI >= 151) {
    alertType = 'error';
    alertTitle = `⚠️ Unhealthy Air Quality`;
  } else if (currentAQI >= 101) {
    alertType = 'warning';
    alertTitle = `⚠️ Air Quality Alert`;
  } else if (currentAQI >= threshold) {
    alertType = 'warning';
    alertTitle = `📊 AQI Threshold Exceeded`;
  }
  
  // Check for significant changes
  let changeAlert = null;
  if (previousAQI && Math.abs(currentAQI - previousAQI) >= 25) {
    const direction = currentAQI > previousAQI ? 'increased' : 'decreased';
    const change = Math.abs(currentAQI - previousAQI);
    changeAlert = {
      type: currentAQI > previousAQI ? 'warning' : 'info',
      title: `AQI ${direction} significantly`,
      message: `Air quality ${direction} by ${change} points (${previousAQI} → ${currentAQI})`
    };
  }
  
  return {
    shouldAlert,
    alertType,
    alertTitle,
    message: `Current AQI: ${currentAQI} - ${category.label}`,
    category,
    colors,
    recommendation,
    changeAlert,
    isEmergency: currentAQI >= 201,
    isCritical: currentAQI >= 151
  };
};

const aqiUtils = {
  AQI_CATEGORIES,
  getAQICategory,
  getAQICategoryColor,
  getHealthRecommendation,
  shouldTriggerAlert
};

export default aqiUtils;
