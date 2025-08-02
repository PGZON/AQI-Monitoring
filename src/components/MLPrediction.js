import React, { useState, useEffect, useCallback } from 'react';
import mlService from '../services/mlService';

const MLPrediction = () => {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);
  const [coordinates, setCoordinates] = useState({
    lat: 19.0760, // Mumbai default
    lon: 72.8777
  });
  const [pollutionData, setPollutionData] = useState({
    pm25: '',
    pm10: '',
    no2: '',
    co: '',
    o3: '',
    so2: ''
  });

  // Load model info on component mount
  useEffect(() => {
    loadModelInfo();
  }, []);

  const loadModelInfo = async () => {
    try {
      const result = await mlService.getModelInfo();
      if (result.success) {
        setModelInfo(result.data);
      }
    } catch (error) {
      console.error('Failed to load model info:', error);
    }
  };

  const handlePredict = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Prepare current data (only include non-empty values)
      const currentData = {};
      Object.keys(pollutionData).forEach(key => {
        if (pollutionData[key] && pollutionData[key] !== '') {
          currentData[key] = parseFloat(pollutionData[key]);
        }
      });

      const result = await mlService.getLSTMPrediction(
        coordinates.lat,
        coordinates.lon,
        currentData
      );

      if (result.success) {
        setPrediction(result.data);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [coordinates, pollutionData]);

  const handleCoordinateChange = (field, value) => {
    setCoordinates(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  const handlePollutionChange = (field, value) => {
    setPollutionData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getAQIColor = (aqi) => {
    if (aqi <= 50) return '#00E400';
    if (aqi <= 100) return '#FFFF00';
    if (aqi <= 150) return '#FF7E00';
    if (aqi <= 200) return '#FF0000';
    if (aqi <= 300) return '#8F3F97';
    return '#7E0023';
  };

  const getAQICategory = (aqi) => {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  };

  const setPresetLocation = (name, lat, lon) => {
    setCoordinates({ lat, lon });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">ML AQI Prediction</h2>
        <p className="text-gray-600">
          Get AQI predictions using our trained LSTM model for any location
        </p>
      </div>

      {/* Model Information */}
      {modelInfo && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Model Information</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Type:</span> {modelInfo.model_type}
            </div>
            <div>
              <span className="font-medium">Features:</span> {modelInfo.input_features}
            </div>
            <div>
              <span className="font-medium">Validation MAE:</span> {modelInfo.performance?.validation_mae}
            </div>
            <div>
              <span className="font-medium">Accuracy:</span> {modelInfo.performance?.accuracy_30_aqi}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-3">Location</h3>
            
            {/* Preset Locations */}
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Quick select:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { name: 'Mumbai', lat: 19.0760, lon: 72.8777 },
                  { name: 'Delhi', lat: 28.6139, lon: 77.2090 },
                  { name: 'Bangalore', lat: 12.9716, lon: 77.5946 },
                  { name: 'Chennai', lat: 13.0827, lon: 80.2707 }
                ].map(city => (
                  <button
                    key={city.name}
                    onClick={() => setPresetLocation(city.name, city.lat, city.lon)}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    {city.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={coordinates.lat}
                  onChange={(e) => handleCoordinateChange('lat', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="19.0760"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Longitude
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={coordinates.lon}
                  onChange={(e) => handleCoordinateChange('lon', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="72.8777"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Current Pollution Data (Optional)</h3>
            <p className="text-sm text-gray-600 mb-3">
              Leave empty to use default values. Provide current readings for more accurate predictions.
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PM2.5 (µg/m³)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={pollutionData.pm25}
                  onChange={(e) => handlePollutionChange('pm25', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="25.0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PM10 (µg/m³)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={pollutionData.pm10}
                  onChange={(e) => handlePollutionChange('pm10', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="45.0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  NO2 (µg/m³)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={pollutionData.no2}
                  onChange={(e) => handlePollutionChange('no2', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="15.0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CO (mg/m³)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={pollutionData.co}
                  onChange={(e) => handlePollutionChange('co', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="1.0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  O3 (µg/m³)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={pollutionData.o3}
                  onChange={(e) => handlePollutionChange('o3', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="30.0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SO2 (µg/m³)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={pollutionData.so2}
                  onChange={(e) => handlePollutionChange('so2', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="5.0"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handlePredict}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Predicting...' : 'Get AQI Prediction'}
          </button>
        </div>

        {/* Results Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Prediction Results</h3>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {prediction && (
            <div className="space-y-4">
              {/* Main AQI Display */}
              <div 
                className="p-6 rounded-lg text-white text-center"
                style={{ backgroundColor: getAQIColor(prediction.predicted_aqi) }}
              >
                <h4 className="text-3xl font-bold mb-2">
                  {Math.round(prediction.predicted_aqi)}
                </h4>
                <p className="text-lg font-medium">
                  {getAQICategory(prediction.predicted_aqi).level}
                </p>
                <p className="text-sm opacity-90 mt-1">AQI Index</p>
              </div>

              {/* Prediction Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="font-medium text-gray-800 mb-3">Prediction Details</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span>{prediction.latitude}°, {prediction.longitude}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Prediction Time:</span>
                    <span>{new Date(prediction.prediction_time).toLocaleString()}</span>
                  </div>
                  {prediction.category && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Health Category:</span>
                      <span>{prediction.category?.name || prediction.category?.category || prediction.category}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Input Data Used */}
              {prediction.input_data && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-medium text-gray-800 mb-3">Input Data Used</h5>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(prediction.input_data).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600 capitalize">{key}:</span>
                        <span>{typeof value === 'number' ? value.toFixed(1) : value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!prediction && !error && !loading && (
            <div className="p-8 text-center text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
              <p>Enter coordinates and click "Get AQI Prediction" to see results</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MLPrediction;
