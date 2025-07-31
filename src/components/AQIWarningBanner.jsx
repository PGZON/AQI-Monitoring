/**
 * AQI Warning Banner Component - Persistent banner for critical air quality conditions
 */

import React, { useState } from 'react';
import { getAQICategory, getHealthRecommendation } from '../utils/getAQICategoryColor';

const AQIWarningBanner = ({ 
  aqiData, 
  threshold = 151, 
  onDismiss,
  isDismissible = true,
  showHealthAdvice = true,
  compact = false
}) => {
  const [isDismissed, setIsDismissed] = useState(false);

  if (!aqiData || !aqiData.aqi || aqiData.aqi.index < threshold || isDismissed) {
    return null;
  }

  const currentAQI = aqiData.aqi.index;
  const category = getAQICategory(currentAQI);
  const recommendation = getHealthRecommendation(currentAQI);

  const handleDismiss = () => {
    setIsDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
  };

  const getBannerStyle = () => {
    if (currentAQI >= 201) {
      return {
        bg: 'bg-red-600',
        text: 'text-white',
        border: 'border-red-700',
        icon: '🚨',
        pulse: true
      };
    } else if (currentAQI >= 151) {
      return {
        bg: 'bg-red-500',
        text: 'text-white',
        border: 'border-red-600',
        icon: '⚠️',
        pulse: false
      };
    } else {
      return {
        bg: 'bg-orange-500',
        text: 'text-white',
        border: 'border-orange-600',
        icon: '⚠️',
        pulse: false
      };
    }
  };

  const bannerStyle = getBannerStyle();

  if (compact) {
    return (
      <div className={`
        ${bannerStyle.bg} ${bannerStyle.text} border-b ${bannerStyle.border} 
        ${bannerStyle.pulse ? 'animate-pulse' : ''}
      `}>
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-lg" role="img" aria-label="warning">
                {bannerStyle.icon}
              </span>
              <span className="font-medium text-sm">
                Air Quality Alert: AQI {currentAQI} - {category.label}
              </span>
            </div>
            
            {isDismissible && (
              <button
                onClick={handleDismiss}
                className="text-white hover:text-gray-200 transition-colors ml-4"
                aria-label="Dismiss banner"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`
      ${bannerStyle.bg} ${bannerStyle.text} border-b ${bannerStyle.border} 
      ${bannerStyle.pulse ? 'animate-pulse' : ''}
    `}>
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-1">
              <span className="text-2xl" role="img" aria-label="warning">
                {bannerStyle.icon}
              </span>
            </div>
            
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-1">
                {currentAQI >= 201 ? 'Emergency Air Quality Alert' : 'Air Quality Warning'}
              </h3>
              
              <div className="mb-2">
                <p className="text-sm opacity-90 mb-1">
                  Current AQI: <span className="font-semibold">{currentAQI}</span> - {category.label}
                </p>
                
                {aqiData.location && (
                  <p className="text-xs opacity-75">
                    📍 {aqiData.location.name || `${aqiData.location.latitude?.toFixed(2)}, ${aqiData.location.longitude?.toFixed(2)}`}
                  </p>
                )}
              </div>

              {showHealthAdvice && recommendation && (
                <div className="bg-white bg-opacity-15 rounded-lg p-3 mb-3">
                  <p className="text-sm font-medium mb-2">
                    Health Advisory:
                  </p>
                  <p className="text-sm opacity-90 mb-2">
                    {recommendation.message}
                  </p>
                  
                  {recommendation.actions && recommendation.actions.length > 0 && (
                    <div className="text-xs">
                      <p className="font-medium mb-1">Recommended Actions:</p>
                      <ul className="list-disc list-inside space-y-1 opacity-90">
                        {recommendation.actions.map((action, index) => (
                          <li key={index}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Quick Stats */}
              <div className="flex flex-wrap gap-4 text-xs">
                {aqiData.pollutants && (
                  <>
                    {aqiData.pollutants.pm2_5 && (
                      <span className="bg-white bg-opacity-15 px-2 py-1 rounded">
                        PM2.5: {aqiData.pollutants.pm2_5.concentration}µg/m³
                      </span>
                    )}
                    {aqiData.pollutants.pm10 && (
                      <span className="bg-white bg-opacity-15 px-2 py-1 rounded">
                        PM10: {aqiData.pollutants.pm10.concentration}µg/m³
                      </span>
                    )}
                  </>
                )}
                
                {aqiData.dataTimestamp && (
                  <span className="bg-white bg-opacity-15 px-2 py-1 rounded">
                    Updated: {new Date(aqiData.dataTimestamp).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {isDismissible && (
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 text-white hover:text-gray-200 transition-colors ml-4 p-1"
              aria-label="Dismiss banner"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>

        {/* Emergency Actions */}
        {currentAQI >= 201 && (
          <div className="mt-4 pt-3 border-t border-white border-opacity-20">
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => window.open('https://www.airnow.gov', '_blank')}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
              >
                📊 Check Official Sources
              </button>
              <button 
                onClick={() => window.open('tel:911', '_blank')}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
              >
                🚨 Emergency Services
              </button>
              <button 
                onClick={() => window.open('https://www.weather.gov/safety/airquality', '_blank')}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
              >
                ℹ️ Safety Guidelines
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AQIWarningBanner;
