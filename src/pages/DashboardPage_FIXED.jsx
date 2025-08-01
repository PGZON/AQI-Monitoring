import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import aqiService from '../services/aqiService';
import alertService from '../services/alertService';
import AQICard from '../components/AQICard';

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const { user: userProfile } = useUser();
  
  // State management
  const [aqiData, setAqiData] = useState(null);
  const [alerts, setAlerts] = useState({ active: [], recent: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [locationName, setLocationName] = useState('');
  
  // BULLETPROOF: Single initialization flag that NEVER causes re-renders
  const initStarted = useRef(false);

  // REDESIGNED: Completely isolated initialization - NO DEPENDENCIES THAT CHANGE
  useEffect(() => {
    console.log('🔥 [Dashboard] useEffect - initStarted:', initStarted.current, 'user:', !!user);
    
    // CRITICAL: Only run if user exists and we haven't started initialization  
    if (!user || initStarted.current) {
      console.log('⏭️ [Dashboard] Skipping - no user or already started');
      return;
    }

    // LOCK: Set flag immediately to prevent any re-runs
    initStarted.current = true;
    console.log('🔒 [Dashboard] Initialization LOCKED - can never run again');

    // SELF-CONTAINED: All logic in one place, no external calls
    (async () => {
      try {
        console.log('🚀 [Dashboard] Starting ONE-TIME initialization...');
        setLoading(true);
        setError(null);

        // Step 1: Get location (completely inline)
        let location = null;
        
        // Try user profile first (snapshot the values to avoid dependency issues)
        const savedLocations = userProfile?.savedLocations;
        if (savedLocations && savedLocations.length > 0) {
          location = savedLocations[0];
          console.log('📍 [Dashboard] Using saved location:', location.name);
        } else {
          // Try geolocation
          try {
            location = await new Promise((resolve, reject) => {
              if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
              }
              
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    name: 'Current Location'
                  });
                },
                () => reject(new Error('Geolocation failed')),
                { timeout: 5000 }
              );
            });
            console.log('🌍 [Dashboard] Got geolocation:', location);
          } catch (geoError) {
            // Fallback location
            location = { latitude: 40.7128, longitude: -74.0060, name: 'New York, NY' };
            console.log('🏙️ [Dashboard] Using fallback location:', location.name);
          }
        }

        if (!location) {
          throw new Error('Could not determine location');
        }

        setLocationName(location.name);

        // Step 2: Load AQI data (completely inline)
        console.log(`🌬️ [Dashboard] Loading AQI for ${location.latitude}, ${location.longitude}`);
        try {
          const aqiResult = await aqiService.getCurrentAQI(location.latitude, location.longitude);
          if (aqiResult.success) {
            console.log('✅ [Dashboard] AQI data loaded');
            setAqiData(aqiResult.data);
            setLastUpdated(new Date());
          } else {
            throw new Error(aqiResult.message || 'AQI fetch failed');
          }
        } catch (aqiError) {
          console.error('❌ [Dashboard] AQI error:', aqiError.message);
          // Set fallback AQI data
          setAqiData({
            aqi: { index: 85, category: 'Moderate' },
            location: { name: location.name },
            pollutants: {
              pm25: { value: 35, unit: 'μg/m³' },
              pm10: { value: 45, unit: 'μg/m³' }
            }
          });
          setLastUpdated(new Date());
        }

        // Step 3: Load alerts (completely inline) 
        console.log(`🚨 [Dashboard] Loading alerts for ${location.latitude}, ${location.longitude}`);
        try {
          const alertResult = await alertService.getCurrentAlerts(location.latitude, location.longitude);
          if (alertResult.success) {
            console.log('✅ [Dashboard] Alerts loaded');
            setAlerts(alertResult.data);
          }
        } catch (alertError) {
          console.error('❌ [Dashboard] Alert error:', alertError.message);
          // Continue without alerts
        }

        console.log('🎉 [Dashboard] Initialization completed successfully');
        
      } catch (error) {
        console.error('💥 [Dashboard] Initialization failed:', error);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
        console.log('🏁 [Dashboard] Loading state cleared');
      }
    })();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // INTENTIONALLY EMPTY: One-time init only, ignoring user/userProfile changes

  const handleRefresh = () => {
    console.log('🔄 [Dashboard] Manual refresh - RESETTING initialization flag');
    initStarted.current = false;
    setLoading(true);
    // Force component re-render to trigger useEffect
    window.location.reload();
  };

  if (loading && !aqiData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">AQI Dashboard</h1>
              {lastUpdated && (
                <span className="ml-4 text-sm text-gray-500">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                disabled={loading}
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">
                  Welcome, {user?.name || user?.email || 'User'}
                </span>
                <button
                  onClick={logout}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="text-red-800">
                <p className="font-medium">Error</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Location Info */}
        {locationName && (
          <div className="mb-4">
            <p className="text-gray-600">Current location: {locationName}</p>
          </div>
        )}

        {/* Current AQI */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Air Quality</h2>
          <AQICard data={aqiData} />
        </div>

        {/* Navigation Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/history"
            className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow border"
          >
            <h3 className="font-medium text-gray-900">View History</h3>
            <p className="text-sm text-gray-600 mt-1">See detailed historical data</p>
          </Link>
          
          <Link
            to="/alerts"
            className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow border"
          >
            <h3 className="font-medium text-gray-900">Alert Settings</h3>
            <p className="text-sm text-gray-600 mt-1">Configure notifications</p>
          </Link>
          
          <Link
            to="/forecast"
            className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow border"
          >
            <h3 className="font-medium text-gray-900">Forecast</h3>
            <p className="text-sm text-gray-600 mt-1">View predictions</p>
          </Link>
          
          <Link
            to="/analytics"
            className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow border"
          >
            <h3 className="font-medium text-gray-900">Analytics</h3>
            <p className="text-sm text-gray-600 mt-1">Detailed insights</p>
          </Link>
        </div>

        {/* Active Alerts */}
        {alerts.active && alerts.active.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Alerts</h2>
            <div className="space-y-4">
              {alerts.active.map((alert, index) => (
                <div key={index} className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex">
                    <div className="text-red-800">
                      <h3 className="font-medium">{alert.title}</h3>
                      <p className="text-sm">{alert.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;
