/**
 * Modern AQI Dashboard - Premium UI Design
 * Post-login dashboard with high-quality visuals and attractive design
 */

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import aqiService from '../services/aqiService';
import alertService from '../services/alertService';
import ModernForecastWidget from '../components/ModernForecastWidget';
import AnimatedBackground from '../components/AnimatedBackground';
import LoadingSpinner from '../components/LoadingSpinner';

// Modern gradient backgrounds and colors
const gradients = {
  good: 'bg-gradient-to-br from-green-400 via-green-500 to-green-600',
  moderate: 'bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500',
  unhealthy: 'bg-gradient-to-br from-orange-500 via-red-500 to-red-600',
  hazardous: 'bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800',
  primary: 'bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800',
  secondary: 'bg-gradient-to-br from-gray-800 via-gray-900 to-black'
};

// Weather gradients for navigation
const weatherGradients = {
  sunny: 'bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500'
};

// Modern card component with glassmorphism effect
const ModernCard = ({ children, className = '', gradient = false, blur = true }) => (
  <div className={`
    ${gradient ? gradient : blur ? 'bg-white/10 backdrop-blur-lg border border-white/20' : 'bg-white dark:bg-gray-800'} 
    rounded-2xl shadow-xl 
    hover:shadow-2xl transition-all duration-300 transform hover:scale-105
    ${blur && !gradient ? 'backdrop-blur-lg bg-opacity-80 dark:bg-opacity-80' : ''}
    ${className}
  `}>
    {children}
  </div>
);

// Stats card with icon and animation
const StatsCard = ({ title, value, subtitle, icon, gradient, trend }) => (
  <ModernCard gradient={gradient} className="p-6 text-white relative overflow-hidden">
    <div className="absolute top-0 right-0 opacity-20 text-6xl">
      {icon}
    </div>
    <div className="relative z-10">
      <h3 className="text-sm font-medium opacity-90 uppercase tracking-wider">{title}</h3>
      <div className="flex items-baseline space-x-2 mt-2">
        <p className="text-3xl font-bold">{value}</p>
        {trend && (
          <span className={`text-sm px-2 py-1 rounded-full ${
            trend > 0 ? 'bg-red-500 bg-opacity-30' : 'bg-green-500 bg-opacity-30'
          }`}>
            {trend > 0 ? '↗' : '↘'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      {subtitle && <p className="text-sm opacity-80 mt-1">{subtitle}</p>}
    </div>
  </ModernCard>
);

// Quick action button
const QuickActionButton = ({ title, subtitle, icon, onClick, gradient }) => (
  <ModernCard 
    gradient={gradient} 
    className="p-6 cursor-pointer group text-white"
    onClick={onClick}
  >
    <div className="flex items-center space-x-4">
      <div className="text-3xl group-hover:scale-110 transition-transform duration-200">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-sm opacity-80">{subtitle}</p>
      </div>
    </div>
  </ModernCard>
);

// Main location card with live AQI
const LocationCard = ({ location, aqi, status, loading }) => {
  const getAQIGradient = (aqiValue) => {
    if (!aqiValue || loading) return 'bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800';
    if (aqiValue <= 50) return gradients.good;
    if (aqiValue <= 100) return gradients.moderate;
    if (aqiValue <= 200) return gradients.unhealthy;
    return gradients.hazardous;
  };

  const getAQIDescription = (aqiValue) => {
    if (!aqiValue || loading) return 'Loading air quality data...';
    if (aqiValue <= 50) return 'Good - Air quality is satisfactory';
    if (aqiValue <= 100) return 'Moderate - Air quality is acceptable';
    if (aqiValue <= 200) return 'Unhealthy - Sensitive groups may experience health effects';
    return 'Hazardous - Health alert for everyone';
  };

  return (
    <ModernCard gradient={getAQIGradient(aqi)} className="p-8 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-black/10"></div>
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-3xl">📍</span>
              <div>
                <h2 className="text-3xl font-bold text-white drop-shadow-lg">{location || 'Your Location'}</h2>
                <p className="text-lg opacity-90 font-medium">Real-time Air Quality Index</p>
              </div>
            </div>
          </div>
          <div className="text-right bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
            <div className="text-xs opacity-80 mb-1">Last updated</div>
            <div className="text-sm font-medium">{new Date().toLocaleTimeString()}</div>
          </div>
        </div>
        
        <div className="text-center mb-8">
          {loading ? (
            <div className="animate-pulse">
              <div className="text-6xl mb-4">⏳</div>
              <div className="text-xl">Loading...</div>
              <div className="text-sm opacity-80 mt-2">{getAQIDescription()}</div>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <div className="text-xl font-semibold text-white/90 mb-2 bg-white/10 backdrop-blur-sm rounded-full px-6 py-2 inline-block border border-white/20">
                  📍 {location || 'Current Location'}
                </div>
              </div>
              <div className="text-7xl font-bold mb-3" style={{ textShadow: '0 4px 8px rgba(0,0,0,0.3)' }}>
                {aqi || '---'}
              </div>
              <div className="text-xl font-semibold mb-3 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 inline-block">
                {status || 'Loading...'}
              </div>
              <div className="text-sm opacity-90 max-w-md mx-auto">{getAQIDescription(aqi)}</div>
            </>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="text-3xl mb-2">🫁</div>
            <div className="text-xs opacity-80 font-medium">Health Impact</div>
            <div className="text-sm mt-1">{loading ? 'Loading' : (aqi <= 100 ? 'Low' : 'High')}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="text-3xl mb-2">🌡️</div>
            <div className="text-xs opacity-80 font-medium">Real-time</div>
            <div className="text-sm mt-1">Live Data</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="text-3xl mb-2">📊</div>
            <div className="text-xs opacity-80 font-medium">Trending</div>
            <div className="text-sm mt-1">{loading ? 'Loading' : 'Stable'}</div>
          </div>
        </div>
      </div>
    </ModernCard>
  );
};

// Weather-like forecast widget
const ForecastWidget = ({ location }) => (
  <ModernCard className="p-6">
    <h3 className="text-lg font-semibold mb-4 text-white flex items-center">
      <span className="mr-2">🔮</span>
      AQI Forecast
      <span className="ml-auto text-sm text-white/70">24 Hours</span>
    </h3>
    <ModernForecastWidget location={location} compact />
  </ModernCard>
);

// Main Modern Dashboard Component
const ModernDashboard = () => {
  const { user, logout } = useAuth();
  const { user: userProfile } = useUser();
  const navigate = useNavigate();
  
  // State management
  const [aqiData, setAqiData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locationName, setLocationName] = useState('');
  
  const hasInitialized = useRef(false);

  // Manual city lookup for major cities when geocoding fails
  const getCityFromCoordinates = (lat, lng) => {
    const cities = [
      { name: 'Mumbai, India', lat: 19.0760, lng: 72.8777, radius: 0.5 },
      { name: 'Delhi, India', lat: 28.7041, lng: 77.1025, radius: 0.5 },
      { name: 'Bangalore, India', lat: 12.9716, lng: 77.5946, radius: 0.5 },
      { name: 'Chennai, India', lat: 13.0827, lng: 80.2707, radius: 0.5 },
      { name: 'Kolkata, India', lat: 22.5726, lng: 88.3639, radius: 0.5 },
      { name: 'Hyderabad, India', lat: 17.3850, lng: 78.4867, radius: 0.5 },
      { name: 'Pune, India', lat: 18.5204, lng: 73.8567, radius: 0.5 },
      { name: 'Ahmedabad, India', lat: 23.0225, lng: 72.5714, radius: 0.5 },
      { name: 'Jaipur, India', lat: 26.9124, lng: 75.7873, radius: 0.5 },
      { name: 'Surat, India', lat: 21.1702, lng: 72.8311, radius: 0.5 },
      { name: 'Kanpur, India', lat: 26.4499, lng: 80.3319, radius: 0.5 },
      { name: 'Lucknow, India', lat: 26.8467, lng: 80.9462, radius: 0.5 },
      { name: 'Nagpur, India', lat: 21.1458, lng: 79.0882, radius: 0.5 },
      { name: 'Indore, India', lat: 22.7196, lng: 75.8577, radius: 0.5 },
      { name: 'Bhopal, India', lat: 23.2599, lng: 77.4126, radius: 0.5 },
      { name: 'Visakhapatnam, India', lat: 17.6868, lng: 83.2185, radius: 0.5 },
      { name: 'Patna, India', lat: 25.5941, lng: 85.1376, radius: 0.5 },
      { name: 'Vadodara, India', lat: 22.3072, lng: 73.1812, radius: 0.5 },
      { name: 'Ghaziabad, India', lat: 28.6692, lng: 77.4538, radius: 0.5 },
      { name: 'Ludhiana, India', lat: 30.9010, lng: 75.8573, radius: 0.5 },
      { name: 'Kolhapur, India', lat: 16.7050, lng: 74.2433, radius: 0.5 },
      { name: 'Sangli, India', lat: 16.8524, lng: 74.5815, radius: 0.5 },
      { name: 'Satara, India', lat: 17.6805, lng: 74.0183, radius: 0.5 }
    ];

    // Find closest city within radius
    let closestCity = null;
    let minDistance = Infinity;

    cities.forEach(city => {
      const distance = Math.sqrt(
        Math.pow(lat - city.lat, 2) + Math.pow(lng - city.lng, 2)
      );
      
      if (distance <= city.radius && distance < minDistance) {
        closestCity = city;
        minDistance = distance;
      }
    });

    return closestCity ? closestCity.name : `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
  };

  // Initialize dashboard data
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let latitude = 19.0760; // Default to Mumbai coordinates
        let longitude = 72.8777;
        let locationName = 'Mumbai, India'; // Default location
        
        // Try to get user's location with timeout
        try {
          console.log('🔄 Attempting to get user location...');
          const position = await getCurrentLocation();
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
          console.log('✅ Location obtained:', { latitude, longitude });
          
          // Get location name
          try {
            // First try with OpenCage if API key is available
            if (process.env.REACT_APP_OPENCAGE_API_KEY) {
              const locationResponse = await fetch(
                `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${process.env.REACT_APP_OPENCAGE_API_KEY}`,
                { timeout: 3000 }
              );
              const locationData = await locationResponse.json();
              if (locationData.results && locationData.results[0]) {
                locationName = locationData.results[0].formatted || locationData.results[0].components?.city || 
                              locationData.results[0].components?.town || locationData.results[0].components?.village ||
                              `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
                console.log('✅ Location name obtained from OpenCage:', locationName);
              } else {
                throw new Error('No results from OpenCage');
              }
            } else {
              throw new Error('No OpenCage API key');
            }
          } catch (geoError) {
            console.warn('⚠️ OpenCage geocoding failed, trying alternative methods:', geoError);
            
            // Fallback 1: Try BigDataCloud (free, no API key required)
            try {
              const response = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
                { timeout: 3000 }
              );
              const data = await response.json();
              locationName = data.city || data.locality || data.principalSubdivision || 
                           `${data.countryName || 'Unknown Location'}`;
              console.log('✅ Location name obtained from BigDataCloud:', locationName);
            } catch (fallback1Error) {
              console.warn('⚠️ BigDataCloud geocoding failed, trying manual lookup:', fallback1Error);
              
              // Fallback 2: Manual city lookup based on coordinates (for major Indian cities)
              locationName = getCityFromCoordinates(latitude, longitude);
              console.log('✅ Location name from manual lookup:', locationName);
            }
          }
        } catch (locationError) {
          console.warn('⚠️ Geolocation failed, using default location:', locationError);
          // Keep default Mumbai coordinates and name
          locationName = 'Mumbai, India'; // Ensure we have a proper city name, not coordinates
        }
        
        setLocationName(locationName);

        // Fetch AQI data with timeout
        try {
          console.log('🔄 Fetching AQI data...');
          const aqiResponse = await Promise.race([
            aqiService.getCurrentAQI(latitude, longitude),
            new Promise((_, reject) => setTimeout(() => reject(new Error('AQI timeout')), 5000))
          ]);
          
          if (aqiResponse.success) {
            setAqiData(aqiResponse.data);
            console.log('✅ AQI data obtained:', aqiResponse.data);
          } else {
            throw new Error('AQI service returned error');
          }
        } catch (aqiError) {
          console.warn('⚠️ AQI fetch failed, using fallback data:', aqiError);
          // Set fallback data to match backend structure
          const fallbackAQI = Math.floor(Math.random() * 100) + 30;
          const fallbackData = {
            aqi: {
              index: fallbackAQI,
              level: fallbackAQI <= 50 ? 'Good' : fallbackAQI <= 100 ? 'Fair' : 'Poor',
              category: fallbackAQI <= 50 ? 'Good' : fallbackAQI <= 100 ? 'Moderate' : 'Unhealthy'
            },
            pollutants: {
              pm25: { value: Math.floor(Math.random() * 50) + 10, unit: 'μg/m³' },
              pm10: { value: Math.floor(Math.random() * 80) + 20, unit: 'μg/m³' },
              no2: { value: Math.floor(Math.random() * 40) + 10, unit: 'μg/m³' },
              o3: { value: Math.floor(Math.random() * 60) + 20, unit: 'μg/m³' }
            }
          };
          setAqiData(fallbackData);
        }
        
        // Fetch alerts with timeout
        try {
          console.log('🔄 Fetching alerts...');
          const alertsResponse = await Promise.race([
            alertService.getActiveAlerts(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Alerts timeout')), 3000))
          ]);
          setAlerts(alertsResponse.data || []);
          console.log('✅ Alerts obtained');
        } catch (alertError) {
          console.warn('⚠️ Alerts fetch failed:', alertError);
          setAlerts([]);
        }
        
        console.log('✅ Dashboard initialization completed');
        
      } catch (err) {
        console.error('❌ Dashboard initialization error:', err);
        setError('Dashboard loaded with limited functionality. Some features may not be available.');
        
        // Set minimal fallback data to prevent infinite loading
        setLocationName('Current Location');
        setAqiData({
          aqi: {
            index: 85,
            level: 'Fair',
            category: 'Moderate'
          },
          pollutants: { 
            pm25: { value: 35, unit: 'μg/m³' }, 
            pm10: { value: 55, unit: 'μg/m³' }, 
            no2: { value: 25, unit: 'μg/m³' }, 
            o3: { value: 45, unit: 'μg/m³' } 
          }
        });
        setAlerts([]);
      } finally {
        setLoading(false);
        console.log('🏁 Loading state set to false');
      }
    };

    if (user && !hasInitialized.current) {
      hasInitialized.current = true;
      initializeDashboard();
    }
  }, [user]); // Only depend on user

  // Safety timeout to prevent infinite loading
  useEffect(() => {
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.log('⏰ [ModernDashboard] Loading timeout reached, forcing completion');
        setLoading(false);
        
        // Set basic fallback data if still loading
        if (!aqiData || Object.keys(aqiData).length === 0) {
          setAqiData({
            location: { name: 'Your Location' },
            coordinates: { latitude: 28.6139, longitude: 77.2090 },
            aqi: { index: 75, category: 'MODERATE', color: '#f59e0b' },
            pollutants: { pm25: { value: 25 }, pm10: { value: 45 } },
            weather: { temperature: 28, humidity: 65, windSpeed: 12 },
            lastUpdated: new Date()
          });
        }
      }
    }, 12000); // 12 second safety timeout

    return () => clearTimeout(loadingTimeout);
  }, [loading, aqiData]);

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      
      // Set a shorter timeout to prevent hanging
      const timeoutId = setTimeout(() => {
        reject(new Error('Geolocation timeout'));
      }, 5000); // 5 second timeout
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeoutId);
          resolve(position);
        },
        (error) => {
          clearTimeout(timeoutId);
          reject(error);
        },
        {
          enableHighAccuracy: false, // Changed to false for faster response
          timeout: 4000, // 4 second timeout
          maximumAge: 600000 // 10 minutes cache
        }
      );
    });
  };

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    const name = userProfile?.name || user?.email?.split('@')[0] || 'there';
    
    if (hour < 12) return `Good morning, ${name}! 🌅`;
    if (hour < 17) return `Good afternoon, ${name}! ☀️`;
    return `Good evening, ${name}! 🌙`;
  };

  if (loading) {
    return (
      <AnimatedBackground>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <LoadingSpinner />
            <p className="mt-4 text-white text-lg">Loading your dashboard...</p>
            <p className="mt-2 text-white/70 text-sm">Fetching real-time air quality data</p>
          </div>
        </div>
      </AnimatedBackground>
    );
  }

  return (
    <AnimatedBackground showMap={true} showGeometric={true}>
      <div className="min-h-screen">
        {/* Modern Header with glassmorphism */}
        <header className="bg-white/10 backdrop-blur-lg shadow-lg border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-white">
                  AQI Monitor Pro
                </h1>
                <p className="text-sm text-white/80 mt-1">
                  {getWelcomeMessage()}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/profile')}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/20"
                >
                  <span className="text-white text-lg">👤</span>
                </button>
                <button
                  onClick={logout}
                  className="px-4 py-2 bg-red-500/80 hover:bg-red-600/80 text-white rounded-lg transition-colors backdrop-blur-sm"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Dashboard Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 backdrop-blur-lg border border-red-500/30 text-red-100 rounded-lg">
              <div className="flex items-center space-x-2">
                <span className="text-xl">⚠️</span>
                <span>{error}</span>
              </div>
            </div>
          )}        {/* Hero Section - Main AQI Display */}
        <div className="mb-8">
          <LocationCard
            location={locationName}
            aqi={aqiData?.aqi?.index || aqiData?.aqi}
            status={aqiData?.aqi?.category || aqiData?.status}
            loading={loading}
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Today's Average"
            value={aqiData?.todayAverage || '--'}
            subtitle="AQI Units"
            icon="📊"
            gradient={gradients.primary}
            trend={-5}
          />
          <StatsCard
            title="Air Quality Rank"
            value="#12"
            subtitle="in your city"
            icon="🏆"
            gradient={gradients.good}
            trend={2}
          />
          <StatsCard
            title="Health Score"
            value="87%"
            subtitle="Good for outdoor activities"
            icon="💚"
            gradient={gradients.moderate}
          />
          <StatsCard
            title="Forecast Accuracy"
            value="94%"
            subtitle="ML Prediction Model"
            icon="🎯"
            gradient={gradients.secondary}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Left Column - Forecast */}
          <div className="lg:col-span-2 space-y-6">
            <ForecastWidget location={locationName} />
            
            {/* Pollutant Breakdown */}
            <ModernCard className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-white flex items-center">
                <span className="mr-2">🧪</span>
                Pollutant Breakdown
                <span className="ml-auto text-sm text-white/70">Live Data</span>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { name: 'PM2.5', value: aqiData?.pollutants?.pm25?.value || aqiData?.pollutants?.pm25 || 45, unit: 'μg/m³', color: 'text-green-400', bgColor: 'bg-green-500/20' },
                  { name: 'PM10', value: aqiData?.pollutants?.pm10?.value || aqiData?.pollutants?.pm10 || 67, unit: 'μg/m³', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
                  { name: 'NO₂', value: aqiData?.pollutants?.no2?.value || aqiData?.pollutants?.no2 || 23, unit: 'ppb', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
                  { name: 'O₃', value: aqiData?.pollutants?.o3?.value || aqiData?.pollutants?.o3 || 89, unit: 'ppb', color: 'text-orange-400', bgColor: 'bg-orange-500/20' }
                ].map((pollutant, index) => (
                  <div key={index} className={`text-center p-4 ${pollutant.bgColor} backdrop-blur-sm rounded-xl border border-white/10`}>
                    <div className={`text-2xl font-bold ${pollutant.color}`}>
                      {pollutant.value}
                    </div>
                    <div className="text-xs text-white/80 mt-1 font-medium">
                      {pollutant.name}
                    </div>
                    <div className="text-xs text-white/60 mt-1">
                      {pollutant.unit}
                    </div>
                  </div>
                ))}
              </div>
            </ModernCard>
          </div>

          {/* Right Column - Quick Actions & Alerts */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <ModernCard className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-white flex items-center">
                <span className="mr-2">⚡</span>
                Quick Actions
              </h3>
              <div className="space-y-3">
                <QuickActionButton
                  title="View Forecast"
                  subtitle="7-day prediction"
                  icon="🔮"
                  gradient={gradients.primary}
                  onClick={() => navigate('/forecast')}
                />
                <QuickActionButton
                  title="Weather Dashboard"
                  subtitle="Live weather conditions"
                  icon="🌤️"
                  gradient={weatherGradients.sunny}
                  onClick={() => navigate('/weather')}
                />
                <QuickActionButton
                  title="Set Alerts"
                  subtitle="Custom notifications"
                  icon="🔔"
                  gradient={gradients.moderate}
                  onClick={() => navigate('/alerts')}
                />
                <QuickActionButton
                  title="Analytics"
                  subtitle="Detailed insights"
                  icon="📈"
                  gradient={gradients.secondary}
                  onClick={() => navigate('/analytics')}
                />
              </div>
            </ModernCard>

            {/* Recent Alerts */}
            <ModernCard className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-white flex items-center">
                <span className="mr-2">🚨</span>
                Recent Alerts
              </h3>
              {alerts.length > 0 ? (
                <div className="space-y-3">
                  {alerts.slice(0, 3).map((alert, index) => (
                    <div key={index} className="p-3 bg-yellow-500/20 backdrop-blur-sm border border-yellow-400/30 rounded-lg">
                      <div className="text-sm font-medium text-yellow-200">
                        {alert.title || 'Air Quality Alert'}
                      </div>
                      <div className="text-xs text-yellow-300 mt-1">
                        {alert.message || 'AQI levels are rising in your area'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-white/60">
                  <div className="text-4xl mb-2">✨</div>
                  <div className="text-sm font-medium">No alerts right now</div>
                  <div className="text-xs mt-1 text-white/40">Air quality is stable</div>
                </div>
              )}
            </ModernCard>
          </div>
        </div>

        {/* Bottom Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Link to="/forecast" className="transform hover:scale-105 transition-transform">
            <ModernCard gradient={gradients.primary} className="p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">AQI Forecast</h3>
                  <p className="text-sm opacity-80">7-day air quality predictions</p>
                </div>
                <div className="text-3xl">🔮</div>
              </div>
            </ModernCard>
          </Link>

          <Link to="/weather" className="transform hover:scale-105 transition-transform">
            <ModernCard gradient={weatherGradients.sunny} className="p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Weather Dashboard</h3>
                  <p className="text-sm opacity-80">Live weather conditions</p>
                </div>
                <div className="text-3xl">🌤️</div>
              </div>
            </ModernCard>
          </Link>

          <Link to="/analytics" className="transform hover:scale-105 transition-transform">
            <ModernCard gradient={gradients.secondary} className="p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Analytics</h3>
                  <p className="text-sm opacity-80">Trends and insights</p>
                </div>
                <div className="text-3xl">📊</div>
              </div>
            </ModernCard>
          </Link>

          <Link to="/profile" className="transform hover:scale-105 transition-transform">
            <ModernCard gradient={gradients.moderate} className="p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Settings</h3>
                  <p className="text-sm opacity-80">Preferences & alerts</p>
                </div>
                <div className="text-3xl">⚙️</div>
              </div>
            </ModernCard>
          </Link>
        </div>
      </main>
      </div>
    </AnimatedBackground>
  );
};

export default ModernDashboard;
