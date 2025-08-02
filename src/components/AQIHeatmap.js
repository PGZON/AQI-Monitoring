import React, { useState, useEffect, useCallback, useMemo } from 'react';
import mlService from '../services/mlService';

const AQIHeatmap = () => {
  const [heatmapData, setHeatmapData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState('mumbai');
  const [gridSize, setGridSize] = useState(8);
  const [cityPredictions, setCityPredictions] = useState([]);

  // Predefined regions - memoized to prevent re-renders
  const regions = useMemo(() => ({
    mumbai: {
      name: 'Mumbai Metropolitan Area',
      center: { lat: 19.0760, lng: 72.8777 },
      bounds: {
        north: 19.2500,
        south: 18.9000,
        east: 72.9700,
        west: 72.7700
      }
    },
    delhi: {
      name: 'Delhi NCR',
      center: { lat: 28.7041, lng: 77.1025 },
      bounds: {
        north: 28.8500,
        south: 28.4000,
        east: 77.3500,
        west: 77.0500
      }
    },
    bangalore: {
      name: 'Bangalore Urban District',
      center: { lat: 12.9716, lng: 77.5946 },
      bounds: {
        north: 13.1500,
        south: 12.8000,
        east: 77.8000,
        west: 77.4000
      }
    },
    chennai: {
      name: 'Chennai Metropolitan Area',
      center: { lat: 13.0827, lng: 80.2707 },
      bounds: {
        north: 13.2500,
        south: 12.9000,
        east: 80.5000,
        west: 80.0000
      }
    },
    kolkata: {
      name: 'Kolkata Metropolitan Area',
      center: { lat: 22.5726, lng: 88.3639 },
      bounds: {
        north: 22.7000,
        south: 22.4000,
        east: 88.5000,
        west: 88.2000
      }
    },
    india: {
      name: 'India Overview',
      center: { lat: 20.5937, lng: 78.9629 },
      bounds: {
        north: 35.0000,
        south: 6.0000,
        east: 97.0000,
        west: 68.0000
      }
    }
  }), []);

  useEffect(() => {
    loadMajorCityPredictions();
  }, []);

  const loadMajorCityPredictions = async () => {
    try {
      const predictions = await mlService.getMajorCityPredictions();
      setCityPredictions(predictions);
    } catch (error) {
      console.error('Failed to load city predictions:', error);
    }
  };

  // Generate fallback data for demo purposes
  const generateFallbackHeatmapData = useCallback((bounds, gridSize) => {
    console.log('🎭 Generating fallback mock data');
    const mockData = [];
    const latStep = (bounds.north - bounds.south) / gridSize;
    const lonStep = (bounds.east - bounds.west) / gridSize;

    for (let i = 0; i <= gridSize; i++) {
      for (let j = 0; j <= gridSize; j++) {
        const lat = bounds.south + (i * latStep);
        const lon = bounds.west + (j * lonStep);
        const aqi = Math.floor(Math.random() * 200) + 20; // Random AQI 20-220

        mockData.push({
          lat,
          lng: lon,
          aqi,
          category: getAQICategory(aqi),
          timestamp: new Date().toISOString()
        });
      }
    }

    console.log(`🎭 Generated ${mockData.length} fallback points`);
    return mockData;
  }, []);

  const getAQICategory = (aqi) => {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  };

  const generateHeatmap = useCallback(async () => {
    if (!selectedRegion || !regions[selectedRegion]) {
      console.log('❌ No valid region selected');
      return;
    }

    setLoading(true);
    setError(null);
    console.log(`🗺️ Generating heatmap for ${selectedRegion} with grid size ${gridSize}`);

    try {
      // Health check
      const isHealthy = await mlService.checkHealth();
      console.log('🏥 ML Service health check:', isHealthy);

      if (!isHealthy.status) {
        console.log('⚠️ ML Service unhealthy, using fallback data');
        const fallbackData = generateFallbackHeatmapData(regions[selectedRegion].bounds, gridSize);
        setHeatmapData(fallbackData);
        return;
      }

      // Generate heatmap data using ML service
      console.log('📊 Calling generateHeatmapData...');
      const region = regions[selectedRegion];
      const data = await mlService.generateHeatmapData(region.bounds, gridSize);
      
      if (data && data.length > 0) {
        console.log(`✅ Generated ${data.length} heatmap points`);
        setHeatmapData(data);
      } else {
        console.log('⚠️ No data returned, using fallback');
        const fallbackData = generateFallbackHeatmapData(regions[selectedRegion].bounds, gridSize);
        setHeatmapData(fallbackData);
      }
    } catch (error) {
      console.error('❌ Error generating heatmap:', error);
      setError(`Failed to generate heatmap: ${error.message}`);
      
      // Fallback to mock data
      console.log('🎭 Using fallback data due to error');
      const fallbackData = generateFallbackHeatmapData(regions[selectedRegion].bounds, gridSize);
      setHeatmapData(fallbackData);
    } finally {
      setLoading(false);
    }
  }, [selectedRegion, gridSize, regions, generateFallbackHeatmapData]);

  // Add useEffect after generateHeatmap is defined
  useEffect(() => {
    if (selectedRegion) {
      generateHeatmap();
    }
  }, [selectedRegion, gridSize, generateHeatmap]);

  const getAQIColor = (aqi) => {
    if (aqi <= 50) return '#00e400';
    if (aqi <= 100) return '#ffff00';
    if (aqi <= 150) return '#ff7e00';
    if (aqi <= 200) return '#ff0000';
    if (aqi <= 300) return '#8f3f97';
    return '#7e0023';
  };

  const renderHeatmapGrid = () => {
    if (!heatmapData || heatmapData.length === 0) {
      return <div className="text-gray-500">No heatmap data available</div>;
    }

    const region = regions[selectedRegion];
    if (!region) return null;

    return (
      <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ height: '400px' }}>
        <div className="absolute inset-0 grid" style={{ 
          gridTemplateColumns: `repeat(${gridSize + 1}, 1fr)`,
          gridTemplateRows: `repeat(${gridSize + 1}, 1fr)`
        }}>
          {heatmapData.map((point, index) => {
            return (
              <div
                key={index}
                className="relative border border-gray-200 flex items-center justify-center text-xs font-semibold text-white"
                style={{
                  backgroundColor: getAQIColor(point.aqi),
                  opacity: 0.8
                }}
                title={`AQI: ${point.aqi} (${point.category?.name || point.category})\nLat: ${point.lat.toFixed(4)}, Lng: ${point.lng.toFixed(4)}`}
              >
                {point.aqi}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderCityPredictions = () => {
    if (!cityPredictions || cityPredictions.length === 0) {
      return <div className="text-gray-500">No city predictions available</div>;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cityPredictions.map((city, index) => (
          <div key={index} className="bg-white rounded-lg p-4 shadow border">
            <h3 className="font-semibold text-lg">{city.city}</h3>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold" style={{ color: getAQIColor(city.aqi) }}>
                {city.aqi}
              </span>
              <span className="text-sm text-gray-600">{city.category?.name || city.category}</span>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Last updated: {new Date(city.timestamp).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">AQI Heatmap Visualization</h2>
          <div className="flex space-x-4">
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Object.entries(regions).map(([key, region]) => (
                <option key={key} value={key}>
                  {region.name}
                </option>
              ))}
            </select>
            <select
              value={gridSize}
              onChange={(e) => setGridSize(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={6}>6x6 Grid</option>
              <option value={8}>8x8 Grid</option>
              <option value={10}>10x10 Grid</option>
              <option value={12}>12x12 Grid</option>
            </select>
            <button
              onClick={generateHeatmap}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <span>Refresh Heatmap</span>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Regional Heatmap</h3>
            {renderHeatmapGrid()}
          </div>

          <div className="flex justify-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#00e400' }}></div>
              <span>Good (0-50)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ffff00' }}></div>
              <span>Moderate (51-100)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ff7e00' }}></div>
              <span>Unhealthy for Sensitive (101-150)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ff0000' }}></div>
              <span>Unhealthy (151-200)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#8f3f97' }}></div>
              <span>Very Unhealthy (201-300)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#7e0023' }}></div>
              <span>Hazardous (300+)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Major City Predictions</h3>
        {renderCityPredictions()}
      </div>
    </div>
  );
};

export default AQIHeatmap;
