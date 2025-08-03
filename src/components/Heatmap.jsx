/**
 * Interactive Pollution Heatmap Component
 * Displays AQI data across multiple locations with color-coded markers
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  getHeatmapMarkerSize, 
  formatLastUpdated,
  AQI_CATEGORIES 
} from '../utils/aqiUtils';
import LoadingSpinner from './LoadingSpinner';

// Fix for default markers in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

/**
 * Map bounds handler component
 */
const MapBoundsHandler = ({ onBoundsChange }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    
    const handleBoundsChange = () => {
      const bounds = map.getBounds();
      
      // Get raw bounds
      let rawWest = bounds.getWest();
      let rawEast = bounds.getEast();
      const rawNorth = bounds.getNorth();
      const rawSouth = bounds.getSouth();
      
      // Handle longitude wrap-around (crossing 180°/-180° meridian)
      if (rawWest > rawEast) {
        // Map crosses the date line, normalize to standard bounds
        rawWest = rawWest - 360;
      }
      
      // Clamp longitude values to valid range (-180 to 180)
      const west = Math.max(-180, Math.min(180, rawWest));
      const east = Math.max(-180, Math.min(180, rawEast));
      const north = Math.max(-90, Math.min(90, rawNorth));
      const south = Math.max(-90, Math.min(90, rawSouth));
      
      console.log('🗺️ [MapBounds] Bounds check:', { 
        raw: { west: rawWest, east: rawEast, north: rawNorth, south: rawSouth },
        clamped: { west, east, north, south }
      });
      
      // Ensure bounds are valid (west < east, south < north)
      if (west >= east || south >= north) {
        console.warn('🗺️ [MapBounds] Invalid bounds detected, skipping update');
        return;
      }
      
      // Use callback with useCallback and proper dependencies in parent
      onBoundsChange({
        north,
        south,
        east,
        west
      });
    };

    map.on('moveend', handleBoundsChange);
    map.on('zoomend', handleBoundsChange);
    
    return () => {
      map.off('moveend', handleBoundsChange);
      map.off('zoomend', handleBoundsChange);
    };
  }, [map, onBoundsChange]);

  return null;
};

/**
 * AQI Legend Component (Compact version)
 */
const AQILegend = ({ className = '' }) => {
  const categories = Object.values(AQI_CATEGORIES);

  return (
    <div className={`bg-white rounded-lg shadow-lg p-3 ${className} max-w-48`}>
      <h3 className="text-xs font-semibold text-gray-900 mb-2">AQI Scale</h3>
      <div className="space-y-1">
        {categories.map((category, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: category.color }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-900 truncate">
                {category.level}
              </div>
              <div className="text-xs text-gray-500">
                {category.range[0]}-{category.range[1]}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Heatmap Controls Component
 */
const HeatmapControls = ({ 
  isLoading, 
  onRefresh, 
  showHealthySites, 
  onToggleHealthySites,
  selectedPollutant,
  onPollutantChange,
  hasData = false
}) => {
  const pollutants = [
    { key: 'aqi', label: 'AQI', description: 'Overall Air Quality Index' },
    { key: 'pm2_5', label: 'PM2.5', description: 'Fine Particulate Matter' },
    { key: 'pm10', label: 'PM10', description: 'Particulate Matter' },
    { key: 'o3', label: 'Ozone', description: 'Ground-level Ozone' },
    { key: 'no2', label: 'NO₂', description: 'Nitrogen Dioxide' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Map Controls</h3>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="px-3 py-2 text-sm font-medium rounded-lg transition-colors text-gray-600 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-50"
          title="Refresh heatmap data"
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Loading...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </div>
          )}
        </button>
      </div>

      {/* Pollutant Filter */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Display by:
        </label>
        <select
          value={selectedPollutant}
          onChange={(e) => onPollutantChange(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {pollutants.map(pollutant => (
            <option key={pollutant.key} value={pollutant.key}>
              {pollutant.label} - {pollutant.description}
            </option>
          ))}
        </select>
      </div>

      {/* Show/Hide Healthy Sites */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="showHealthySites"
          checked={showHealthySites}
          onChange={(e) => onToggleHealthySites(e.target.checked)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="showHealthySites" className="ml-2 text-xs text-gray-700">
          Show healthy sites (AQI ≤ 50)
        </label>
      </div>
    </div>
  );
};

/**
 * Main Heatmap Component
 */
const Heatmap = ({ 
  center = [20.5937, 78.9629], // Geographic center of India
  zoom = 5,
  className = '',
  onLocationSelect = null 
}) => {
  const [heatmapData, setHeatmapData] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Start loading immediately
  const [selectedPollutant, setSelectedPollutant] = useState('aqi');
  const [showHealthySites, setShowHealthySites] = useState(true);
  const [mapBounds, setMapBounds] = useState(null);
  const [error, setError] = useState(null);

  console.log('🗺️ [Heatmap] Component state:', { 
    isLoading, 
    dataLength: heatmapData.length, 
    hasError: !!error,
    hasBounds: !!mapBounds
  });

  // Remove emergency timeout since we load automatically now
  // Emergency timeout removed - data loads automatically on mount

  /**
   * Handle map bounds change
   */
  const handleBoundsChange = useCallback((bounds) => {
    setMapBounds(bounds);
  }, []);

  /**
   * Filter data based on selected pollutant and visibility settings
   */
  const filteredData = useMemo(() => {
    if (!Array.isArray(heatmapData)) {
      console.warn('🗺️ [Heatmap] heatmapData is not an array:', heatmapData);
      return [];
    }
    
    return heatmapData.filter(location => {
      // Enhanced safety check for location structure
      if (!location) {
        console.warn('🗺️ [Heatmap] Null location found');
        return false;
      }
      
      // Check coordinates
      if (!location.coordinates || 
          typeof location.coordinates.lat !== 'number' || 
          typeof location.coordinates.lng !== 'number') {
        console.warn('🗺️ [Heatmap] Invalid coordinates:', location.coordinates);
        return false;
      }
      
      // Check AQI data
      if (!location.aqi || typeof location.aqi.index !== 'number') {
        console.warn('🗺️ [Heatmap] Invalid AQI data:', location.aqi);
        return false;
      }
      
      const aqiValue = location.aqi.index;
      
      // Validate AQI range
      if (aqiValue < 0 || aqiValue > 500) {
        console.warn('🗺️ [Heatmap] AQI value out of range:', aqiValue);
        return false;
      }
      
      // Filter out healthy sites if option is disabled
      if (!showHealthySites && aqiValue <= 50) {
        return false;
      }
      
      return true;
    });
  }, [heatmapData, showHealthySites]);

  /**
   * Get marker color based on selected pollutant
   */
  const getMarkerColor = useCallback((location) => {
    // Safety check for location structure
    if (!location || !location.aqi) {
      return '#6b7280'; // Default gray color
    }
    
    if (selectedPollutant === 'aqi') {
      return location.aqi.color || '#6b7280';
    }
    
    // Safety check for pollutants
    if (!location.pollutants || !location.pollutants[selectedPollutant]) {
      return '#6b7280';
    }
    
    const pollutantValue = location.pollutants[selectedPollutant]?.value;
    if (!pollutantValue) return '#6b7280';
    
    // Use AQI color mapping for pollutants (simplified)
    if (pollutantValue <= 35) return AQI_CATEGORIES.GOOD.color;
    if (pollutantValue <= 75) return AQI_CATEGORIES.MODERATE.color;
    if (pollutantValue <= 115) return AQI_CATEGORIES.UNHEALTHY_SENSITIVE.color;
    if (pollutantValue <= 150) return AQI_CATEGORIES.UNHEALTHY.color;
    if (pollutantValue <= 250) return AQI_CATEGORIES.VERY_UNHEALTHY.color;
    return AQI_CATEGORIES.HAZARDOUS.color;
  }, [selectedPollutant]);

  /**
   * Fetch heatmap data automatically on component mount
   */
  const fetchHeatmapData = useCallback(async () => {
    if (isLoading && heatmapData.length > 0) return; // Don't reload if already loaded

    console.log('🗺️ [Heatmap] Auto-loading heatmap data');
    setIsLoading(true);
    setError(null);

    try {
      // Generate mock data with all Indian cities
      console.log('🗺️ [Heatmap] Loading mock data with all Indian cities');
      
      const { generateMockHeatmapData } = require('../utils/aqiUtils');
      const mockData = generateMockHeatmapData(50); // Generate 50 locations
      
      console.log('🗺️ [Heatmap] Generated', mockData.length, 'mock locations');
      
      // Verify unique AQI values
      const aqiValues = mockData.map(d => d.aqi.index);
      const uniqueAQIs = [...new Set(aqiValues)];
      console.log('🗺️ [Heatmap] AQI Values:', aqiValues.slice(0, 10), '...');
      console.log('🗺️ [Heatmap] Unique AQI count:', uniqueAQIs.length, 'out of', mockData.length);
      
      // Log first few with details
      console.log('🗺️ [Heatmap] Sample data:');
      mockData.slice(0, 5).forEach((d, i) => {
        console.log(`  ${i+1}. ${d.name}: AQI ${d.aqi.index} (${d.aqi.level})`);
      });
      
      setHeatmapData(mockData);
        
    } catch (error) {
      console.error('🗺️ [Heatmap] Error loading data:', error);
      setError('Failed to load data');
      setHeatmapData([]);
    } finally {
      setIsLoading(false);
      console.log('🗺️ [Heatmap] Load complete');
    }
  }, [isLoading, heatmapData.length]);

  // Auto-load data on component mount
  useEffect(() => {
    fetchHeatmapData();
  }, [fetchHeatmapData]); // Include fetchHeatmapData dependency

  // Load data when bounds change (for refresh functionality)
  useEffect(() => {
    if (mapBounds && heatmapData.length > 0) {
      // Only refresh if we already have data and bounds changed
      fetchHeatmapData();
    }
  }, [mapBounds, fetchHeatmapData, heatmapData.length]); // Include all dependencies

  return (
    <div className={`relative ${className}`}>
      {/* Map Container - Made bigger */}
      <div className="h-[600px] lg:h-[700px] rounded-lg overflow-hidden shadow-lg">
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          className="z-10"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapBoundsHandler onBoundsChange={handleBoundsChange} />
          
          {/* Render markers */}
          {filteredData.map((location) => (
            <CircleMarker
              key={location.id}
              center={[location.coordinates.lat, location.coordinates.lng]}
              radius={getHeatmapMarkerSize(location.aqi.index)}
              pathOptions={{
                color: '#ffffff',
                weight: 2,
                fillColor: getMarkerColor(location),
                fillOpacity: 0.8
              }}
              eventHandlers={{
                click: () => {
                  if (onLocationSelect) {
                    onLocationSelect(location);
                  }
                }
              }}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {location.name}
                  </h3>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">AQI:</span>
                      <span 
                        className="px-2 py-1 rounded text-xs font-medium text-white"
                        style={{ backgroundColor: location.aqi.color }}
                      >
                        {location.aqi.index} - {location.aqi.level}
                      </span>
                    </div>
                    
                    {location.pollutants && (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">PM2.5:</span>
                          <span className="text-sm font-medium">
                            {location.pollutants.pm2_5?.value} {location.pollutants.pm2_5?.unit}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">PM10:</span>
                          <span className="text-sm font-medium">
                            {location.pollutants.pm10?.value} {location.pollutants.pm10?.unit}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">O₃:</span>
                          <span className="text-sm font-medium">
                            {location.pollutants.o3?.value} {location.pollutants.o3?.unit}
                          </span>
                        </div>
                      </>
                    )}
                    
                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-500">
                        Updated: {formatLastUpdated(location.lastUpdated)}
                      </p>
                    </div>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      {/* Map Controls Overlay - Moved to top-right, smaller */}
      <div className="absolute top-4 right-4 z-20 w-56">
        <HeatmapControls
          isLoading={isLoading}
          onRefresh={fetchHeatmapData}
          showHealthySites={showHealthySites}
          onToggleHealthySites={setShowHealthySites}
          selectedPollutant={selectedPollutant}
          onPollutantChange={setSelectedPollutant}
          hasData={heatmapData.length > 0}
        />
      </div>

      {/* Legend Overlay - Moved to bottom-left, smaller */}
      <div className="absolute bottom-4 left-4 z-20">
        <AQILegend />
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-25 flex items-center justify-center z-30">
          <div className="bg-white rounded-lg p-4 flex items-center space-x-3">
            <LoadingSpinner size="sm" />
            <span className="text-sm text-gray-600">Loading heatmap data...</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="absolute bottom-4 right-4 z-20 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-800">{error}</p>
          <button
            onClick={fetchHeatmapData}
            className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Data Info */}
      <div className="absolute bottom-4 right-4 z-20 bg-white rounded-lg shadow-lg p-3">
        <p className="text-xs text-gray-600">
          Showing {filteredData.length} monitoring stations
        </p>
        {!showHealthySites && (
          <p className="text-xs text-yellow-600">
            Healthy sites hidden
          </p>
        )}
      </div>
    </div>
  );
};

export default Heatmap;
