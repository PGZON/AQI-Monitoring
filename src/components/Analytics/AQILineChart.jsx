/**
 * AQI Line Chart Component for Analytics
 * Displays historical AQI trends with pollutant toggles
 */

import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend
} from 'recharts';
import { getAQICategory, getAQICategoryColor } from '../../utils/getAQICategoryColor';

/**
 * Custom Tooltip Component
 */
const AnalyticsTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload;
  
  return (
    <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
      <p className="font-semibold text-gray-900 mb-2">{data.date}</p>
      <p className="text-sm text-gray-600 mb-3">{data.time}</p>
      
      <div className="space-y-2">
        {payload.map((entry, index) => {
          const value = entry.value;
          const pollutant = entry.dataKey;
          const category = pollutant === 'aqi' ? getAQICategory(value) : null;
          const colors = pollutant === 'aqi' ? getAQICategoryColor(value) : null;
          
          return (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-gray-600 capitalize">
                {pollutant === 'aqi' ? 'AQI' : pollutant.toUpperCase()}:
              </span>
              <div className="flex items-center space-x-2">
                <span 
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    colors ? 'text-white' : 'bg-gray-100 text-gray-800'
                  }`}
                  style={colors ? { backgroundColor: colors.hex } : {}}
                >
                  {pollutant === 'co' ? `${value} ppm` : 
                   pollutant === 'aqi' ? `${value} - ${category?.label}` : 
                   `${value} μg/m³`}
                </span>
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
      
      {data.temperature && (
        <div className="pt-3 mt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Temperature: {data.temperature}°C</span>
            <span>Humidity: {data.humidity}%</span>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Pollutant Toggle Component
 */
const PollutantToggles = ({ pollutants, activePollutants, onToggle }) => {
  const pollutantInfo = {
    aqi: { label: 'AQI', color: '#3b82f6', description: 'Air Quality Index' },
    pm25: { label: 'PM2.5', color: '#ef4444', description: 'Fine Particulate Matter' },
    pm10: { label: 'PM10', color: '#f97316', description: 'Coarse Particulate Matter' },
    no2: { label: 'NO₂', color: '#8b5cf6', description: 'Nitrogen Dioxide' },
    o3: { label: 'O₃', color: '#06b6d4', description: 'Ozone' },
    co: { label: 'CO', color: '#10b981', description: 'Carbon Monoxide' },
    so2: { label: 'SO₂', color: '#f59e0b', description: 'Sulfur Dioxide' }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h4 className="text-sm font-semibold text-gray-900 mb-3">Pollutants</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
        {pollutants.map(pollutant => {
          const info = pollutantInfo[pollutant];
          const isActive = activePollutants.includes(pollutant);
          
          return (
            <button
              key={pollutant}
              onClick={() => onToggle(pollutant)}
              className={`p-2 rounded-lg border-2 transition-all text-sm font-medium ${
                isActive
                  ? 'border-gray-400 bg-white shadow-sm'
                  : 'border-gray-200 bg-gray-100 hover:bg-gray-200'
              }`}
              title={info?.description}
            >
              <div className="flex items-center space-x-2">
                <div 
                  className={`w-3 h-3 rounded-full ${isActive ? '' : 'opacity-50'}`}
                  style={{ backgroundColor: info?.color }}
                />
                <span className={isActive ? 'text-gray-900' : 'text-gray-500'}>
                  {info?.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Date Range Selector Component
 */
const DateRangeSelector = ({ selectedRange, onRangeChange }) => {
  const ranges = [
    { id: '7d', label: '7 Days', description: 'Past week' },
    { id: '30d', label: '30 Days', description: 'Past month' },
    { id: '90d', label: '90 Days', description: 'Past 3 months' }
  ];

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-600 mr-2">Range:</span>
      {ranges.map(range => (
        <button
          key={range.id}
          onClick={() => onRangeChange(range.id)}
          className={`px-3 py-1 text-sm rounded-md transition-colors ${
            selectedRange === range.id
              ? 'bg-blue-100 text-blue-800 border border-blue-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          title={range.description}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
};

/**
 * Main AQI Line Chart Component
 */
const AQILineChart = ({ 
  data = [], 
  height = 400,
  showPollutants = true,
  showDateRange = true,
  loading = false,
  error = null 
}) => {
  const [activePollutants, setActivePollutants] = useState(['aqi', 'pm25']);
  const [dateRange, setDateRange] = useState('7d');
  const [showGrid, setShowGrid] = useState(true);

  // Available pollutants from data
  const availablePollutants = useMemo(() => {
    if (!data || data.length === 0) return ['aqi'];
    
    const firstItem = data[0];
    return Object.keys(firstItem).filter(key => 
      ['aqi', 'pm25', 'pm10', 'no2', 'o3', 'co', 'so2'].includes(key) &&
      typeof firstItem[key] === 'number'
    );
  }, [data]);

  // Filter data by date range
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const now = new Date();
    const daysBack = parseInt(dateRange.replace('d', ''));
    const cutoffDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
    
    return data.filter(item => {
      const itemDate = new Date(item.datetime || item.date);
      return itemDate >= cutoffDate;
    });
  }, [data, dateRange]);

  // Handle pollutant toggle
  const handlePollutantToggle = (pollutant) => {
    setActivePollutants(prev => {
      if (prev.includes(pollutant)) {
        // Don't allow removing all pollutants
        if (prev.length === 1) return prev;
        return prev.filter(p => p !== pollutant);
      } else {
        return [...prev, pollutant];
      }
    });
  };

  // Pollutant colors
  const pollutantColors = {
    aqi: '#3b82f6',
    pm25: '#ef4444',
    pm10: '#f97316',
    no2: '#8b5cf6',
    o3: '#06b6d4',
    co: '#10b981',
    so2: '#f59e0b'
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className={`h-${height/16} bg-gray-200 rounded`}></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-lg border border-red-200 p-6">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Data Unavailable</h3>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!filteredData || filteredData.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center">
          <div className="text-gray-400 text-4xl mb-4">📈</div>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Historical Data</h3>
          <p className="text-gray-500 text-sm">No data available for the selected time range.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Chart Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Historical AQI Trends</h3>
          <p className="text-sm text-gray-600">
            {filteredData.length} data points • Last {dateRange.replace('d', ' days')}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {showDateRange && (
            <DateRangeSelector 
              selectedRange={dateRange} 
              onRangeChange={setDateRange} 
            />
          )}
          
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`px-2 py-1 text-xs rounded ${
              showGrid ? 'bg-gray-200 text-gray-700' : 'bg-gray-100 text-gray-500'
            }`}
          >
            Grid
          </button>
        </div>
      </div>

      {/* Pollutant Toggles */}
      {showPollutants && (
        <div className="mb-6">
          <PollutantToggles 
            pollutants={availablePollutants}
            activePollutants={activePollutants}
            onToggle={handlePollutantToggle}
          />
        </div>
      )}

      {/* Chart */}
      <div style={{ height: `${height}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={filteredData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />}
            
            <XAxis 
              dataKey="date"
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            
            <Tooltip content={<AnalyticsTooltip />} />
            <Legend />
            
            {/* AQI Reference Lines */}
            {activePollutants.includes('aqi') && (
              <>
                <ReferenceLine y={50} stroke="#22c55e" strokeDasharray="3 3" strokeOpacity={0.5} />
                <ReferenceLine y={100} stroke="#eab308" strokeDasharray="3 3" strokeOpacity={0.5} />
                <ReferenceLine y={150} stroke="#f97316" strokeDasharray="3 3" strokeOpacity={0.5} />
                <ReferenceLine y={200} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.5} />
              </>
            )}
            
            {/* Pollutant Lines */}
            {activePollutants.map(pollutant => (
              <Line
                key={pollutant}
                type="monotone"
                dataKey={pollutant}
                stroke={pollutantColors[pollutant]}
                strokeWidth={2}
                dot={{ fill: pollutantColors[pollutant], strokeWidth: 1, r: 3 }}
                activeDot={{ r: 5 }}
                name={pollutant === 'aqi' ? 'AQI' : pollutant.toUpperCase()}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Footer */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          <span>
            Data range: {filteredData[0]?.date} - {filteredData[filteredData.length - 1]?.date}
          </span>
        </div>
        
        <div className="flex items-center space-x-4 text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Good (0-50)</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>Moderate (51-100)</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-orange-500 rounded"></div>
            <span>Unhealthy* (101-150)</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Unhealthy (151+)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AQILineChart;
