/**
 * Enhanced Forecast Page Component
 * Interactive page combining pollution heatmap and advanced ML forecast visualization
 */

import React, { useState, useCallback, memo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Heatmap from '../components/Heatmap';
import ForecastDashboard from '../components/ForecastDashboard';
import useGeolocation from '../hooks/useGeolocation';
import { useDebounce } from '../hooks/useDebounce';

/**
 * Location Selector Component - Memoized for performance
 */
const LocationSelector = memo(({ 
  selectedLocation, 
  onLocationChange, 
  userLocation, 
  onUseCurrentLocation 
}) => {
  const [cityInput, setCityInput] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState('');
  
  // ✅ BULLETPROOF: Debounce city input to prevent API spam
  const debouncedCityInput = useDebounce(cityInput, 800); // Wait 800ms after user stops typing

  /**
   * ✅ FIXED: Validate city with debounced input - no more API spam!
   */
  useEffect(() => {
    const validateDebouncedCity = async () => {
      if (!debouncedCityInput.trim()) {
        setValidationError('');
        onLocationChange(null);
        return;
      }

      console.log(`🔍 [ForecastPage] Validating city: "${debouncedCityInput}"`);
      setIsValidating(true);
      setValidationError('');

      try {
        // Use a geocoding service to validate city
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(debouncedCityInput)}&limit=1`
        );
        
        if (response.ok) {
          const data = await response.json();
          
          if (data && data.length > 0) {
            const location = data[0];
            const cityInfo = {
              id: `custom-${Date.now()}`,
              name: location.display_name.split(',')[0], // Get city name
              coordinates: {
                lat: parseFloat(location.lat),
                lng: parseFloat(location.lon)
              },
              fullName: location.display_name
            };
            
            console.log('✅ [ForecastPage] City found:', cityInfo.name);
            onLocationChange(cityInfo);
            setValidationError('');
          } else {
            setValidationError('City not found. Please try a different city name.');
            onLocationChange(null);
          }
        } else {
          setValidationError('Unable to validate city. Please try again.');
          onLocationChange(null);
        }
      } catch (error) {
        console.error('❌ [ForecastPage] City validation error:', error);
        setValidationError('Error validating city. Please try again.');
        onLocationChange(null);
      } finally {
        setIsValidating(false);
      }
    };

    validateDebouncedCity();
  }, [debouncedCityInput, onLocationChange]); // Only runs when debounced input changes

  /**
   * ✅ FIXED: Handle city input change - no validation here, debouncing handles it
   */
  const handleCityInputChange = useCallback((e) => {
    const value = e.target.value;
    setCityInput(value);
    // ✅ No validateCity() call - debouncing handles validation automatically
  }, []);

  /**
   * ✅ FIXED: Handle form submission
   */
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    // ✅ No validateCity() call - debouncing already validated the input
    console.log('🚀 [ForecastPage] Form submitted with city:', cityInput);
  }, [cityInput]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">📍 Select Location for Forecast</h3>
      
      <div className="flex flex-wrap items-center gap-4">
        {/* Current Location Button */}
        {userLocation && (
          <button
            onClick={onUseCurrentLocation}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" 
              />
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" 
              />
            </svg>
            <span className="text-sm">Use My Location</span>
          </button>
        )}

        {/* City Input Field */}
        <form onSubmit={handleSubmit} className="flex-1 max-w-md">
          <div className="relative">
            <input
              type="text"
              value={cityInput}
              onChange={handleCityInputChange}
              placeholder="Enter city name (e.g., London, Tokyo, Mumbai)..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
              disabled={isValidating}
            />
            {isValidating && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
          {validationError && (
            <p className="text-red-500 text-xs mt-1">{validationError}</p>
          )}
        </form>

        {/* Selected Location Display */}
        {selectedLocation && (
          <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg">
            <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
              <path 
                fillRule="evenodd" 
                d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" 
                clipRule="evenodd" 
              />
            </svg>
            <span className="text-sm text-gray-700">{selectedLocation.name}</span>
            <button
              onClick={() => {
                onLocationChange(null);
                setCityInput('');
                setValidationError('');
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

/**
 * Page Header Component
 */
const PageHeader = () => {
  return (
    <div className="mb-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          🌍 Interactive Pollution Forecast
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Explore real-time air quality data across multiple locations and view AI-powered predictions 
          for future pollution levels. Click on any location in the heatmap to see detailed forecasts.
        </p>
      </div>
      
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-2xl mb-2">🗺️</div>
          <h3 className="font-semibold text-blue-900">Interactive Heatmap</h3>
          <p className="text-sm text-blue-700">Real-time AQI data with color-coded markers</p>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="text-2xl mb-2">🤖</div>
          <h3 className="font-semibold text-purple-900">ML Predictions</h3>
          <p className="text-sm text-purple-700">AI-powered forecasts up to 72 hours ahead</p>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-2xl mb-2">📊</div>
          <h3 className="font-semibold text-green-900">Detailed Analytics</h3>
          <p className="text-sm text-green-700">Pollutant trends and health insights</p>
        </div>
      </div>
    </div>
  );
};

/**
 * Instructions Panel Component
 */
const InstructionsPanel = ({ className = '' }) => {
  return (
    <div className={`bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
      <h3 className="text-sm font-semibold text-yellow-900 mb-2">💡 How to Use</h3>
      <ul className="text-sm text-yellow-800 space-y-1">
        <li>• <strong>Click markers</strong> on the heatmap to view detailed pollution data</li>
        <li>• <strong>Use the controls</strong> to filter by pollutant type and visibility</li>
        <li>• <strong>Select a location</strong> above to see detailed ML forecasts</li>
        <li>• <strong>Pan and zoom</strong> the map to explore different regions</li>
        <li>• <strong>Toggle chart types</strong> to view data in different formats</li>
      </ul>
    </div>
  );
};

/**
 * Main Forecast Page Component
 */
const ForecastPage = () => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const { coordinates: userLocation } = useGeolocation();
  const { user, logout } = useAuth();

  /**
   * Handle logout
   */
  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [logout]);

  /**
   * Handle location selection from heatmap
   */
  const handleLocationSelect = useCallback((location) => {
    setSelectedLocation({
      id: location.id,
      name: location.name,
      coordinates: location.coordinates
    });
  }, []);

  /**
   * Handle location change from selector
   */
  const handleLocationChange = useCallback((location) => {
    setSelectedLocation(location);
  }, []);

  /**
   * Use current user location
   */
  const handleUseCurrentLocation = useCallback(() => {
    if (userLocation) {
      setSelectedLocation({
        id: 'current',
        name: 'Your Current Location',
        coordinates: {
          lat: userLocation.latitude,
          lng: userLocation.longitude
        }
      });
    }
  }, [userLocation]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                🔮 ML Air Quality Forecast
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Navigation Links */}
              <Link
                to="/dashboard"
                className="text-sm text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors flex items-center space-x-1"
              >
                <span>🌬️</span>
                <span>Dashboard</span>
              </Link>
              
              <Link
                to="/profile"
                className="text-sm text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors flex items-center space-x-1"
              >
                <span>👤</span>
                <span>Profile</span>
              </Link>
              
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader />
        
        <InstructionsPanel className="mb-6" />
        
        <LocationSelector
          selectedLocation={selectedLocation}
          onLocationChange={handleLocationChange}
          userLocation={userLocation}
          onUseCurrentLocation={handleUseCurrentLocation}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Heatmap Section */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                🗺️ Real-Time Pollution Heatmap
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Interactive map showing current air quality conditions. Click any marker for detailed information.
              </p>
              
              <div className="mb-6">
                <Heatmap
                  center={selectedLocation ? [selectedLocation.coordinates.lat, selectedLocation.coordinates.lng] : undefined}
                  onLocationSelect={handleLocationSelect}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Enhanced Forecast Dashboard Section */}
          <div className="space-y-4">
            <div>
              <ForecastDashboard
                location={selectedLocation}
                height={400}
                initialTimeRange="24h"
                initialPollutant="aqi"
              />
            </div>
            
            {/* Enhanced Features Info Panel */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">🚀 Enhanced Forecast Features</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p>
                  Our advanced ML forecast system provides:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>Multi-pollutant predictions:</strong> Individual forecasts for PM2.5, PM10, CO, NO₂, O₃, and more</li>
                  <li><strong>Confidence intervals:</strong> Prediction accuracy ranges with statistical confidence</li>
                  <li><strong>Interactive time ranges:</strong> 6-hour to 7-day forecast periods</li>
                  <li><strong>Real-time updates:</strong> Auto-refreshing data with 5-minute intervals</li>
                  <li><strong>Visual trend analysis:</strong> Color-coded AQI categories and trend indicators</li>
                </ul>
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-blue-800 font-medium">💡 Pro Tip:</p>
                  <p className="text-blue-700">
                    Switch between pollutant tabs to see detailed predictions for specific air quality components.
                    Use the confidence chart mode to understand prediction reliability.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>
            Data sources: Real-time monitoring stations • Weather services • ML prediction models
          </p>
          <p className="mt-1">
            Last updated: {new Date().toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForecastPage;
