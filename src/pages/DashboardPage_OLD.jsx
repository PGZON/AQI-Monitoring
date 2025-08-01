import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAlerts } from '../context/AlertContext';
import { useAlerts as useAlertsHook } from '../hooks/useAlerts';
import { aqiAPI } from '../utils/api';
import { generateMockAQIData } from '../utils/aqiUtils';
import { useGeolocation, DEFAULT_COORDINATES, POPULAR_CITIES } from '../hooks/useGeolocation';
import AQIStatusCard from '../components/AQIStatusCard';
import PollutantCard from '../components/PollutantCard';
import RefreshButton from '../components/RefreshButton';
import AQIWarningBanner from '../components/AQIWarningBanner';
import AlertBanner from '../components/Alerts/AlertBanner';
import NotificationDropdown from '../components/Alerts/NotificationDropdown';
import { MiniPWAStatus } from '../components/PWAStatus';

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const { updateCoordinates, alertsEnabled } = useAlerts();
  const { location: userLocation, error: locationError, loading: locationLoading, getCurrentLocation } = useGeolocation();
  
  // State management
  const [aqiData, setAqiData] = useState(null);
  const [previousAQI, setPreviousAQI] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [selectedCoordinates, setSelectedCoordinates] = useState(null);
  const [showLocationSelector, setShowLocationSelector] = useState(false);

  // Initialize alerts hook with AQI data
  const {
    currentAlerts,
    dismissAlert,
    markAlertsAsRead
  } = useAlertsHook(aqiData);

  // Determine which coordinates to use
  const currentCoordinates = selectedCoordinates || userLocation || DEFAULT_COORDINATES;

  // Manual refresh handler - Create inline to avoid stale closures
  const handleRefresh = useCallback(() => {
    if (!currentCoordinates) return;
    
    const refreshData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await aqiAPI.fetchAQI(
          currentCoordinates.latitude || currentCoordinates.lat, 
          currentCoordinates.longitude || currentCoordinates.lon,
          true
        );
        
        if (response.success && response.data) {
          setAqiData(prevData => {
            if (prevData?.aqi?.index) {
              setPreviousAQI(prevData.aqi.index);
            }
            return response.data;
          });
          setLastUpdated(new Date().toISOString());
        } else {
          // Fallback to mock data
          const mockData = generateMockAQIData(currentCoordinates);
          setAqiData(mockData);
          setLastUpdated(new Date().toISOString());
        }
      } catch (error) {
        console.error('Manual refresh failed, using mock data:', error);
        const mockData = generateMockAQIData(currentCoordinates);
        setAqiData(mockData);
        setLastUpdated(new Date().toISOString());
        setError('Unable to fetch real-time data. Showing sample data.');
      } finally {
        setIsLoading(false);
      }
    };
    
    refreshData();
  }, [currentCoordinates]); // Include currentCoordinates dependency

  // Auto-refresh setup - Use ref to avoid dependencies
  useEffect(() => {
    if (!autoRefreshEnabled || !currentCoordinates) return;

    const interval = setInterval(() => {
      // Create a fresh function call to avoid stale closures
      const refreshData = async () => {
        try {
          const response = await aqiAPI.fetchAQI(
            currentCoordinates.latitude || currentCoordinates.lat, 
            currentCoordinates.longitude || currentCoordinates.lon,
            true
          );
          
          if (response.success && response.data) {
            setAqiData(prevData => {
              if (prevData?.aqi?.index) {
                setPreviousAQI(prevData.aqi.index);
              }
              return response.data;
            });
            setLastUpdated(new Date().toISOString());
          }
        } catch (error) {
          console.warn('Auto-refresh failed:', error);
        }
      };
      
      refreshData();
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, currentCoordinates]);

  // Initial data fetch - Use separate effect to avoid dependency loop
  useEffect(() => {
    if (currentCoordinates) {
      const initialFetch = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
          const response = await aqiAPI.fetchAQI(
            currentCoordinates.latitude || currentCoordinates.lat, 
            currentCoordinates.longitude || currentCoordinates.lon,
            true
          );
          
          if (response.success && response.data) {
            setAqiData(response.data);
            setLastUpdated(new Date().toISOString());
          } else {
            // Fallback to mock data
            const mockData = generateMockAQIData(currentCoordinates);
            setAqiData(mockData);
            setLastUpdated(new Date().toISOString());
          }
        } catch (error) {
          console.error('Initial fetch failed, using mock data:', error);
          const mockData = generateMockAQIData(currentCoordinates);
          setAqiData(mockData);
          setLastUpdated(new Date().toISOString());
          setError('Unable to fetch real-time data. Showing sample data.');
        } finally {
          setIsLoading(false);
        }
      };
      
      initialFetch();
    }
  }, [currentCoordinates]); // Include currentCoordinates dependency

  // Update alert system with current coordinates
  useEffect(() => {
    if (currentCoordinates) {
      updateCoordinates(currentCoordinates);
    }
  }, [currentCoordinates, updateCoordinates]);

  // Toggle auto-refresh
  const toggleAutoRefresh = () => {
    setAutoRefreshEnabled(prev => !prev);
  };

  // Handle location selection
  const handleLocationSelect = (coords) => {
    setSelectedCoordinates(coords);
    setShowLocationSelector(false);
  };

  // Handle logout
  const handleLogout = () => {
    logout();
  };

  // Pollutants to display
  const pollutantKeys = ['pm2_5', 'pm10', 'co', 'no2', 'o3', 'so2', 'nh3'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* AQI Warning Banner */}
      {alertsEnabled && (
        <AQIWarningBanner 
          aqiData={aqiData}
          threshold={151}
          showHealthAdvice={true}
          compact={false}
        />
      )}
      
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                🌬️ Real-Time AQI Monitor
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Navigation Links */}
              <Link
                to="/forecast"
                className="text-sm text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors flex items-center space-x-1"
              >
                <span>🔮</span>
                <span>ML Forecast</span>
              </Link>
              
              <Link
                to="/analytics"
                className="text-sm text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors flex items-center space-x-1"
              >
                <span>📊</span>
                <span>Analytics</span>
              </Link>
              
              <Link
                to="/alerts"
                className="text-sm text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors flex items-center space-x-1"
              >
                <span>🔔</span>
                <span>Alert Settings</span>
              </Link>
              
              <Link
                to="/profile"
                className="text-sm text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors flex items-center space-x-1"
              >
                <span>👤</span>
                <span>Profile</span>
              </Link>
              
              {/* Notification Dropdown */}
              <NotificationDropdown
                alerts={currentAlerts}
                onMarkAsRead={markAlertsAsRead}
                onDismiss={dismissAlert}
              />
              
              {/* PWA Status */}
              <MiniPWAStatus />
              
              {/* Location selector button */}
              <button
                onClick={() => setShowLocationSelector(!showLocationSelector)}
                className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
              >
                📍 Change Location
              </button>
              
              <div className="text-sm text-gray-700">
                Welcome, <span className="font-medium">{user?.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Location Selector Dropdown */}
      {showLocationSelector && (
        <div className="relative z-40">
          <div className="absolute top-0 left-0 right-0 bg-white shadow-lg border-b max-w-7xl mx-auto">
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Select Location</h3>
                <button
                  onClick={() => setShowLocationSelector(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              {/* Use current location button */}
              <div className="mb-4">
                <button
                  onClick={() => {
                    getCurrentLocation();
                    setSelectedCoordinates(null);
                    setShowLocationSelector(false);
                  }}
                  disabled={locationLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {locationLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Getting location...
                    </>
                  ) : (
                    <>
                      📍 Use My Current Location
                    </>
                  )}
                </button>
                {locationError && (
                  <p className="text-sm text-red-600 mt-2">
                    {locationError.message}
                  </p>
                )}
              </div>
              
              {/* Popular cities */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Popular Cities</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                  {POPULAR_CITIES.map((city) => (
                    <button
                      key={city.name}
                      onClick={() => handleLocationSelect({
                        latitude: city.lat,
                        longitude: city.lon,
                        name: city.name
                      })}
                      className="text-left p-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      {city.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          {/* Alert Banner */}
          {currentAlerts.active && currentAlerts.active.length > 0 && (
            <AlertBanner
              alerts={currentAlerts.active}
              onDismiss={dismissAlert}
              mode="inline"
              className="mb-6"
            />
          )}

          {/* Refresh Controls */}
          <RefreshButton
            onRefresh={handleRefresh}
            isLoading={isLoading}
            lastUpdated={lastUpdated}
            autoRefreshEnabled={autoRefreshEnabled}
            onToggleAutoRefresh={toggleAutoRefresh}
          />

          {/* AQI Status Card */}
          <AQIStatusCard
            aqiData={aqiData}
            isLoading={isLoading}
            previousAQI={previousAQI}
            onRefresh={handleRefresh}
            lastUpdated={lastUpdated}
          />

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="text-red-500">⚠️</span>
                <p className="text-red-700 font-medium">Error</p>
              </div>
              <p className="text-red-600 mt-1">{error}</p>
              <button
                onClick={handleRefresh}
                className="mt-2 text-red-600 hover:text-red-800 underline text-sm"
              >
                Try again
              </button>
            </div>
          )}

          {/* Pollutant Cards Grid */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Pollutant Breakdown</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {pollutantKeys.map((pollutantKey) => (
                <PollutantCard
                  key={pollutantKey}
                  pollutantKey={pollutantKey}
                  data={aqiData?.pollutants?.[pollutantKey]}
                  isLoading={isLoading}
                />
              ))}
            </div>
          </div>

          {/* Additional Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Weather Info */}
            {aqiData?.weather && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  🌤️ Weather Conditions
                </h3>
                <div className="space-y-3">
                  {aqiData.weather.temperature && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Temperature</span>
                      <span className="font-medium">{Math.round(aqiData.weather.temperature)}°C</span>
                    </div>
                  )}
                  {aqiData.weather.humidity && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Humidity</span>
                      <span className="font-medium">{Math.round(aqiData.weather.humidity)}%</span>
                    </div>
                  )}
                  {aqiData.weather.pressure && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pressure</span>
                      <span className="font-medium">{Math.round(aqiData.weather.pressure)} hPa</span>
                    </div>
                  )}
                  {aqiData.weather.windSpeed && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Wind Speed</span>
                      <span className="font-medium">{Math.round(aqiData.weather.windSpeed)} m/s</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Data Source Info */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                📊 Data Information
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Source</span>
                  <span className="font-medium capitalize">
                    {aqiData?.source || 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Data Time</span>
                  <span className="font-medium text-sm">
                    {aqiData?.dataTimestamp ? 
                      new Date(aqiData.dataTimestamp).toLocaleString() : 
                      'Unknown'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Coordinates</span>
                  <span className="font-medium text-sm">
                    {currentCoordinates?.latitude?.toFixed(4)}, {currentCoordinates?.longitude?.toFixed(4)}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                ⚡ Quick Actions
              </h3>
              <div className="space-y-3">
                <button
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  <div className="flex items-center justify-between">
                    <span>🔄 Refresh Data</span>
                    {isLoading && (
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    )}
                  </div>
                </button>
                
                <button
                  onClick={() => setShowLocationSelector(true)}
                  className="w-full text-left p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                >
                  📍 Change Location
                </button>
                
                <button
                  onClick={toggleAutoRefresh}
                  className="w-full text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span>{autoRefreshEnabled ? '⏸️ Pause' : '▶️ Enable'} Auto-refresh</span>
                    <div className={`w-3 h-3 rounded-full ${
                      autoRefreshEnabled ? 'bg-green-500' : 'bg-gray-400'
                    }`}></div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
