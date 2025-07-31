/**
 * Enhanced AQI Forecast Chart Component
 * Interactive charts showing ML-predicted AQI trends with confidence intervals
 */

import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { getAQICategory, getAQICategoryColor } from '../utils/getAQICategoryColor';
import { calculateConfidenceIntervals } from '../utils/formatForecastData';

/**
 * Custom Tooltip Component with Enhanced Information
 */
const EnhancedTooltip = ({ active, payload, label, pollutant }) => {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload;
  const aqi = pollutant === 'aqi' ? data.aqi : data[pollutant];
  const category = getAQICategory(aqi);
  const colors = getAQICategoryColor(aqi);

  return (
    <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg max-w-xs">
      <p className="font-semibold text-gray-900 mb-2">{data.dateTime}</p>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            {pollutant === 'aqi' ? 'AQI:' : `${pollutant.toUpperCase()}:`}
          </span>
          <span 
            className="px-2 py-1 rounded text-xs font-medium text-white"
            style={{ backgroundColor: colors.hex }}
          >
            {pollutant === 'aqi' 
              ? `${aqi} - ${category.label}` 
              : `${aqi} μg/m³`
            }
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Confidence:</span>
          <span className="text-sm font-medium text-blue-600">
            {data.confidencePercent}%
          </span>
        </div>
        
        {data.marginOfError && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Range:</span>
            <span className="text-sm text-gray-700">
              ±{data.marginOfError}
            </span>
          </div>
        )}
        
        {data.trend && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Trend:</span>
            <span className={`text-sm font-medium ${
              data.trend === 'up' ? 'text-red-600' : 
              data.trend === 'down' ? 'text-green-600' : 'text-gray-600'
            }`}>
              {data.trend === 'up' ? '↗️ Rising' : 
               data.trend === 'down' ? '↘️ Falling' : '→ Stable'}
            </span>
          </div>
        )}
        
        {pollutant === 'aqi' && (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500">{category.label}</p>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Chart Type Selector Component
 */
const ChartTypeSelector = ({ chartType, onTypeChange }) => {
  const types = [
    { id: 'line', label: 'Line', icon: '📈' },
    { id: 'area', label: 'Area', icon: '📊' },
    { id: 'confidence', label: 'Confidence', icon: '🎯' }
  ];

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-600 mr-2">Chart:</span>
      {types.map(type => (
        <button
          key={type.id}
          onClick={() => onTypeChange(type.id)}
          className={`px-3 py-1 text-xs rounded-md transition-colors ${
            chartType === type.id
              ? 'bg-blue-100 text-blue-800 border border-blue-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {type.icon} {type.label}
        </button>
      ))}
    </div>
  );
};

/**
 * AQI Reference Lines Component
 */
const AQIReferenceLines = ({ showReferenceLines }) => {
  if (!showReferenceLines) return null;

  const referenceValues = [
    { value: 50, label: 'Good', color: '#22c55e' },
    { value: 100, label: 'Moderate', color: '#eab308' },
    { value: 150, label: 'Unhealthy*', color: '#f97316' },
    { value: 200, label: 'Unhealthy', color: '#ef4444' }
  ];

  return (
    <>
      {referenceValues.map(ref => (
        <ReferenceLine
          key={ref.value}
          y={ref.value}
          stroke={ref.color}
          strokeDasharray="3 3"
          strokeOpacity={0.5}
        />
      ))}
    </>
  );
};

/**
 * Main AQI Forecast Chart Component
 */
const AQIForecastChart = ({ 
  data = [], 
  pollutant = 'aqi',
  height = 400,
  showConfidence = true,
  showReferenceLines = true,
  interactive = true,
  loading = false,
  error = null
}) => {
  const [chartType, setChartType] = useState('line');
  const [showGrid, setShowGrid] = useState(true);

  // Process data with confidence intervals
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    if (showConfidence && chartType === 'confidence') {
      return calculateConfidenceIntervals(data, 0.8);
    }
    
    return data;
  }, [data, showConfidence, chartType]);

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-lg border border-red-200 p-6">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Forecast Unavailable</h3>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!processedData || processedData.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center">
          <div className="text-gray-400 text-4xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Forecast Data</h3>
          <p className="text-gray-500 text-sm">Unable to load forecast predictions.</p>
        </div>
      </div>
    );
  }

  // Render chart based on type
  const renderChart = () => {
    const commonProps = {
      data: processedData,
      margin: { top: 20, right: 30, left: 20, bottom: 5 }
    };

    const xAxisProps = {
      dataKey: "time",
      tick: { fontSize: 12 },
      axisLine: { stroke: '#e5e7eb' }
    };

    const yAxisProps = {
      tick: { fontSize: 12 },
      axisLine: { stroke: '#e5e7eb' },
      domain: pollutant === 'aqi' ? [0, 300] : ['dataMin', 'dataMax']
    };

    switch (chartType) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip content={<EnhancedTooltip pollutant={pollutant} />} />
            <Area
              type="monotone"
              dataKey={pollutant === 'aqi' ? 'aqi' : pollutant}
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.3}
              strokeWidth={2}
            />
            {pollutant === 'aqi' && showReferenceLines && <AQIReferenceLines showReferenceLines={true} />}
          </AreaChart>
        );

      case 'confidence':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip content={<EnhancedTooltip pollutant={pollutant} />} />
            
            {/* Confidence interval area */}
            <Area
              type="monotone"
              dataKey="confidenceUpper"
              stroke="none"
              fill="#3b82f6"
              fillOpacity={0.1}
            />
            <Area
              type="monotone"
              dataKey="confidenceLower"
              stroke="none"
              fill="#ffffff"
              fillOpacity={1}
            />
            
            {/* Main prediction line */}
            <Line
              type="monotone"
              dataKey={pollutant === 'aqi' ? 'aqi' : pollutant}
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
            {pollutant === 'aqi' && showReferenceLines && <AQIReferenceLines showReferenceLines={true} />}
          </AreaChart>
        );

      default: // line
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip content={<EnhancedTooltip pollutant={pollutant} />} />
            <Line
              type="monotone"
              dataKey={pollutant === 'aqi' ? 'aqi' : pollutant}
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5 }}
            />
            {pollutant === 'aqi' && showReferenceLines && <AQIReferenceLines showReferenceLines={true} />}
          </LineChart>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Chart Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {pollutant === 'aqi' ? 'AQI Forecast' : `${pollutant.toUpperCase()} Forecast`}
          </h3>
          <p className="text-sm text-gray-600">
            ML-predicted air quality trends • {processedData.length} data points
          </p>
        </div>
        
        {interactive && (
          <div className="flex items-center space-x-4">
            <ChartTypeSelector chartType={chartType} onTypeChange={setChartType} />
            
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`px-2 py-1 text-xs rounded ${
                showGrid ? 'bg-gray-200 text-gray-700' : 'bg-gray-100 text-gray-500'
              }`}
            >
              Grid
            </button>
          </div>
        )}
      </div>

      {/* Chart */}
      <div style={{ height: `${height}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>

      {/* Chart Footer */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-4 text-xs text-gray-500">
          <span>Time: {processedData[0]?.time} - {processedData[processedData.length - 1]?.time}</span>
          {processedData[0]?.confidence && (
            <span>Avg Confidence: {Math.round(processedData.reduce((sum, item) => sum + (item.confidence || 0), 0) / processedData.length * 100)}%</span>
          )}
        </div>
        
        {pollutant === 'aqi' && (
          <div className="flex items-center space-x-2 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Good</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span>Moderate</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span>Unhealthy*</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>Unhealthy</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AQIForecastChart;
