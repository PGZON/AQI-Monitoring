import React, { useState, useEffect, useCallback } from 'react';
import AQICard from '../components/AQICard';
import LocationButton from '../components/LocationButton';

const Dashboard = ({ onNavigate }) => {
  const [aqiData, setAqiData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAQIData = useCallback(async (latitude, longitude) => {
    try {
      setLoading(true);
      
      // For now, we'll simulate API call with mock data
      // In production, this would be: const response = await fetch('/api/aqi', { ... })
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
      
      // Mock AQI data based on coordinates
      const mockAQIData = {
        aqi: Math.floor(Math.random() * 200) + 50, // Random AQI between 50-250
        location: await getLocationName(latitude, longitude),
        coordinates: { latitude, longitude },
        status: getAQIStatus(Math.floor(Math.random() * 200) + 50),
        pollutants: {
          pm2_5: Math.floor(Math.random() * 100) + 10,
          pm10: Math.floor(Math.random() * 150) + 20,
          co: (Math.random() * 2).toFixed(2),
          no2: (Math.random() * 0.1).toFixed(3),
          o3: (Math.random() * 0.15).toFixed(3),
          so2: (Math.random() * 0.05).toFixed(3)
        },
        lastUpdated: new Date().toISOString()
      };
      
      setAqiData(mockAQIData);
      setError(null);
    } catch (err) {
      console.error('Error fetching AQI data:', err);
      setError('Failed to fetch air quality data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleGetLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        console.log('📍 Location found:', { latitude, longitude });
        
        try {
          await fetchAQIData(latitude, longitude);
        } catch (err) {
          setError('Failed to fetch air quality data. Please try again.');
          setLoading(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLoading(false);
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setError('Location access denied. Please enable location services and try again.');
            break;
          case error.POSITION_UNAVAILABLE:
            setError('Location information is unavailable. Please try again.');
            break;
          case error.TIMEOUT:
            setError('Location request timed out. Please try again.');
            break;
          default:
            setError('An unknown error occurred while retrieving location.');
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  }, [fetchAQIData]);

  // Automatically request location on page load
  useEffect(() => {
    handleGetLocation();
  }, [handleGetLocation]);

  const getLocationName = async (lat, lng) => {
    try {
      // Mock location name - in production, use reverse geocoding API
      const locations = [
        'New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX',
        'Phoenix, AZ', 'Philadelphia, PA', 'San Antonio, TX', 'San Diego, CA',
        'Dallas, TX', 'San Jose, CA', 'Austin, TX', 'Jacksonville, FL'
      ];
      return locations[Math.floor(Math.random() * locations.length)];
    } catch (err) {
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  };

  const getAQIStatus = (aqi) => {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  };

  return (
    <div className="dashboard">
      <div className="dashboard-container">
        <header className="dashboard-header">
          {onNavigate && (
            <button 
              className="back-button"
              onClick={() => onNavigate('landing')}
              type="button"
            >
              ← Back to Home
            </button>
          )}
          <h1 className="dashboard-title">Your Air Quality Right Now</h1>
          <p className="dashboard-subtitle">
            Real-time air quality data for your current location
          </p>
        </header>

        <div className="dashboard-content">
          {loading && (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p className="loading-text">
                {!aqiData ? 'Getting your location...' : 'Fetching air quality data...'}
              </p>
            </div>
          )}

          {error && (
            <div className="error-container">
              <div className="error-icon">⚠️</div>
              <h3 className="error-title">Unable to Get Air Quality Data</h3>
              <p className="error-message">{error}</p>
              <LocationButton onLocationRequest={handleGetLocation} />
            </div>
          )}

          {aqiData && !loading && (
            <div className="aqi-container">
              <AQICard data={aqiData} />
              <div className="refresh-container">
                <LocationButton 
                  onLocationRequest={handleGetLocation} 
                  variant="refresh"
                  disabled={loading}
                />
                <span className="last-updated">
                  Last updated: {new Date(aqiData.lastUpdated).toLocaleTimeString()}
                </span>
              </div>
            </div>
          )}

          {!aqiData && !loading && !error && (
            <div className="welcome-container">
              <div className="welcome-icon">🌍</div>
              <h3 className="welcome-title">Welcome to AQI Monitor</h3>
              <p className="welcome-message">
                Click the button below to get air quality data for your location
              </p>
              <LocationButton onLocationRequest={handleGetLocation} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
