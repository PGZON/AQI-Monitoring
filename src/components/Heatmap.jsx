/**
 * Interactive Pollution Heatmap Component
 * Displays AQI data across multiple locations with color-coded markers
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import forecastService from '../services/forecastService';
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
    const handleBoundsChange = () => {
      const bounds = map.getBounds();
      onBoundsChange({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest()
      });
    };

    map.on('moveend', handleBoundsChange);
    map.on('zoomend', handleBoundsChange);
    
    // Initial bounds
    handleBoundsChange();

    return () => {
      map.off('moveend', handleBoundsChange);
      map.off('zoomend', handleBoundsChange);
    };
  }, [map, onBoundsChange]);

  return null;
};

/**
 * AQI Legend Component
 */
const AQILegend = ({ className = '' }) => {
  const categories = Object.values(AQI_CATEGORIES);

  return (
    <div className={`bg-white rounded-lg shadow-lg p-4 ${className}`}>
      <h3 className="text-sm font-semibold text-gray-900 mb-3">AQI Scale</h3>
      <div className="space-y-2">
        {categories.map((category, index) => (
          <div key={index} className="flex items-center space-x-3">
            <div 
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: category.color }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-900">
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
  onPollutantChange 
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
          className="p-2 text-gray-600 hover:text-blue-600 disabled:opacity-50 transition-colors"
          title="Refresh data"
        >
          <svg 
            className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
            />
          </svg>
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
  center = [39.8283, -98.5795], // Geographic center of US
  zoom = 5,
  className = '',
  onLocationSelect = null 
}) => {
  const [heatmapData, setHeatmapData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPollutant, setSelectedPollutant] = useState('aqi');
  const [showHealthySites, setShowHealthySites] = useState(true);
  const [mapBounds, setMapBounds] = useState(null);
  const [error, setError] = useState(null);

  /**
   * Fetch heatmap data based on current map bounds
   */
  const fetchHeatmapData = useCallback(async () => {
    if (!mapBounds) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await forecastService.getHeatmapData(mapBounds, 50);
      setHeatmapData(data);
    } catch (err) {
      console.error('Error fetching heatmap data:', err);
      setError('Failed to load heatmap data');
    } finally {
      setIsLoading(false);
    }
  }, [mapBounds]);

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
    return heatmapData.filter(location => {
      const aqiValue = location.aqi.index;
      
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
    if (selectedPollutant === 'aqi') {
      return location.aqi.color;
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

  // Fetch data when bounds change
  useEffect(() => {
    if (mapBounds) {
      fetchHeatmapData();
    }
  }, [fetchHeatmapData, mapBounds]);

  return (
    <div className={`relative ${className}`}>
      {/* Map Container */}
      <div className="h-96 lg:h-[500px] rounded-lg overflow-hidden shadow-lg">
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

      {/* Map Controls Overlay */}
      <div className="absolute top-4 left-4 z-20 w-64">
        <HeatmapControls
          isLoading={isLoading}
          onRefresh={fetchHeatmapData}
          showHealthySites={showHealthySites}
          onToggleHealthySites={setShowHealthySites}
          selectedPollutant={selectedPollutant}
          onPollutantChange={setSelectedPollutant}
        />
      </div>

      {/* Legend Overlay */}
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
