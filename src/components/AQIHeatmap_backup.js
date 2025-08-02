import React, { useState, useEffect, useCallback, useMemo  }), []);

  const loadMajorCityPredictions = async () => {react';
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
        east: 73.0000,
        west: 72.7000
      }
    },
    delhi: {
      name: 'Delhi NCR',
      center: { lat: 28.6139, lng: 77.2090 },
      bounds: {
        north: 28.8000,
        south: 28.4000,
        east: 77.4000,
        west: 77.0000
      }
    },
    bangalore: {
      name: 'Bangalore Urban',
      center: { lat: 12.9716, lng: 77.5946 },
      bounds: {
        north: 13.1500,
        south: 12.8000,
        east: 77.8000,
        west: 77.4000
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

  useEffect(() => {
    if (selectedRegion) {
      generateHeatmap();
    }
  }, [selectedRegion, gridSize, generateHeatmap]);

  const loadMajorCityPredictions = async () => {
    try {
      const predictions = await mlService.getMajorCityPredictions();
      setCityPredictions(predictions);
    } catch (error) {
      console.error('Failed to load city predictions:', error);
    }
  };

  const generateHeatmap = useCallback(async () => {
    if (!regions[selectedRegion]) return;

    setLoading(true);
    setError(null);
    setHeatmapData([]);

    try {
      console.log('🚀 Starting heatmap generation for:', selectedRegion);
      
      const bounds = regions[selectedRegion].bounds;
      console.log('📍 Region bounds:', bounds);
      
      // Check ML service health first
      const healthCheck = await mlService.checkMLHealth();
      console.log('🏥 ML Service health:', healthCheck);
      
      const data = await mlService.generateHeatmapData(bounds, gridSize);
      console.log('📊 Generated heatmap data:', data);
      
      if (data && data.length > 0) {
        setHeatmapData(data);
        setError(null);
      } else {
        throw new Error('No heatmap data generated');
      }
    } catch (error) {
      console.error('❌ Heatmap generation error:', error);
      setError(`Failed to generate heatmap: ${error.message}`);
      
      // Set fallback mock data so user sees something
      const bounds = regions[selectedRegion].bounds;
      const mockData = generateFallbackHeatmapData(bounds, gridSize);
      setHeatmapData(mockData);
    } finally {
      setLoading(false);
    }
  }, [selectedRegion, gridSize, regions]);

  // Generate fallback data for demo purposes
  const generateFallbackHeatmapData = (bounds, gridSize) => {
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
          intensity: mlService.aqiToIntensity(aqi),
          color: mlService.aqiToColor(aqi),
          category: mlService.aqiToCategory(aqi),
          isMock: true
        });
      }
    }
    return mockData;
  };

  const getIntensityColor = (intensity) => {
    const colors = [
      { threshold: 0, color: 'rgba(0, 228, 0, 0.6)' },      // Good - Green
      { threshold: 0.17, color: 'rgba(255, 255, 0, 0.6)' }, // Moderate - Yellow
      { threshold: 0.33, color: 'rgba(255, 126, 0, 0.6)' }, // USG - Orange
      { threshold: 0.5, color: 'rgba(255, 0, 0, 0.6)' },    // Unhealthy - Red
      { threshold: 0.67, color: 'rgba(143, 63, 151, 0.6)' }, // Very Unhealthy - Purple
      { threshold: 1, color: 'rgba(126, 0, 35, 0.6)' }      // Hazardous - Maroon
    ];

    for (let i = colors.length - 1; i >= 0; i--) {
      if (intensity >= colors[i].threshold) {
        return colors[i].color;
      }
    }
    return colors[0].color;
  };

  const renderHeatmapGrid = () => {
    if (!heatmapData.length) return null;

    const region = regions[selectedRegion];
    const latRange = region.bounds.north - region.bounds.south;
    const lonRange = region.bounds.east - region.bounds.west;

    return (
      <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
        <div className="absolute inset-0 grid" 
             style={{ 
               gridTemplateColumns: `repeat(${gridSize + 1}, 1fr)`,
               gridTemplateRows: `repeat(${gridSize + 1}, 1fr)`
             }}>
          {heatmapData.map((point, index) => {
            const x = ((point.lng - region.bounds.west) / lonRange) * 100;
            const y = ((region.bounds.north - point.lat) / latRange) * 100;
            
            return (
              <div
                key={index}
                className="relative group cursor-pointer transition-all duration-200 hover:z-10 hover:scale-110"
                style={{
                  backgroundColor: getIntensityColor(point.intensity),
                  border: '1px solid rgba(255,255,255,0.2)'
                }}
                title={`AQI: ${Math.round(point.aqi)} (${point.category.name})`}
              >
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-20">
                  <div>AQI: {Math.round(point.aqi)}</div>
                  <div>{point.category.name}</div>
                  <div className="text-gray-300">
                    {point.lat.toFixed(3)}, {point.lng.toFixed(3)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 right-4 bg-white p-3 rounded-lg shadow-lg">
          <h4 className="text-sm font-semibold mb-2">AQI Scale</h4>
          <div className="space-y-1 text-xs">
            <div className="flex items-center">
              <div className="w-4 h-3 bg-green-500 mr-2 rounded"></div>
              <span>0-50 Good</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-3 bg-yellow-500 mr-2 rounded"></div>
              <span>51-100 Moderate</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-3 bg-orange-500 mr-2 rounded"></div>
              <span>101-150 USG</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-3 bg-red-500 mr-2 rounded"></div>
              <span>151-200 Unhealthy</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-3 bg-purple-600 mr-2 rounded"></div>
              <span>201-300 Very Unhealthy</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-3 bg-red-900 mr-2 rounded"></div>
              <span>300+ Hazardous</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const getAQIStats = () => {
    if (!heatmapData.length) return null;

    const aqiValues = heatmapData.map(point => point.aqi);
    const min = Math.min(...aqiValues);
    const max = Math.max(...aqiValues);
    const avg = aqiValues.reduce((sum, aqi) => sum + aqi, 0) / aqiValues.length;

    const categories = heatmapData.reduce((acc, point) => {
      const category = point.category.name;
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    return { min, max, avg, categories, total: heatmapData.length };
  };

  const stats = getAQIStats();

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">AQI Heatmap Visualization</h2>
          <p className="text-gray-600">
            Real-time AQI predictions using ML models across different regions
          </p>
        </div>

        {/* Controls */}
        <div className="mb-6 flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Region
            </label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(regions).map(([key, region]) => (
                <option key={key} value={key}>{region.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Grid Resolution
            </label>
            <select
              value={gridSize}
              onChange={(e) => setGridSize(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={5}>5x5 (Fast)</option>
              <option value={8}>8x8 (Balanced)</option>
              <option value={10}>10x10 (Detailed)</option>
              <option value={15}>15x15 (High Detail)</option>
            </select>
          </div>

          <button
            onClick={generateHeatmap}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating...' : 'Refresh Heatmap'}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="mb-6 p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Generating heatmap predictions...</p>
          </div>
        )}

        {/* Heatmap Grid */}
        {!loading && heatmapData.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">
              {regions[selectedRegion]?.name} - AQI Heatmap
            </h3>
            {renderHeatmapGrid()}
          </div>
        )}

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-3">Region Statistics</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Min AQI:</span>
                  <span className="font-medium">{Math.round(stats.min)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Max AQI:</span>
                  <span className="font-medium">{Math.round(stats.max)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Average AQI:</span>
                  <span className="font-medium">{Math.round(stats.avg)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Grid Points:</span>
                  <span className="font-medium">{stats.total}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-3">Category Distribution</h4>
              <div className="space-y-2 text-sm">
                {Object.entries(stats.categories).map(([category, count]) => (
                  <div key={category} className="flex justify-between">
                    <span className="text-gray-600">{category}:</span>
                    <span className="font-medium">
                      {count} ({Math.round((count / stats.total) * 100)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Major Cities Overview */}
      {cityPredictions.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Major Cities Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {cityPredictions.map((city) => (
              <div key={city.name} className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-800">{city.name}</h4>
                {city.aqi ? (
                  <div>
                    <div className="text-2xl font-bold mt-2" 
                         style={{ color: mlService.aqiToColor(city.aqi) }}>
                      {Math.round(city.aqi)}
                    </div>
                    <div className="text-sm text-gray-600">{city.category.name}</div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 mt-2">No data available</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AQIHeatmap;
