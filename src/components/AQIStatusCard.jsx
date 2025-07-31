import React from 'react';
import { getAQICategory, formatLastUpdated, getAQITrend } from '../utils/aqiUtils';
import { getAQICategoryColor } from '../utils/getAQICategoryColor';

const AQIStatusCard = ({ 
  aqiData, 
  isLoading, 
  previousAQI, 
  onRefresh,
  lastUpdated 
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
        <div className="animate-pulse">
          <div className="flex items-center justify-center">
            <div className="w-24 h-24 bg-gray-200 rounded-full mb-4"></div>
          </div>
          <div className="text-center">
            <div className="h-8 bg-gray-200 rounded w-32 mx-auto mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-48 mx-auto mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-40 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!aqiData) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">❌</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No AQI Data Available</h3>
          <p className="text-gray-600 mb-4">Unable to fetch air quality data. Please try again.</p>
          <button
            onClick={onRefresh}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const category = getAQICategory(aqiData.aqi.index);
  const colors = getAQICategoryColor(aqiData.aqi.index);
  const trend = getAQITrend(aqiData.aqi.index, previousAQI);
  const location = aqiData.location?.formatted || aqiData.location?.city || 'Unknown Location';

  return (
    <div className={`bg-white rounded-xl shadow-lg p-8 mb-6 relative overflow-hidden border-2 ${colors.border}`}>
      {/* Background gradient based on AQI level */}
      <div className={`absolute inset-0 opacity-5 ${colors.bg}`}></div>
      
      {/* Pulse animation for critical levels */}
      {aqiData.aqi.index >= 201 && (
        <div className="absolute inset-0 animate-pulse bg-red-500 opacity-10"></div>
      )}
      
      <div className="relative z-10">
        {/* Location and Last Updated */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-lg">📍</span>
            <h2 className="text-xl font-semibold text-gray-900">{location}</h2>
          </div>
          <p className="text-sm text-gray-600">
            Last updated: {formatLastUpdated(lastUpdated || aqiData.requestTimestamp)}
          </p>
        </div>

        {/* Main AQI Display */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-4 mb-4">
            {/* AQI Value Circle */}
            <div 
              className={`w-32 h-32 rounded-full flex items-center justify-center border-8 relative ${colors.bg} ${colors.border}`}
            >
              <div className="text-center">
                <div className={`text-4xl font-bold ${colors.text}`}>
                  {aqiData.aqi.index}
                </div>
                <div className="text-xs font-medium text-gray-600">AQI</div>
              </div>
              
              {/* Critical level indicator */}
              {aqiData.aqi.index >= 151 && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
              )}
            </div>

            {/* Trend Indicator */}
            {previousAQI && (
              <div className="flex flex-col items-center">
                <div 
                  className="text-2xl font-bold"
                  style={{ color: trend.color }}
                >
                  {trend.arrow}
                </div>
                <div 
                  className="text-sm font-medium"
                  style={{ color: trend.color }}
                >
                  {trend.text}
                </div>
              </div>
            )}
          </div>

          {/* Category Display */}
          <div className="mb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-2xl">{category.emoji}</span>
              <h3 className={`text-2xl font-bold ${colors.text}`}>
                {category.level}
              </h3>
            </div>
            <p className="text-gray-700 mb-2">{category.description}</p>
            <p className="text-sm text-gray-600 italic">{category.healthAdvice}</p>
            
            {/* Health Alert for high AQI */}
            {aqiData.aqi.index >= 151 && (
              <div className={`mt-3 p-3 rounded-lg ${colors.bg} ${colors.border} border`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">⚠️</span>
                  <p className={`font-semibold ${colors.text}`}>Health Alert</p>
                </div>
                <p className={`text-sm ${colors.accent}`}>
                  {aqiData.aqi.index >= 201 
                    ? "Emergency conditions. Avoid all outdoor exposure."
                    : aqiData.aqi.index >= 151 
                    ? "Everyone should limit outdoor exposure."
                    : "Sensitive groups should reduce outdoor activities."
                  }
                </p>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          {aqiData.weather && (
            <div className="flex justify-center gap-6 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
              {aqiData.weather.temperature && (
                <div className="flex items-center gap-1">
                  <span>🌡️</span>
                  <span>{Math.round(aqiData.weather.temperature)}°C</span>
                </div>
              )}
              {aqiData.weather.humidity && (
                <div className="flex items-center gap-1">
                  <span>💧</span>
                  <span>{Math.round(aqiData.weather.humidity)}%</span>
                </div>
              )}
              {aqiData.weather.windSpeed && (
                <div className="flex items-center gap-1">
                  <span>💨</span>
                  <span>{Math.round(aqiData.weather.windSpeed)} m/s</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Refresh Button */}
        <div className="text-center">
          <button
            onClick={onRefresh}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium shadow-md hover:shadow-lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Refreshing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span>🔄</span>
                Refresh Data
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AQIStatusCard;
