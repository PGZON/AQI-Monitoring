/**
 * Custom Hook for Analytics Data Management
 * Handles fetching and caching of user analytics data
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import analyticsService from '../services/analyticsService';

/**
 * Hook for managing analytics data
 */
export const useAnalyticsData = (latitude, longitude, autoRefresh = true) => {
  const [historicalData, setHistoricalData] = useState(null);
  const [weeklyComparison, setWeeklyComparison] = useState(null);
  const [locationHistory, setLocationHistory] = useState([]);
  const [personalInsights, setPersonalInsights] = useState(null);
  
  const [loading, setLoading] = useState({
    historical: false,
    weekly: false,
    locations: false,
    insights: false
  });
  
  const [error, setError] = useState({
    historical: null,
    weekly: null,
    locations: null,
    insights: null
  });

  const [lastUpdated, setLastUpdated] = useState(null);
  const [dataSources, setDataSources] = useState({
    historical: 'mock',
    weekly: 'mock', 
    locations: 'mock',
    insights: 'mock'
  });

  /**
   * Fetch historical AQI data
   */
  const fetchHistoricalData = useCallback(async (days = 7) => {
    if (!latitude || !longitude) return;

    setLoading(prev => ({ ...prev, historical: true }));
    setError(prev => ({ ...prev, historical: null }));

    try {
      const result = await analyticsService.getHistoricalAQI(latitude, longitude, days);
      
      if (result.success) {
        setHistoricalData(result.data);
        setDataSources(prev => ({ ...prev, historical: result.source || 'api' }));
        setLastUpdated(new Date());
      } else {
        setError(prev => ({ ...prev, historical: result.error || 'Failed to fetch historical data' }));
        setDataSources(prev => ({ ...prev, historical: result.source || 'mock' }));
        // Still set mock data for development
        setHistoricalData(result.data);
      }
    } catch (err) {
      setError(prev => ({ ...prev, historical: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, historical: false }));
    }
  }, [latitude, longitude]);

  /**
   * Fetch weekly comparison data
   */
  const fetchWeeklyComparison = useCallback(async () => {
    if (!latitude || !longitude) return;

    setLoading(prev => ({ ...prev, weekly: true }));
    setError(prev => ({ ...prev, weekly: null }));

    try {
      const location = { latitude, longitude };
      const result = await analyticsService.getWeeklyComparison(location);
      
      if (result.success) {
        setWeeklyComparison(result.data);
        setDataSources(prev => ({ ...prev, weekly: result.source || 'api' }));
      } else {
        setError(prev => ({ ...prev, weekly: result.error || 'Failed to fetch weekly comparison' }));
        setDataSources(prev => ({ ...prev, weekly: result.source || 'mock' }));
        // Still set mock data for development
        setWeeklyComparison(result.data);
      }
    } catch (err) {
      setError(prev => ({ ...prev, weekly: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, weekly: false }));
    }
  }, [latitude, longitude]);

  /**
   * Fetch location history
   */
  const fetchLocationHistory = useCallback(async () => {
    setLoading(prev => ({ ...prev, locations: true }));
    setError(prev => ({ ...prev, locations: null }));

    try {
      const location = latitude && longitude ? { latitude, longitude } : null;
      const result = await analyticsService.getLocationHistory(location);
      
      if (result.success) {
        setLocationHistory(result.data);
      } else {
        setError(prev => ({ ...prev, locations: result.error || 'Failed to fetch location history' }));
        // Still set mock data for development
        setLocationHistory(result.data);
      }
    } catch (err) {
      setError(prev => ({ ...prev, locations: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, locations: false }));
    }
  }, [latitude, longitude]);

  /**
   * Fetch personal insights
   */
  const fetchPersonalInsights = useCallback(async () => {
    if (!latitude || !longitude) return;

    setLoading(prev => ({ ...prev, insights: true }));
    setError(prev => ({ ...prev, insights: null }));

    try {
      const result = await analyticsService.getPersonalInsights(latitude, longitude);
      
      if (result.success) {
        setPersonalInsights(result.data);
        setDataSources(prev => ({ ...prev, insights: result.source || 'api' }));
      } else {
        setError(prev => ({ ...prev, insights: result.error || 'Failed to fetch personal insights' }));
        // Still set mock data for development
        setPersonalInsights(result.data);
        setDataSources(prev => ({ ...prev, insights: result.source || 'mock' }));
      }
    } catch (err) {
      setError(prev => ({ ...prev, insights: err.message }));
      setDataSources(prev => ({ ...prev, insights: 'mock' }));
    } finally {
      setLoading(prev => ({ ...prev, insights: false }));
    }
  }, [latitude, longitude]);

  /**
   * Fetch all analytics data
   */
  const fetchAllData = useCallback(async (historicalDays = 7) => {
    await Promise.all([
      fetchHistoricalData(historicalDays),
      fetchWeeklyComparison(),
      fetchLocationHistory(),
      fetchPersonalInsights()
    ]);
  }, [fetchHistoricalData, fetchWeeklyComparison, fetchLocationHistory, fetchPersonalInsights]);

  /**
   * Refresh all data
   */
  const refreshData = useCallback(async (historicalDays = 7) => {
    // Clear cache for fresh data
    analyticsService.clearCache();
    await fetchAllData(historicalDays);
  }, [fetchAllData]);

  /**
   * Update historical data for different time ranges
   */
  const updateHistoricalRange = useCallback(async (days) => {
    await fetchHistoricalData(days);
  }, [fetchHistoricalData]);

  // Initial data fetch
  useEffect(() => {
    if (latitude && longitude) {
      fetchAllData();
    } else {
      // Still fetch location history even if no coordinates
      fetchLocationHistory();
    }
  }, [latitude, longitude, fetchAllData, fetchLocationHistory]);

  // Auto-refresh data
  useEffect(() => {
    if (!autoRefresh || !latitude || !longitude) return;

    const refreshInterval = setInterval(() => {
      fetchAllData();
    }, 15 * 60 * 1000); // Refresh every 15 minutes

    return () => clearInterval(refreshInterval);
  }, [autoRefresh, latitude, longitude, fetchAllData]);

  // Computed values
  const isLoading = Object.values(loading).some(Boolean);
  const hasErrors = Object.values(error).some(Boolean);
  const hasData = historicalData || weeklyComparison || locationHistory.length > 0 || personalInsights;

  // Summary statistics
  const summary = useMemo(() => {
    // Determine overall data source
    const apiSources = Object.values(dataSources).filter(source => source === 'api').length;
    const totalSources = Object.values(dataSources).length;
    const overallDataSource = apiSources === totalSources ? 'api' : 
                             apiSources > 0 ? 'mixed' : 'mock';

    return {
      totalLocationsTracked: locationHistory.length || 0,
      favoriteLocations: locationHistory.filter(loc => loc.isFavorite).length || 0,
      averageAQI: historicalData?.summary?.averageAQI || personalInsights?.stats?.avgAQIThisWeek || 0,
      daysTracked: Math.max(
        historicalData?.summary?.totalPoints || 0,
        personalInsights?.stats?.daysTracked || 0,
        7 // default fallback
      ),
      lastUpdated,
      dataSource: overallDataSource
    };
  }, [historicalData, locationHistory, personalInsights, lastUpdated, dataSources]);

  return {
    // Data
    historicalData,
    weeklyComparison,
    locationHistory,
    personalInsights,
    summary,
    
    // States
    loading,
    error,
    isLoading,
    hasErrors,
    hasData,
    lastUpdated,
    dataSource: summary.dataSource || 'mock',
    
    // Actions
    fetchHistoricalData,
    fetchWeeklyComparison,
    fetchLocationHistory,
    fetchPersonalInsights,
    fetchAllData,
    refreshData,
    updateHistoricalRange,
    
    // Utilities
    clearCache: analyticsService.clearCache.bind(analyticsService)
  };
};

/**
 * Hook specifically for location analytics
 */
export const useLocationAnalytics = (locationId) => {
  const [locationData, setLocationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLocationData = useCallback(async () => {
    if (!locationId) return;

    setLoading(true);
    setError(null);

    try {
      // In a real app, this would fetch location-specific analytics
      // For now, we'll generate mock data
      const mockData = {
        id: locationId,
        name: `Location ${locationId}`,
        totalViews: Math.round(5 + Math.random() * 20),
        firstVisited: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        lastVisited: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        averageAQI: Math.round(40 + Math.random() * 80),
        bestAQI: Math.round(20 + Math.random() * 40),
        worstAQI: Math.round(80 + Math.random() * 120)
      };

      setLocationData(mockData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [locationId]);

  useEffect(() => {
    fetchLocationData();
  }, [fetchLocationData]);

  return {
    locationData,
    loading,
    error,
    refetch: fetchLocationData
  };
};

export default useAnalyticsData;
