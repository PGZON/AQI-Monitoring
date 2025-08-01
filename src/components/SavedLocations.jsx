/**
 * Saved Locations Component
 * Manages user's favorite locations for quick AQI access
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useUser } from '../context/UserContext';
import { useDebounceCallback } from '../hooks/useDebounce';
import forecastService from '../services/forecastService';
import { getAQICategory } from '../utils/aqiUtils';
import LoadingSpinner from './LoadingSpinner';

/**
 * Add Location Modal Component
 */
const AddLocationModal = ({ isOpen, onClose, onAdd }) => {
  const [locationName, setLocationName] = useState('');
  const [coordinates, setCoordinates] = useState({ lat: '', lng: '' });
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState('');

  // ✅ BULLETPROOF: Debounced search to prevent API spam
  const debouncedSearch = useDebounceCallback(async (searchTerm) => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    
    console.log(`🔍 [SavedLocations] Searching for: "${searchTerm}"`);
    setIsSearching(true);
    setError('');
    
    try {
      // Mock geocoding service (replace with real service like Google Maps or OpenStreetMap)
      const mockResults = [
        { name: `${searchTerm}, NY`, lat: 40.7128, lng: -74.0060 },
        { name: `${searchTerm}, CA`, lat: 34.0522, lng: -118.2437 },
        { name: `${searchTerm}, TX`, lat: 29.7604, lng: -95.3698 }
      ];
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setSearchResults(mockResults);
      console.log('✅ [SavedLocations] Search completed');
    } catch (err) {
      console.error('❌ [SavedLocations] Search error:', err);
      setError('Failed to search locations');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, 1000); // 1 second debounce - waits for user to stop typing

  const handleSearch = useCallback(() => {
    debouncedSearch(locationName);
  }, [locationName, debouncedSearch]);

  const handleAddLocation = useCallback(async (result) => {
    try {
      const locationData = {
        name: result.name,
        coordinates: { lat: result.lat, lng: result.lng },
        isDefault: false
      };
      
      await onAdd(locationData);
      
      // Reset form
      setLocationName('');
      setCoordinates({ lat: '', lng: '' });
      setSearchResults([]);
      onClose();
    } catch (err) {
      setError('Failed to add location');
    }
  }, [onAdd, onClose]);

  const handleManualAdd = useCallback(async () => {
    if (!locationName.trim() || !coordinates.lat || !coordinates.lng) {
      setError('Please fill in all fields');
      return;
    }
    
    try {
      const locationData = {
        name: locationName,
        coordinates: { lat: parseFloat(coordinates.lat), lng: parseFloat(coordinates.lng) },
        isDefault: false
      };
      
      await onAdd(locationData);
      
      // Reset form
      setLocationName('');
      setCoordinates({ lat: '', lng: '' });
      onClose();
    } catch (err) {
      setError('Failed to add location');
    }
  }, [locationName, coordinates, onAdd, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Add New Location</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {/* Search by name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Location
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="Enter city name..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button
                onClick={handleSearch}
                disabled={isSearching || !locationName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSearching ? <LoadingSpinner size="sm" /> : 'Search'}
              </button>
            </div>
          </div>

          {/* Search results */}
          {searchResults.length > 0 && (
            <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
              {searchResults.map((result, index) => (
                <button
                  key={index}
                  onClick={() => handleAddLocation(result)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-medium text-gray-900">{result.name}</div>
                  <div className="text-sm text-gray-500">
                    {result.lat.toFixed(4)}, {result.lng.toFixed(4)}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Manual coordinates */}
          <div className="pt-4 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Or Add by Coordinates
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={coordinates.lat}
                onChange={(e) => setCoordinates(prev => ({ ...prev, lat: e.target.value }))}
                placeholder="Latitude"
                step="0.0001"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="number"
                value={coordinates.lng}
                onChange={(e) => setCoordinates(prev => ({ ...prev, lng: e.target.value }))}
                placeholder="Longitude"
                step="0.0001"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleManualAdd}
              disabled={!locationName.trim() || !coordinates.lat || !coordinates.lng}
              className="w-full mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Location Card Component
 */
const LocationCard = ({ location, onSetDefault, onRemove, isLoading }) => {
  const [aqiData, setAqiData] = useState(null);
  const [loadingAqi, setLoadingAqi] = useState(false);

  // Fetch current AQI for this location
  const fetchLocationAQI = useCallback(async () => {
    setLoadingAqi(true);
    try {
      const data = await forecastService.getHeatmapData({
        north: location.coordinates.lat + 0.01,
        south: location.coordinates.lat - 0.01,
        east: location.coordinates.lng + 0.01,
        west: location.coordinates.lng - 0.01
      }, 1);
      
      if (data.length > 0) {
        setAqiData(data[0]);
      }
    } catch (error) {
      console.warn('Failed to fetch AQI for location:', error);
    } finally {
      setLoadingAqi(false);
    }
  }, [location.coordinates]);

  // Fetch AQI on mount
  React.useEffect(() => {
    fetchLocationAQI();
  }, [fetchLocationAQI]);

  const aqiCategory = useMemo(() => {
    if (!aqiData?.aqi?.index) return null;
    return getAQICategory(aqiData.aqi.index);
  }, [aqiData]);

  return (
    <div className={`bg-white rounded-lg shadow-sm border-2 p-4 transition-all ${
      location.isDefault ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate flex items-center">
            {location.name}
            {location.isDefault && (
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                Default
              </span>
            )}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {location.coordinates.lat.toFixed(4)}, {location.coordinates.lng.toFixed(4)}
          </p>
        </div>
        
        {/* AQI Badge */}
        <div className="flex items-center ml-3">
          {loadingAqi ? (
            <LoadingSpinner size="sm" />
          ) : aqiData && aqiCategory ? (
            <div 
              className="px-2 py-1 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: aqiCategory.color }}
            >
              {aqiData.aqi.index}
            </div>
          ) : (
            <div className="px-2 py-1 bg-gray-200 text-gray-600 rounded-full text-xs">
              --
            </div>
          )}
        </div>
      </div>

      {/* AQI Details */}
      {aqiData && aqiCategory && (
        <div className="mb-3 p-2 bg-gray-50 rounded">
          <div className="text-xs text-gray-600">
            Current AQI: <span className="font-medium">{aqiCategory.level}</span>
          </div>
          {aqiData.pollutants?.pm2_5 && (
            <div className="text-xs text-gray-600">
              PM2.5: {aqiData.pollutants.pm2_5.value} μg/m³
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          Added {new Date(location.addedAt).toLocaleDateString()}
        </div>
        
        <div className="flex items-center space-x-2">
          {!location.isDefault && (
            <button
              onClick={() => onSetDefault(location.id)}
              disabled={isLoading}
              className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
            >
              Set Default
            </button>
          )}
          
          <button
            onClick={() => onRemove(location.id)}
            disabled={isLoading}
            className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Main Saved Locations Component
 */
const SavedLocations = ({ className = '' }) => {
  const { 
    savedLocations, 
    loading, 
    errors, 
    addSavedLocation, 
    removeSavedLocation, 
    setDefaultLocation,
    clearError 
  } = useUser();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const handleAddLocation = useCallback(async (locationData) => {
    try {
      await addSavedLocation(locationData);
    } catch (error) {
      // Error is handled by context
    }
  }, [addSavedLocation]);

  const handleRemoveLocation = useCallback(async (locationId) => {
    try {
      await removeSavedLocation(locationId);
      setConfirmDelete(null);
    } catch (error) {
      // Error is handled by context
    }
  }, [removeSavedLocation]);

  const handleSetDefault = useCallback(async (locationId) => {
    try {
      await setDefaultLocation(locationId);
    } catch (error) {
      // Error is handled by context
    }
  }, [setDefaultLocation]);

  // Clear error when component unmounts
  React.useEffect(() => {
    return () => clearError('locations');
  }, [clearError]);

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Saved Locations</h2>
          <p className="text-sm text-gray-600 mt-1">
            Quick access to your favorite locations with live AQI data
          </p>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Location</span>
        </button>
      </div>

      {/* Error Display */}
      {errors.locations && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{errors.locations}</p>
          <button
            onClick={() => clearError('locations')}
            className="text-xs text-red-500 hover:text-red-700 underline mt-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading.locations && savedLocations.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" text="Loading saved locations..." />
        </div>
      )}

      {/* Empty State */}
      {!loading.locations && savedLocations.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-4xl mb-4">📍</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No saved locations yet</h3>
          <p className="text-gray-600 mb-4">
            Add your favorite locations to quickly check their air quality
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Your First Location
          </button>
        </div>
      )}

      {/* Locations Grid */}
      {savedLocations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedLocations.map((location) => (
            <LocationCard
              key={location.id}
              location={location}
              onSetDefault={handleSetDefault}
              onRemove={(id) => setConfirmDelete(id)}
              isLoading={loading.locations}
            />
          ))}
        </div>
      )}

      {/* Add Location Modal */}
      <AddLocationModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddLocation}
      />

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Remove Location</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to remove this location from your saved list?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRemoveLocation(confirmDelete)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedLocations;
