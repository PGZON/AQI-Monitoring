import React from 'react';
import { POLLUTANT_INFO, getPollutantRiskLevel } from '../utils/aqiUtils';

const PollutantCard = ({ pollutantKey, data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-20 mb-3"></div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-12"></div>
        </div>
      </div>
    );
  }

  const pollutantInfo = POLLUTANT_INFO[pollutantKey];
  if (!pollutantInfo) {
    return null;
  }

  const value = data?.value;
  const unit = data?.unit || pollutantInfo.unit;
  const riskLevel = getPollutantRiskLevel(pollutantKey, value);

  // Calculate progress bar percentage (capped at 100% for display)
  const progressPercentage = Math.min((riskLevel.percentage / 3) * 100, 100);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">{pollutantInfo.name}</h3>
          <p className="text-xs text-gray-500">{pollutantInfo.fullName}</p>
        </div>
        <div 
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: riskLevel.color }}
          title={riskLevel.level}
        ></div>
      </div>

      {/* Value Display */}
      <div className="mb-3">
        {value !== null && value !== undefined ? (
          <div className="flex items-baseline gap-1">
            <span 
              className="text-2xl font-bold"
              style={{ color: riskLevel.textColor }}
            >
              {typeof value === 'number' ? value.toFixed(1) : value}
            </span>
            <span className="text-sm text-gray-600">{unit}</span>
          </div>
        ) : (
          <div className="text-gray-400">
            <span className="text-lg">--</span>
            <span className="text-sm ml-1">{unit}</span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div 
            className="h-2 rounded-full transition-all duration-500 ease-out"
            style={{ 
              width: `${progressPercentage}%`,
              backgroundColor: riskLevel.color 
            }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0</span>
          <span>{pollutantInfo.unhealthyThreshold}+</span>
        </div>
      </div>

      {/* Risk Level Indicator */}
      <div className="flex items-center justify-between">
        <div 
          className="px-2 py-1 rounded-full text-xs font-medium"
          style={{ 
            backgroundColor: riskLevel.bgColor,
            color: riskLevel.textColor 
          }}
        >
          {riskLevel.level}
        </div>
        
        {/* Threshold comparison */}
        {value !== null && value !== undefined && (
          <div className="text-xs text-gray-500">
            {value <= pollutantInfo.safeThreshold ? (
              <span className="text-green-600">✓ Safe</span>
            ) : value <= pollutantInfo.moderateThreshold ? (
              <span className="text-yellow-600">⚠ Moderate</span>
            ) : (
              <span className="text-red-600">⚠ High</span>
            )}
          </div>
        )}
      </div>

      {/* Tooltip on hover - using title attribute for now */}
      <div 
        className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600 hidden group-hover:block"
        title={`${pollutantInfo.description}. Safe level: ≤${pollutantInfo.safeThreshold} ${unit}`}
      >
        <p className="text-xs text-gray-600 leading-relaxed">
          {pollutantInfo.description}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Safe: ≤{pollutantInfo.safeThreshold} {unit}
        </p>
      </div>
    </div>
  );
};

export default PollutantCard;
