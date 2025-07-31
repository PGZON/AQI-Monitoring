/**
 * Pollutant Forecast Tabs Component
 * Provides tabbed interface to switch between different pollutant forecasts
 */

import React from 'react';
import { getPollutantOptions, getPollutantDisplayName } from '../utils/formatForecastData';

const PollutantForecastTabs = ({ 
  activePollutant = 'aqi', 
  onPollutantChange, 
  availablePollutants = [],
  data = [],
  showCounts = true
}) => {
  const allPollutants = getPollutantOptions();
  
  // Filter pollutants based on available data
  const availableTabs = allPollutants.filter(pollutant => {
    if (pollutant.id === 'aqi') return true;
    
    // Check if we have data for this pollutant
    if (availablePollutants.length > 0) {
      return availablePollutants.includes(pollutant.id);
    }
    
    // Check if any data points have this pollutant
    return data.some(item => 
      item[pollutant.id] !== null && 
      item[pollutant.id] !== undefined && 
      item[pollutant.id] > 0
    );
  });

  // Get data count for each pollutant
  const getPollutantDataCount = (pollutantId) => {
    if (pollutantId === 'aqi') {
      return data.filter(item => item.aqi > 0).length;
    }
    
    return data.filter(item => 
      item[pollutantId] !== null && 
      item[pollutantId] !== undefined && 
      item[pollutantId] > 0
    ).length;
  };

  // Get average value for pollutant
  const getPollutantAverage = (pollutantId) => {
    const validData = data.filter(item => {
      const value = pollutantId === 'aqi' ? item.aqi : item[pollutantId];
      return value !== null && value !== undefined && value > 0;
    });
    
    if (validData.length === 0) return 0;
    
    const sum = validData.reduce((acc, item) => {
      return acc + (pollutantId === 'aqi' ? item.aqi : item[pollutantId]);
    }, 0);
    
    return Math.round(sum / validData.length);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Forecast Pollutants</h3>
        <div className="text-sm text-gray-500">
          Select pollutant to view detailed predictions
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {availableTabs.map((pollutant) => {
            const isActive = activePollutant === pollutant.id;
            const dataCount = getPollutantDataCount(pollutant.id);
            const hasData = dataCount > 0;
            
            return (
              <button
                key={pollutant.id}
                onClick={() => onPollutantChange(pollutant.id)}
                disabled={!hasData}
                className={`
                  flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                  ${isActive
                    ? 'border-blue-500 text-blue-600'
                    : hasData
                    ? 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    : 'border-transparent text-gray-300 cursor-not-allowed'
                  }
                `}
              >
                <span className="text-lg" role="img" aria-label={pollutant.label}>
                  {pollutant.icon}
                </span>
                <span>{pollutant.label}</span>
                
                {showCounts && hasData && (
                  <span className={`
                    px-2 py-1 text-xs rounded-full
                    ${isActive 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-600'
                    }
                  `}>
                    {dataCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content Info */}
      <div className="mt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Selected Pollutant Info */}
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              {availableTabs.find(p => p.id === activePollutant)?.icon && (
                <span className="text-lg">
                  {availableTabs.find(p => p.id === activePollutant)?.icon}
                </span>
              )}
              <h4 className="font-medium text-blue-900">
                {getPollutantDisplayName(activePollutant)}
              </h4>
            </div>
            <div className="text-sm text-blue-700">
              <div className="flex justify-between">
                <span>Forecast Points:</span>
                <span className="font-medium">{getPollutantDataCount(activePollutant)}</span>
              </div>
              <div className="flex justify-between">
                <span>Average Value:</span>
                <span className="font-medium">
                  {getPollutantAverage(activePollutant)} {activePollutant === 'aqi' ? '' : 'μg/m³'}
                </span>
              </div>
            </div>
          </div>

          {/* Data Quality Info */}
          <div className="bg-green-50 rounded-lg p-3">
            <h4 className="font-medium text-green-900 mb-2">📊 Data Quality</h4>
            <div className="text-sm text-green-700">
              <div className="flex justify-between">
                <span>Available Pollutants:</span>
                <span className="font-medium">{availableTabs.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Data Points:</span>
                <span className="font-medium">{data.length}</span>
              </div>
            </div>
          </div>

          {/* Forecast Period Info */}
          <div className="bg-purple-50 rounded-lg p-3">
            <h4 className="font-medium text-purple-900 mb-2">⏰ Forecast Period</h4>
            <div className="text-sm text-purple-700">
              {data.length > 0 ? (
                <>
                  <div className="flex justify-between">
                    <span>From:</span>
                    <span className="font-medium">{data[0]?.time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>To:</span>
                    <span className="font-medium">{data[data.length - 1]?.time}</span>
                  </div>
                </>
              ) : (
                <span>No forecast data available</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pollutant Descriptions */}
      {activePollutant !== 'aqi' && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-700">
            <strong>{getPollutantDisplayName(activePollutant)}:</strong>{' '}
            {getPollutantDescription(activePollutant)}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Get description for pollutant
 */
const getPollutantDescription = (pollutant) => {
  const descriptions = {
    pm2_5: 'Fine particulate matter with diameter ≤ 2.5 micrometers. Primary health concern due to deep lung penetration.',
    pm10: 'Particulate matter with diameter ≤ 10 micrometers. Includes dust, pollen, and smoke particles.',
    co: 'Carbon monoxide, a colorless, odorless gas that can be harmful when inhaled in large amounts.',
    no2: 'Nitrogen dioxide, a reddish-brown gas that can irritate airways and reduce lung function.',
    o3: 'Ground-level ozone, formed by chemical reactions between pollutants in sunlight. Key component of smog.',
    so2: 'Sulfur dioxide, a gas that can cause respiratory problems and contribute to acid rain formation.',
    nh3: 'Ammonia, a gas that contributes to particulate matter formation and can cause respiratory irritation.'
  };
  
  return descriptions[pollutant] || 'Air quality pollutant measurement.';
};

export default PollutantForecastTabs;
