/**
 * Analytics Page - User Analytics & Weekly AQI Trends
 * Main analytics dashboard with historical data, weekly comparisons, and personal insights
 */

import React, { memo, useState } from 'react';
import { useAnalyticsData } from '../hooks/useAnalyticsData';
import AQILineChart from '../components/Analytics/AQILineChart';
import WeeklyComparisonCard from '../components/Analytics/WeeklyComparisonCard';
import LocationHistoryList from '../components/Analytics/LocationHistoryList';
import PersonalInsightsBanner from '../components/Analytics/PersonalInsightsBanner';

/**
 * Analytics Header Component - Memoized for performance
 */
const AnalyticsHeader = memo(({ 
  onLocationChange, 
  selectedLocation,
  presetLocations,
  latitude,
  longitude, 
  onRefresh, 
  isRefreshing,
  lastUpdated 
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div className="mb-4 lg:mb-0">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">
            Track your air quality journey with personalized insights and trends
          </p>
          {lastUpdated && (
            <p className="text-sm text-gray-500 mt-1">
              Last updated: {lastUpdated.toLocaleString()}
            </p>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
            <div className="flex items-center space-x-2">
              <span className="text-blue-600">📍</span>
              <div>
                <div className="text-sm font-medium text-blue-800">
                  {selectedLocation?.name || 'Current Location'}
                </div>
                <div className="text-xs text-blue-600">
                  {latitude?.toFixed(4)}, {longitude?.toFixed(4)}
                </div>
              </div>
            </div>
          </div>
          
          <select 
            value={`${selectedLocation?.latitude},${selectedLocation?.longitude}`}
            onChange={(e) => {
              const [lat, lng] = e.target.value.split(',');
              const location = presetLocations.find(loc => 
                loc.latitude === parseFloat(lat) && loc.longitude === parseFloat(lng)
              );
              if (location) onLocationChange(location);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {presetLocations.map(location => (
              <option key={`${location.latitude},${location.longitude}`} value={`${location.latitude},${location.longitude}`}>
                {location.name}
              </option>
            ))}
          </select>
          
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isRefreshing
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isRefreshing ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Refreshing...</span>
              </div>
            ) : (
              '🔄 Refresh Data'
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

/**
 * Quick Stats Component - Memoized for performance
 */
const QuickStats = memo(({ summary, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-12 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const stats = [
    {
      value: summary.daysTracked || 0,
      label: 'Days Tracked',
      icon: '📅',
      color: 'text-blue-600'
    },
    {
      value: summary.totalLocationsTracked || 0,
      label: 'Locations Visited',
      icon: '🗺️',
      color: 'text-green-600'
    },
    {
      value: summary.favoriteLocations || 0,
      label: 'Favorite Locations',
      icon: '⭐',
      color: 'text-yellow-600'
    },
    {
      value: summary.averageAQI || '--',
      label: 'Average AQI',
      icon: '📊',
      color: 'text-purple-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{stat.icon}</div>
            <div>
              <div className={`text-2xl font-bold ${stat.color}`}>
                {stat.value}
              </div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

/**
 * Main Analytics Page Component
 */
const AnalyticsPage = () => {
  // Preset locations for testing
  const presetLocations = [
    { name: 'New York City', latitude: 40.7128, longitude: -74.0060 },
    { name: 'Kolhapur, India', latitude: 16.7050, longitude: 74.2433 },
    { name: 'Mumbai, India', latitude: 19.0760, longitude: 72.8777 },
    { name: 'Delhi, India', latitude: 28.6139, longitude: 77.2090 }
  ];

  // Local state for selected location
  const [selectedLocation, setSelectedLocation] = useState(presetLocations[1]); // Default to Kolhapur
  
  // Get coordinates from selected location
  const latitude = selectedLocation?.latitude || 40.7128;
  const longitude = selectedLocation?.longitude || -74.0060;

  // Analytics data hook
  const {
    historicalData,
    weeklyComparison,
    locationHistory,
    personalInsights,
    summary,
    loading,
    error,
    isLoading,
    lastUpdated,
    refreshData
  } = useAnalyticsData(latitude, longitude);

  // Handle location selection from history
  const handleLocationSelect = (location) => {
    setSelectedLocation({
      name: location.name,
      latitude: location.latitude,
      longitude: location.longitude
    });
  };

  // Handle data refresh
  const handleRefresh = async () => {
    await refreshData(7); // Default to 7 days
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <AnalyticsHeader
          selectedLocation={selectedLocation}
          presetLocations={presetLocations}
          latitude={latitude}
          longitude={longitude}
          onLocationChange={setSelectedLocation}
          onRefresh={handleRefresh}
          isRefreshing={isLoading}
          lastUpdated={lastUpdated}
        />

        {/* Data Source Warning - Disabled */}
        {/* <DataSourceIndicator 
          hasErrors={hasErrors}
          dataSource={dataSource}
        /> */}

        {/* Quick Stats */}
        <QuickStats summary={summary} loading={loading.insights} />

        {/* Personal Insights Banner */}
        <div className="mb-6">
          <PersonalInsightsBanner
            insights={personalInsights}
            loading={loading.insights}
            error={error.insights}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Historical Chart - Takes up 2 columns */}
          <div className="xl:col-span-2">
            <div>
              <AQILineChart
                data={historicalData?.historical || []}
                height={400}
                loading={loading.historical}
                error={error.historical}
                showDateRange={true}
                showPollutants={true}
              />
            </div>
          </div>

          {/* Weekly Comparison - Takes up 1 column */}
          <div>
            <WeeklyComparisonCard
              data={weeklyComparison}
              loading={loading.weekly}
              error={error.weekly}
            />
          </div>
        </div>

        {/* Location History */}
        <div className="mt-6">
          <LocationHistoryList
            locations={locationHistory}
            onLocationSelect={handleLocationSelect}
            loading={loading.locations}
            error={error.locations}
          />
        </div>

        {/* Footer Information */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>
            Analytics data updates every 15 minutes • Historical data available for up to 90 days
          </p>
          <p className="mt-1">
            Location history and personal insights are stored locally for privacy
          </p>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
