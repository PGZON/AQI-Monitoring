/**
 * ML Forecast Chart Component
 * Displays AQI predictions and trends using Recharts
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import forecastService from '../services/forecastService';
import { getAQICategory } from '../utils/aqiUtils';
import LoadingSpinner from './LoadingSpinner';

/**
 * Custom Tooltip Component
 */
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const category = getAQICategory(data.aqi);
    
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900 mb-2">{label}</p>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">AQI:</span>
            <span 
              className="px-2 py-1 rounded text-xs font-medium text-white ml-2"
              style={{ backgroundColor: category.color }}
            >
              {data.aqi} - {category.level}
            </span>
          </div>
          {data.pm2_5 && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">PM2.5:</span>
              <span className="text-sm font-medium">{data.pm2_5} μg/m³</span>
            </div>
          )}
          {data.pm10 && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">PM10:</span>
              <span className="text-sm font-medium">{data.pm10} μg/m³</span>
            </div>
          )}
          {data.o3 && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">O₃:</span>
              <span className="text-sm font-medium">{data.o3} μg/m³</span>
            </div>
          )}
          {data.no2 && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">NO₂:</span>
              <span className="text-sm font-medium">{data.no2} μg/m³</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

/**
 * Chart Controls Component
 */
const ChartControls = ({ 
  chartType, 
  onChartTypeChange, 
  timeRange, 
  onTimeRangeChange,
  isLoading,
  onRefresh 
}) => {
  const chartTypes = [
    { value: 'line', label: 'Line Chart', icon: '📈' },
    { value: 'area', label: 'Area Chart', icon: '📊' },
    { value: 'bar', label: 'Bar Chart', icon: '📊' }
  ];

  const timeRanges = [
    { value: 12, label: '12 Hours' },
    { value: 24, label: '24 Hours' },
    { value: 48, label: '48 Hours' },
    { value: 72, label: '3 Days' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Chart Type:
            </label>
            <select
              value={chartType}
              onChange={(e) => onChartTypeChange(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {chartTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Time Range:
            </label>
            <select
              value={timeRange}
              onChange={(e) => onTimeRangeChange(Number(e.target.value))}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {timeRanges.map(range => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg 
            className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
            />
          </svg>
          <span>Refresh</span>
        </button>
      </div>
    </div>
  );
};

/**
 * ML Forecast Insights Panel
 */
const ForecastInsights = ({ forecastData, location }) => {
  const insights = useMemo(() => {
    if (!forecastData.length) return null;

    const currentAQI = forecastData[0]?.aqi || 0;
    const futureAQI = forecastData[forecastData.length - 1]?.aqi || 0;
    const maxAQI = Math.max(...forecastData.map(d => d.aqi));
    const minAQI = Math.min(...forecastData.map(d => d.aqi));
    const avgAQI = forecastData.reduce((sum, d) => sum + d.aqi, 0) / forecastData.length;

    const trend = futureAQI > currentAQI ? 'increasing' : futureAQI < currentAQI ? 'decreasing' : 'stable';
    const trendColor = trend === 'increasing' ? 'text-red-600' : trend === 'decreasing' ? 'text-green-600' : 'text-gray-600';
    const trendIcon = trend === 'increasing' ? '↗️' : trend === 'decreasing' ? '↘️' : '→';

    return {
      trend: { direction: trend, color: trendColor, icon: trendIcon },
      stats: {
        current: Math.round(currentAQI),
        future: Math.round(futureAQI),
        max: Math.round(maxAQI),
        min: Math.round(minAQI),
        avg: Math.round(avgAQI)
      }
    };
  }, [forecastData]);

  if (!insights) return null;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">🔮 ML Forecast Insights</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <div className="text-lg font-bold text-blue-600">{insights.stats.current}</div>
          <div className="text-xs text-gray-600">Current AQI</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-purple-600">{insights.stats.avg}</div>
          <div className="text-xs text-gray-600">Average</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-red-600">{insights.stats.max}</div>
          <div className="text-xs text-gray-600">Peak</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-green-600">{insights.stats.min}</div>
          <div className="text-xs text-gray-600">Lowest</div>
        </div>
      </div>

      <div className="flex items-center justify-center space-x-2">
        <span className="text-sm text-gray-600">Trend:</span>
        <span className={`text-sm font-medium ${insights.trend.color}`}>
          {insights.trend.icon} {insights.trend.direction.charAt(0).toUpperCase() + insights.trend.direction.slice(1)}
        </span>
      </div>

      {location && (
        <div className="mt-2 text-center">
          <span className="text-xs text-gray-500">
            📍 {location.name || 'Selected Location'}
          </span>
        </div>
      )}
    </div>
  );
};

/**
 * Main Forecast Chart Component
 */
const ForecastChart = ({ 
  location = null, 
  className = '',
  height = 400 
}) => {
  const [forecastData, setForecastData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartType, setChartType] = useState('line');
  const [timeRange, setTimeRange] = useState(24);

  /**
   * Fetch forecast data
   */
  const fetchForecastData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const lat = location?.coordinates?.lat || 40.7128;
      const lng = location?.coordinates?.lng || -74.0060;

      const data = await forecastService.getForecastData(lat, lng, timeRange);
      setForecastData(data);
    } catch (err) {
      console.error('Error fetching forecast data:', err);
      setError('Failed to load forecast data');
    } finally {
      setIsLoading(false);
    }
  }, [location, timeRange]);

  // Fetch data on component mount and when dependencies change
  useEffect(() => {
    fetchForecastData();
  }, [fetchForecastData]);

  /**
   * Render chart based on selected type
   */
  const renderChart = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" text="Loading forecast data..." />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="text-red-500 mb-2">⚠️</div>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchForecastData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    if (!forecastData.length) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-sm text-gray-500">No forecast data available</p>
        </div>
      );
    }

    const commonProps = {
      data: forecastData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    switch (chartType) {
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart {...commonProps}>
              <defs>
                <linearGradient id="aqiGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="time" 
                stroke="#64748b"
                fontSize={12}
                tick={{ fill: '#64748b' }}
              />
              <YAxis 
                stroke="#64748b"
                fontSize={12}
                tick={{ fill: '#64748b' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {/* AQI Threshold Lines */}
              <ReferenceLine y={50} stroke="#10b981" strokeDasharray="5 5" label="Good" />
              <ReferenceLine y={100} stroke="#f59e0b" strokeDasharray="5 5" label="Moderate" />
              <ReferenceLine y={150} stroke="#f97316" strokeDasharray="5 5" label="Unhealthy for Sensitive" />
              
              <Area
                type="monotone"
                dataKey="aqi"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#aqiGradient)"
                name="AQI Forecast"
              />
            </AreaChart>
          </ResponsiveContainer>
        );
        
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="time" 
                stroke="#64748b"
                fontSize={12}
                tick={{ fill: '#64748b' }}
              />
              <YAxis 
                stroke="#64748b"
                fontSize={12}
                tick={{ fill: '#64748b' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              <ReferenceLine y={50} stroke="#10b981" strokeDasharray="5 5" label="Good" />
              <ReferenceLine y={100} stroke="#f59e0b" strokeDasharray="5 5" label="Moderate" />
              <ReferenceLine y={150} stroke="#f97316" strokeDasharray="5 5" label="Unhealthy for Sensitive" />
              
              <Bar
                dataKey="aqi"
                fill="#3b82f6"
                name="AQI Forecast"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        );
        
      default: // line chart
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="time" 
                stroke="#64748b"
                fontSize={12}
                tick={{ fill: '#64748b' }}
              />
              <YAxis 
                stroke="#64748b"
                fontSize={12}
                tick={{ fill: '#64748b' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {/* AQI Threshold Lines */}
              <ReferenceLine y={50} stroke="#10b981" strokeDasharray="5 5" label="Good" />
              <ReferenceLine y={100} stroke="#f59e0b" strokeDasharray="5 5" label="Moderate" />
              <ReferenceLine y={150} stroke="#f97316" strokeDasharray="5 5" label="Unhealthy for Sensitive" />
              
              <Line
                type="monotone"
                dataKey="aqi"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ r: 4, fill: '#3b82f6' }}
                activeDot={{ r: 6, fill: '#1d4ed8' }}
                name="AQI Forecast"
              />
              
              {/* Additional pollutant lines */}
              <Line
                type="monotone"
                dataKey="pm2_5"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
                strokeDasharray="3 3"
                name="PM2.5"
              />
              
              <Line
                type="monotone"
                dataKey="o3"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                strokeDasharray="3 3"
                name="Ozone"
              />
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-4 ${className}`}>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          🤖 ML-Powered Air Quality Forecast
        </h2>
        <p className="text-sm text-gray-600">
          AI predictions based on weather patterns, historical data, and real-time conditions
        </p>
      </div>

      <ForecastInsights forecastData={forecastData} location={location} />
      
      <ChartControls
        chartType={chartType}
        onChartTypeChange={setChartType}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        isLoading={isLoading}
        onRefresh={fetchForecastData}
      />

      <div className="bg-gray-50 rounded-lg p-2">
        {renderChart()}
      </div>

      {forecastData.length > 0 && (
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            🔬 Predictions powered by machine learning • Updated every 30 minutes
          </p>
        </div>
      )}
    </div>
  );
};

export default ForecastChart;
