/**
 * Enhanced Forecast Dashboard Component - Phase 12
 * Complete interface for ML-predicted AQI trends with advanced insights and visualization
 */

import React, { useState, useCallback, useMemo } from 'react';
import useForecastData from '../hooks/useForecastData';
import AQIForecastChart from './AQIForecastChart';
import PollutantForecastTabs from './PollutantForecastTabs';
import { getTimeRangeOptions } from '../utils/formatForecastData';
import LoadingSpinner from './LoadingSpinner';

/**
 * Time Range Selector Component
 */
const TimeRangeSelector = ({ selectedRange, onRangeChange, loading }) => {
  const ranges = getTimeRangeOptions();

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-600 mr-2">Period:</span>
      {ranges.map(range => (
        <button
          key={range.id}
          onClick={() => onRangeChange(range.id)}
          disabled={loading}
          className={`px-3 py-1 text-sm rounded-md transition-colors disabled:opacity-50 ${
            selectedRange === range.id
              ? 'bg-blue-100 text-blue-800 border border-blue-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
};

/**
 * Forecast Summary Component
 */
const ForecastSummary = ({ summary, confidence, lastUpdated, location }) => {
  const getSummaryIcon = (type) => {
    switch (type) {
      case 'warning': return '⚠️';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return 'ℹ️';
    }
  };

  const getSummaryColor = (type) => {
    switch (type) {
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'success': return 'bg-green-50 border-green-200 text-green-800';
      case 'error': return 'bg-red-50 border-red-200 text-red-800';
      default: return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Forecast Summary</h3>
          
          <div className={`p-3 rounded-lg border ${getSummaryColor(summary.type)} mb-3`}>
            <div className="flex items-start space-x-2">
              <span className="text-lg">{getSummaryIcon(summary.type)}</span>
              <div>
                <p className="font-medium">{summary.message}</p>
                {summary.trend && (
                  <p className="text-sm mt-1">
                    Trend: <span className="font-medium capitalize">{summary.trend}</span>
                    {summary.avgValue && (
                      <span> • Average: {summary.avgValue}</span>
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-gray-600 mb-1">📍 Location</div>
              <div className="font-medium text-gray-900">
                {location?.name || `${location?.lat?.toFixed(2)}, ${location?.lng?.toFixed(2)}`}
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-gray-600 mb-1">🎯 Confidence</div>
              <div className="font-medium text-gray-900">
                {Math.round(confidence * 100)}%
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-gray-600 mb-1">🕐 Updated</div>
              <div className="font-medium text-gray-900">
                {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * ML Insights Component - Phase 12 Enhancement
 */
const MLInsights = ({ insights, confidence, loading }) => {
  if (!insights || loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">ML Insights</h3>
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="sm" />
          <span className="ml-2 text-gray-600">Analyzing patterns...</span>
        </div>
      </div>
    );
  }

  const getInsightIcon = (type) => {
    switch (type) {
      case 'trend': return '📈';
      case 'pattern': return '🔍';
      case 'alert': return '⚠️';
      case 'recommendation': return '💡';
      default: return '🤖';
    }
  };

  const getConfidenceColor = (conf) => {
    if (conf >= 0.8) return 'text-green-600 bg-green-50 border-green-200';
    if (conf >= 0.6) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">ML Insights</h3>
        <div className={`px-3 py-1 rounded-full text-sm border ${getConfidenceColor(confidence)}`}>
          🎯 {Math.round(confidence * 100)}% Confidence
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((insight, index) => (
          <div key={index} className="bg-gray-50 rounded-lg p-4 border">
            <div className="flex items-start space-x-3">
              <span className="text-2xl">{getInsightIcon(insight.type)}</span>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-1">{insight.title}</h4>
                <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
                {insight.impact && (
                  <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                    Impact: {insight.impact}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {insights.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <span className="text-4xl mb-2 block">🤖</span>
          <p>No significant patterns detected in current forecast period.</p>
        </div>
      )}
    </div>
  );
};

/**
 * Advanced Forecast Controls Component - Phase 12 Enhancement
 */
const AdvancedForecastControls = ({ 
  timeRange, 
  onTimeRangeChange, 
  onRefresh, 
  loading, 
  autoRefresh,
  onAutoRefreshToggle,
  filters,
  onFiltersChange,
  showAdvanced,
  onToggleAdvanced
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <div className="space-y-4">
        {/* Primary Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <TimeRangeSelector 
              selectedRange={timeRange}
              onRangeChange={onTimeRangeChange}
              loading={loading}
            />
            
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => onAutoRefreshToggle(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span>Auto-refresh</span>
              </label>

              <button
                onClick={onToggleAdvanced}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                {showAdvanced ? 'Hide' : 'Show'} Advanced
              </button>
            </div>
          </div>

          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Loading...</span>
              </>
            ) : (
              <>
                <span>🔄</span>
                <span>Refresh</span>
              </>
            )}
          </button>
        </div>

        {/* Advanced Controls */}
        {showAdvanced && (
          <div className="border-t pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Confidence Threshold */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Confidence: {Math.round(filters.confidenceThreshold * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={filters.confidenceThreshold}
                  onChange={(e) => onFiltersChange({
                    ...filters,
                    confidenceThreshold: parseFloat(e.target.value)
                  })}
                  className="w-full"
                />
              </div>

              {/* Alert Level Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alert Level
                </label>
                <select
                  value={filters.alertLevel}
                  onChange={(e) => onFiltersChange({
                    ...filters,
                    alertLevel: e.target.value
                  })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="all">All Levels</option>
                  <option value="good">Good (0-50)</option>
                  <option value="moderate">Moderate (51-100)</option>
                  <option value="unhealthy_sensitive">Unhealthy for Sensitive (101-150)</option>
                  <option value="unhealthy">Unhealthy (151-200)</option>
                  <option value="very_unhealthy">Very Unhealthy (201-300)</option>
                  <option value="hazardous">Hazardous (300+)</option>
                </select>
              </div>

              {/* Trend Direction */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trend Direction
                </label>
                <select
                  value={filters.trendDirection}
                  onChange={(e) => onFiltersChange({
                    ...filters,
                    trendDirection: e.target.value
                  })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="all">All Trends</option>
                  <option value="improving">Improving</option>
                  <option value="stable">Stable</option>
                  <option value="worsening">Worsening</option>
                </select>
              </div>
            </div>

            {/* Quick Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onFiltersChange({
                  confidenceThreshold: 0.8,
                  alertLevel: 'all',
                  trendDirection: 'all'
                })}
                className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-md hover:bg-green-200"
              >
                High Confidence Only
              </button>
              <button
                onClick={() => onFiltersChange({
                  confidenceThreshold: 0.0,
                  alertLevel: 'unhealthy',
                  trendDirection: 'all'
                })}
                className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-md hover:bg-red-200"
              >
                Health Alerts Only
              </button>
              <button
                onClick={() => onFiltersChange({
                  confidenceThreshold: 0.0,
                  alertLevel: 'all',
                  trendDirection: 'worsening'
                })}
                className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200"
              >
                Worsening Trends
              </button>
              <button
                onClick={() => onFiltersChange({
                  confidenceThreshold: 0.0,
                  alertLevel: 'all',
                  trendDirection: 'all'
                })}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Forecast Controls Component (Original - kept for backward compatibility)
 */
const ForecastControls = ({ 
  timeRange, 
  onTimeRangeChange, 
  onRefresh, 
  loading, 
  autoRefresh,
  onAutoRefreshToggle 
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
          <TimeRangeSelector 
            selectedRange={timeRange}
            onRangeChange={onTimeRangeChange}
            loading={loading}
          />
          
          <div className="flex items-center space-x-2">
            <label className="flex items-center space-x-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => onAutoRefreshToggle(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span>Auto-refresh</span>
            </label>
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Loading...</span>
            </>
          ) : (
            <>
              <span>🔄</span>
              <span>Refresh</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

/**
 * Enhanced Main Forecast Dashboard Component - Phase 12
 */
const ForecastDashboard = ({ 
  location, 
  initialTimeRange = '24h',
  initialPollutant = 'aqi',
  height = 400,
  showMLInsights = true,
  showAdvancedControls = true
}) => {
  const [timeRange, setTimeRange] = useState(initialTimeRange);
  const [selectedPollutant, setSelectedPollutant] = useState(initialPollutant);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState({
    confidenceThreshold: 0.0,
    alertLevel: 'all',
    trendDirection: 'all'
  });

  // Use forecast data hook with enhanced options
  const {
    data,
    loading,
    error,
    lastUpdated,
    confidence,
    summary,
    insights,
    refresh
  } = useForecastData({
    location,
    timeRange,
    pollutant: selectedPollutant,
    autoRefresh,
    refreshInterval: 300000, // 5 minutes
    includeInsights: showMLInsights,
    filters
  });

  // Handle time range change
  const handleTimeRangeChange = useCallback((newRange) => {
    setTimeRange(newRange);
  }, []);

  // Handle pollutant change
  const handlePollutantChange = useCallback((pollutant) => {
    setSelectedPollutant(pollutant);
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  // Handle auto-refresh toggle
  const handleAutoRefreshToggle = useCallback((enabled) => {
    setAutoRefresh(enabled);
  }, []);

  // Handle filters change
  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  // Handle advanced controls toggle
  const handleToggleAdvanced = useCallback(() => {
    setShowAdvanced(prev => !prev);
  }, []);

  // Filter data based on current filters
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return data;

    return data.filter(point => {
      // Confidence filter
      if (point.confidence < filters.confidenceThreshold) return false;

      // Alert level filter
      if (filters.alertLevel !== 'all') {
        const aqi = point.aqi || point.value;
        const level = getAQILevel(aqi);
        if (level !== filters.alertLevel) return false;
      }

      // Trend direction filter (simplified - would need trend calculation)
      if (filters.trendDirection !== 'all') {
        // This would require trend analysis - simplified for now
        return true;
      }

      return true;
    });
  }, [data, filters]);

  // Helper function to get AQI level
  const getAQILevel = (aqi) => {
    if (aqi <= 50) return 'good';
    if (aqi <= 100) return 'moderate';
    if (aqi <= 150) return 'unhealthy_sensitive';
    if (aqi <= 200) return 'unhealthy';
    if (aqi <= 300) return 'very_unhealthy';
    return 'hazardous';
  };

  // Loading state for initial load
  if (loading && (!data || data.length === 0)) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <div className="flex items-center justify-center">
            <LoadingSpinner size="lg" />
            <span className="ml-3 text-lg text-gray-600">Loading ML forecast data...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && (!data || data.length === 0)) {
    return (
      <div className="bg-white rounded-lg border border-red-200 p-8">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-red-800 mb-2">ML Forecast Unavailable</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Forecast Controls */}
      {showAdvancedControls ? (
        <AdvancedForecastControls
          timeRange={timeRange}
          onTimeRangeChange={handleTimeRangeChange}
          onRefresh={handleRefresh}
          loading={loading}
          autoRefresh={autoRefresh}
          onAutoRefreshToggle={handleAutoRefreshToggle}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          showAdvanced={showAdvanced}
          onToggleAdvanced={handleToggleAdvanced}
        />
      ) : (
        <ForecastControls
          timeRange={timeRange}
          onTimeRangeChange={handleTimeRangeChange}
          onRefresh={handleRefresh}
          loading={loading}
          autoRefresh={autoRefresh}
          onAutoRefreshToggle={handleAutoRefreshToggle}
        />
      )}

      {/* Forecast Summary */}
      {summary && (
        <ForecastSummary
          summary={summary}
          confidence={confidence}
          lastUpdated={lastUpdated}
          location={location}
        />
      )}

      {/* ML Insights - Phase 12 Enhancement */}
      {showMLInsights && insights && (
        <MLInsights
          insights={insights}
          confidence={confidence}
          loading={loading}
        />
      )}

      {/* Pollutant Tabs */}
      <PollutantForecastTabs
        activePollutant={selectedPollutant}
        onPollutantChange={handlePollutantChange}
        data={filteredData}
        showCounts={true}
      />

      {/* Enhanced Forecast Chart */}
      <AQIForecastChart
        data={filteredData}
        pollutant={selectedPollutant}
        height={height}
        showConfidence={true}
        showReferenceLines={selectedPollutant === 'aqi'}
        interactive={true}
        loading={loading}
        error={error}
        insights={insights}
        showInsights={showMLInsights}
      />

      {/* Enhanced Data Quality Indicator */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <span>📊 {filteredData.length}/{data.length} forecast points</span>
            <span>🎯 {Math.round(confidence * 100)}% avg confidence</span>
            <span>⏱️ {timeRange} forecast period</span>
            {showMLInsights && insights && (
              <span>🤖 {insights.length} ML insights</span>
            )}
            {filters.confidenceThreshold > 0 && (
              <span>🔍 Min {Math.round(filters.confidenceThreshold * 100)}% confidence</span>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Model Performance Indicator */}
            <div className="flex items-center space-x-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${
                confidence >= 0.8 ? 'bg-green-500' : 
                confidence >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>
              <span className="text-gray-600">
                ML Model: {confidence >= 0.8 ? 'High' : confidence >= 0.6 ? 'Medium' : 'Low'} Accuracy
              </span>
            </div>

            {/* Live Status */}
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
              <span>{loading ? 'Updating...' : 'Live'}</span>
            </div>
          </div>
        </div>

        {/* Filter Summary */}
        {(filters.alertLevel !== 'all' || filters.trendDirection !== 'all' || filters.confidenceThreshold > 0) && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="text-gray-500">Active Filters:</span>
                {filters.confidenceThreshold > 0 && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                    Confidence ≥{Math.round(filters.confidenceThreshold * 100)}%
                  </span>
                )}
                {filters.alertLevel !== 'all' && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">
                    {filters.alertLevel.replace('_', ' ')}
                  </span>
                )}
                {filters.trendDirection !== 'all' && (
                  <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded">
                    {filters.trendDirection} trend
                  </span>
                )}
              </div>
              <button
                onClick={() => handleFiltersChange({
                  confidenceThreshold: 0.0,
                  alertLevel: 'all',
                  trendDirection: 'all'
                })}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                Clear All
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForecastDashboard;
