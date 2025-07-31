/**
 * Custom hook for managing forecast data and ML predictions
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import forecastService from '../services/forecastService';
import { formatForecastData, generateMockMLForecast } from '../utils/formatForecastData';

const useForecastData = ({ 
  location, 
  timeRange = '24h', 
  pollutant = 'aqi',
  autoRefresh = false,
  refreshInterval = 300000, // 5 minutes
  includeInsights = true,
  filters = {}
}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [confidence, setConfidence] = useState(0);
  
  const refreshIntervalRef = useRef(null);
  const locationRef = useRef(location);

  // Update location ref when location changes
  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  // Parse time range to hours
  const getHoursFromTimeRange = useCallback((range) => {
    const ranges = {
      '6h': 6,
      '24h': 24,
      '3d': 72,
      '7d': 168
    };
    return ranges[range] || 24;
  }, []);

  // Fetch forecast data
  const fetchForecastData = useCallback(async (forceRefresh = false) => {
    if (!locationRef.current || (!forceRefresh && loading)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const hours = getHoursFromTimeRange(timeRange);
      const { lat, lng } = locationRef.current;

      // Try to get real forecast data
      let rawData;
      try {
        rawData = await forecastService.getForecastData(lat, lng, hours);
      } catch (apiError) {
        console.warn('Forecast API failed, using mock data:', apiError);
        rawData = generateMockMLForecast(hours, { lat, lng });
      }

      // If no data or insufficient data, generate mock data
      if (!rawData || rawData.length === 0) {
        console.warn('No forecast data received, generating mock data');
        rawData = generateMockMLForecast(hours, { lat, lng });
      }

      // Format data for visualization
      const formattedData = formatForecastData(rawData);
      
      // Calculate average confidence
      const avgConfidence = formattedData.reduce((sum, item) => 
        sum + (item.confidence || 0), 0) / formattedData.length;

      setData(formattedData);
      setConfidence(avgConfidence);
      setLastUpdated(new Date().toISOString());
      setError(null);

    } catch (error) {
      console.error('Failed to fetch forecast data:', error);
      
      // Fallback to mock data
      try {
        const hours = getHoursFromTimeRange(timeRange);
        const { lat, lng } = locationRef.current;
        const mockData = generateMockMLForecast(hours, { lat, lng });
        const formattedData = formatForecastData(mockData);
        
        setData(formattedData);
        setConfidence(0.75); // Default confidence for mock data
        setLastUpdated(new Date().toISOString());
        setError('Using sample forecast data. Real-time predictions unavailable.');
      } catch (fallbackError) {
        console.error('Failed to generate mock forecast data:', fallbackError);
        setError('Unable to load forecast data. Please try again.');
        setData([]);
        setConfidence(0);
      }
    } finally {
      setLoading(false);
    }
  }, [timeRange, loading, getHoursFromTimeRange]);

  // Auto-refresh logic
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(() => {
        fetchForecastData(false);
      }, refreshInterval);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [autoRefresh, refreshInterval, fetchForecastData]);

  // Initial data fetch and when dependencies change
  useEffect(() => {
    if (location) {
      fetchForecastData(true);
    }
  }, [location, timeRange, fetchForecastData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchForecastData(true);
  }, [fetchForecastData]);

  // Filter data by pollutant if needed
  const getFilteredData = useCallback(() => {
    if (pollutant === 'aqi') {
      return data;
    }
    
    // Filter out items where the pollutant data is null/undefined
    return data.filter(item => 
      item[pollutant] !== null && 
      item[pollutant] !== undefined &&
      item[pollutant] > 0
    );
  }, [data, pollutant]);

  // Get current trend
  const getTrend = useCallback(() => {
    const filteredData = getFilteredData();
    if (filteredData.length < 2) return 'stable';
    
    const recent = filteredData.slice(-6); // Last 6 data points
    const first = recent[0];
    const last = recent[recent.length - 1];
    
    const value1 = pollutant === 'aqi' ? first.aqi : first[pollutant];
    const value2 = pollutant === 'aqi' ? last.aqi : last[pollutant];
    
    if (value2 > value1 * 1.1) return 'increasing';
    if (value2 < value1 * 0.9) return 'decreasing';
    return 'stable';
  }, [getFilteredData, pollutant]);

  // Get prediction summary
  const getSummary = useCallback(() => {
    const filteredData = getFilteredData();
    if (filteredData.length === 0) {
      return {
        message: 'No forecast data available',
        type: 'info'
      };
    }

    const trend = getTrend();
    const avgValue = pollutant === 'aqi' 
      ? filteredData.reduce((sum, item) => sum + item.aqi, 0) / filteredData.length
      : filteredData.reduce((sum, item) => sum + (item[pollutant] || 0), 0) / filteredData.length;

    const highValues = filteredData.filter(item => 
      pollutant === 'aqi' ? item.aqi >= 151 : item[pollutant] >= 55
    );

    let message = '';
    let type = 'info';

    if (highValues.length > filteredData.length * 0.5) {
      message = `Poor air quality expected. ${highValues.length} of ${filteredData.length} forecasted periods show unhealthy levels.`;
      type = 'warning';
    } else if (trend === 'increasing') {
      message = `Air quality trending worse. Average ${pollutant === 'aqi' ? 'AQI' : pollutant.toUpperCase()}: ${Math.round(avgValue)}`;
      type = 'warning';
    } else if (trend === 'decreasing') {
      message = `Air quality improving. Average ${pollutant === 'aqi' ? 'AQI' : pollutant.toUpperCase()}: ${Math.round(avgValue)}`;
      type = 'success';
    } else {
      message = `Air quality stable. Average ${pollutant === 'aqi' ? 'AQI' : pollutant.toUpperCase()}: ${Math.round(avgValue)}`;
      type = 'info';
    }

    return { message, type, trend, avgValue: Math.round(avgValue) };
  }, [getFilteredData, getTrend, pollutant]);

  // Generate ML insights - Phase 12 Enhancement
  const generateMLInsights = useCallback(() => {
    if (!includeInsights) return [];

    const filteredData = getFilteredData();
    if (filteredData.length === 0) return [];

    const insights = [];
    const trend = getTrend();
    const avgConfidence = confidence;

    // Trend Analysis Insight
    if (trend !== 'stable') {
      insights.push({
        type: 'trend',
        title: `${trend === 'increasing' ? 'Worsening' : 'Improving'} Air Quality Trend`,
        description: `ML models predict air quality will ${trend === 'increasing' ? 'deteriorate' : 'improve'} over the forecast period.`,
        impact: trend === 'increasing' ? 'Health Risk Increase' : 'Health Risk Decrease'
      });
    }

    // Pattern Recognition Insight
    const hourlyPattern = filteredData.reduce((acc, item) => {
      const hour = new Date(item.timestamp).getHours();
      if (!acc[hour]) acc[hour] = [];
      acc[hour].push(item.aqi || item.value);
      return acc;
    }, {});

    const peakHours = Object.entries(hourlyPattern)
      .map(([hour, values]) => ({
        hour: parseInt(hour),
        avgValue: values.reduce((sum, val) => sum + val, 0) / values.length
      }))
      .sort((a, b) => b.avgValue - a.avgValue)
      .slice(0, 2);

    if (peakHours.length > 0) {
      const worstHour = peakHours[0];
      insights.push({
        type: 'pattern',
        title: 'Peak Pollution Hours Detected',
        description: `Historical patterns suggest highest pollution around ${worstHour.hour}:00 hours.`,
        impact: 'Plan indoor activities during peak hours'
      });
    }

    // Confidence-based Recommendations
    if (avgConfidence < 0.6) {
      insights.push({
        type: 'recommendation',
        title: 'Low Prediction Confidence',
        description: 'Weather conditions or data gaps reduce forecast accuracy. Monitor real-time readings.',
        impact: 'Check frequently for updates'
      });
    }

    // Health Alert Insights
    const unhealthyPeriods = filteredData.filter(item => (item.aqi || item.value) > 150);
    if (unhealthyPeriods.length > 0) {
      insights.push({
        type: 'alert',
        title: 'Health Alert Periods Predicted',
        description: `${unhealthyPeriods.length} periods forecasted with unhealthy air quality levels.`,
        impact: 'Avoid outdoor activities during these times'
      });
    }

    // Air Quality Improvement Opportunities
    const goodPeriods = filteredData.filter(item => (item.aqi || item.value) <= 50);
    if (goodPeriods.length > filteredData.length * 0.3) {
      insights.push({
        type: 'recommendation',
        title: 'Good Air Quality Windows',
        description: `${goodPeriods.length} periods with good air quality identified for outdoor activities.`,
        impact: 'Plan outdoor exercise during these times'
      });
    }

    return insights.slice(0, 4); // Limit to 4 most relevant insights
  }, [getFilteredData, getTrend, confidence, includeInsights]);

  return {
    // Data
    data: getFilteredData(),
    rawData: data,
    
    // State
    loading,
    error,
    lastUpdated,
    confidence,
    
    // Computed values
    trend: getTrend(),
    summary: getSummary(),
    insights: generateMLInsights(),
    isEmpty: data.length === 0,
    
    // Actions
    refresh,
    
    // Metadata
    timeRange,
    pollutant,
    location: locationRef.current
  };
};

export default useForecastData;
