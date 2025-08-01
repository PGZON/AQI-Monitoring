/**
 * Modern Weather Dashboard Component
 * Matches the AQI Land design with glassmorphism theme
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AnimatedBackground from './AnimatedBackground';
import OpenStreetMap from './OpenStreetMap';

// Modern card component with glassmorphism and enhanced hover effects
const WeatherCard = ({ children, className = '', gradient = '', onClick }) => (
  <div 
    className={`
      backdrop-blur-lg bg-white/10 rounded-2xl border border-white/20 
      shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105
      transform hover:bg-white/15 cursor-pointer group
      ${gradient} ${className}
    `}
    onClick={onClick}
  >
    {children}
  </div>
);

// Enhanced weather icon mapping with more conditions
const getWeatherIcon = (condition, isDay = true) => {
  const conditionLower = condition?.toLowerCase() || '';
  
  // Rain conditions
  if (conditionLower.includes('rain') || conditionLower.includes('shower')) {
    if (conditionLower.includes('heavy') || conditionLower.includes('storm')) return '🌧️⛈️';
    if (conditionLower.includes('light') || conditionLower.includes('drizzle')) return '🌦️';
    return '🌧️';
  }
  
  // Thunderstorm conditions
  if (conditionLower.includes('thunder') || conditionLower.includes('storm')) {
    return '⛈️';
  }
  
  // Snow conditions
  if (conditionLower.includes('snow') || conditionLower.includes('blizzard')) {
    return '❄️';
  }
  
  // Cloud conditions
  if (conditionLower.includes('overcast')) return '☁️';
  if (conditionLower.includes('partly') && conditionLower.includes('cloud')) {
    return isDay ? '⛅' : '🌙☁️';
  }
  if (conditionLower.includes('cloud')) return '☁️';
  
  // Clear conditions
  if (conditionLower.includes('clear') || conditionLower.includes('sunny')) {
    return isDay ? '☀️' : '🌙';
  }
  
  // Fog/Mist conditions
  if (conditionLower.includes('fog') || conditionLower.includes('mist') || conditionLower.includes('haze')) {
    return '🌫️';
  }
  
  // Wind conditions
  if (conditionLower.includes('wind')) return '💨';
  
  // Default mapping
  const icons = {
    'clear': isDay ? '☀️' : '🌙',
    'sunny': '☀️',
    'cloudy': '☁️',
    'clouds': '☁️',
    'partly-cloudy': isDay ? '⛅' : '🌙☁️',
    'overcast': '☁️',
    'rainy': '🌧️',
    'rain': '🌧️',
    'drizzle': '🌦️',
    'thunderstorm': '⛈️',
    'snow': '❄️',
    'fog': '🌫️',
    'mist': '🌫️',
    'windy': '💨',
    'hot': '🔥',
    'cold': '🥶'
  };
  
  return icons[conditionLower] || (isDay ? '🌤️' : '🌙');
};

// Get weather condition with rain indicator
const getWeatherConditionText = (condition) => {
  const conditionLower = condition?.toLowerCase() || '';
  
  if (conditionLower.includes('rain') || conditionLower.includes('shower')) {
    return `�️ ${condition}`;
  }
  if (conditionLower.includes('thunder') || conditionLower.includes('storm')) {
    return `⛈️ ${condition}`;
  }
  if (conditionLower.includes('snow')) {
    return `❄️ ${condition}`;
  }
  if (conditionLower.includes('fog') || conditionLower.includes('mist')) {
    return `🌫️ ${condition}`;
  }
  
  return condition;
};

// Weather Hero Section - Main temperature display with character and map
const WeatherHeroSection = ({ location, weatherData, aqiData, getCurrentLocation, setShowMap, showMap, cityName }) => {
  const navigate = useNavigate();

  const getTemperatureLevel = (temp) => {
    if (temp >= 35) return 'Very Hot';
    if (temp >= 30) return 'Hot';
    if (temp >= 25) return 'Warm';
    if (temp >= 20) return 'Pleasant';
    if (temp >= 15) return 'Cool';
    return 'Cold';
  };

  return (
    <div className="mb-8 relative">
      {/* Tab Navigation - Fixed to navigate between dashboards */}
      <div className="mb-6 flex space-x-2">
        <button 
          onClick={() => navigate('/dashboard')}
          className="px-6 py-2 bg-slate-600/50 text-slate-300 rounded-l-lg border border-slate-500/50 hover:bg-slate-500/50 transition-colors flex items-center space-x-2"
        >
          <span>🌫️</span>
          <span>AQI</span>
        </button>
        <button className="px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-r-lg border border-orange-400 font-medium flex items-center space-x-2 shadow-lg">
          <span>☀️</span>
          <span>Weather</span>
        </button>
      </div>

      {/* Main Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-500 via-green-500 to-blue-600 p-8">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-r from-teal-400/20 via-transparent to-blue-400/20"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Side - Weather Info */}
          <div className="lg:col-span-7">
            {/* Location Actions */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  📍 {cityName || location?.split(',')[0] || 'Your Location'} Weather Conditions
                </h1>
                <p className="text-xl text-white/90 flex items-center space-x-2">
                  <span>Current Temperature Level</span>
                  {weatherData?.condition && (
                    <span className="text-2xl">
                      {getWeatherIcon(weatherData.condition, weatherData.isDay)}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button 
                  onClick={getCurrentLocation}
                  className="px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white rounded-lg hover:bg-white/30 transition-colors flex items-center space-x-2"
                >
                  <span>📍</span>
                  <span>Locate me</span>
                </button>
                <button 
                  onClick={() => setShowMap(!showMap)}
                  className="px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white rounded-lg hover:bg-white/30 transition-colors flex items-center space-x-2"
                >
                  <span>🗺️</span>
                  <span>Map</span>
                </button>
                <button className="p-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white rounded-lg hover:bg-white/30 transition-colors">
                  <span>💝</span>
                </button>
                <button className="p-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white rounded-lg hover:bg-white/30 transition-colors">
                  <span>🔗</span>
                </button>
              </div>
            </div>

            {/* Main Weather Display */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Temperature */}
              <div>
                <div className="text-8xl font-bold text-white mb-4">
                  {weatherData?.temperature || '27'}
                  <span className="text-4xl">°C</span>
                </div>
                <div className="space-y-2 text-white/90">
                  <div className="flex items-center space-x-4">
                    <span className="text-2xl">{getWeatherIcon(weatherData?.condition, weatherData?.isDay)}</span>
                    <span className="text-lg">{getWeatherConditionText(weatherData?.condition) || 'Mist'}</span>
                  </div>
                  <div className="text-sm">
                    Feels Like <span className="font-semibold">{(weatherData?.temperature || 27) + 4}°C</span>
                  </div>
                  <div className="text-sm">
                    Humidity: <span className="font-semibold">{weatherData?.humidity || '84'}%</span>
                  </div>
                </div>
                
                <div className="mt-4">
                  <span className="px-4 py-2 bg-blue-400/30 backdrop-blur-sm rounded-full text-white text-sm font-medium">
                    {getTemperatureLevel(weatherData?.temperature || 27)}
                  </span>
                </div>
              </div>

              {/* Character Illustration */}
              <div className="flex justify-center">
                <div className="relative">
                  {/* Character */}
                  <div className="text-9xl filter drop-shadow-lg">
                    👦
                  </div>
                  {/* Floating weather elements */}
                  <div className="absolute -top-4 -left-4 text-2xl animate-bounce">☁️</div>
                  <div className="absolute -top-2 -right-2 text-xl animate-pulse">💨</div>
                </div>
              </div>
            </div>

            {/* Last Updated */}
            <div className="mt-6 text-white/80 text-sm">
              Last Updated: {new Date().toLocaleString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              })} (Local Time)
            </div>
          </div>

          {/* Right Side - AQI Card */}
          <div className="lg:col-span-5 flex justify-end">
            <div className="bg-yellow-500/90 backdrop-blur-sm rounded-2xl p-6 border border-yellow-400/50 min-w-[280px]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Air Quality Index</h3>
                <button className="p-2 bg-white/20 rounded-full text-white hover:bg-white/30 transition-colors">
                  <span>↗️</span>
                </button>
              </div>
              
              <div className="text-center mb-4">
                <div className="text-5xl font-bold text-white mb-2">
                  {aqiData?.aqi?.index || '74'}
                  <span className="text-lg ml-1">AQI</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-white text-sm">
                <div>
                  <div className="font-medium">PM2.5:</div>
                  <div className="text-2xl font-bold">{aqiData?.pollutants?.pm25?.value || '22'}</div>
                </div>
                <div>
                  <div className="font-medium">PM10:</div>
                  <div className="text-2xl font-bold">{aqiData?.pollutants?.pm10?.value || '56'}</div>
                </div>
              </div>
              
              <div className="mt-4 text-center">
                <div className="text-white text-sm">
                  Air quality index is: <span className="font-bold">{aqiData?.aqi?.category || 'MODERATE'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mini Map Preview */}
      <div className="absolute top-16 right-4 w-80 h-48 bg-slate-800/90 backdrop-blur-lg rounded-xl border border-slate-700/50 overflow-hidden">
        <div className="p-3 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <span className="text-blue-400 text-sm font-medium">�️ AQI Map</span>
            <button className="text-white hover:text-blue-400 transition-colors">
              <span>⛶</span>
            </button>
          </div>
        </div>
        <div className="relative h-full bg-slate-900">
          {/* Map Grid Pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="grid grid-cols-8 grid-rows-6 h-full">
              {Array.from({ length: 48 }, (_, i) => (
                <div key={i} className="border border-slate-600/30"></div>
              ))}
            </div>
          </div>
          
          {/* AQI Points */}
          <div className="absolute inset-0 p-4">
            {/* Sample AQI markers */}
            <div className="absolute top-4 left-8 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">91</div>
            <div className="absolute top-8 left-16 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">84</div>
            <div className="absolute top-12 left-24 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xs font-bold">74</div>
            <div className="absolute top-6 left-32 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">33</div>
            <div className="absolute top-16 left-20 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">94</div>
            <div className="absolute bottom-8 left-12 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">82</div>
            <div className="absolute bottom-4 right-16 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xs font-bold">67</div>
          </div>
          
          <div className="absolute bottom-2 left-2 text-white text-xs">
            📍 {location?.split(',')[0] || 'Nagpur'}
          </div>
        </div>
      </div>
    </div>
  );
};

// Hourly forecast component
const HourlyForecast = ({ forecasts = [] }) => {
  return (
    <WeatherCard className="p-6">
      <h3 className="text-lg font-semibold mb-4 text-white flex items-center">
        <span className="mr-2">⏰</span>
        24-Hour Forecast
        <span className="ml-auto text-sm text-white/70">Hourly</span>
      </h3>
      
      <div className="flex space-x-3 overflow-x-auto pb-2">
        {forecasts.map((forecast, index) => (
          <div key={index} className="flex-shrink-0 text-center p-4 bg-slate-700/50 backdrop-blur-sm rounded-xl border border-slate-600/50 min-w-[80px]">
            <div className="text-sm text-slate-300 mb-2 font-medium">
              {forecast.time}
            </div>
            <div className="text-2xl mb-2">
              {getWeatherIcon(forecast.condition)}
            </div>
            <div className="text-lg font-bold text-white mb-1">
              {forecast.temp}°
            </div>
            <div className="text-xs text-slate-400">
              {forecast.condition}
            </div>
          </div>
        ))}
      </div>
    </WeatherCard>
  );
};

// Weekly forecast component
const WeeklyForecast = ({ forecasts = [] }) => {
  return (
    <WeatherCard className="p-6">
      <h3 className="text-lg font-semibold mb-4 text-white flex items-center">
        <span className="mr-2">📅</span>
        7-Day Forecast
      </h3>
      
      <div className="space-y-3">
        {forecasts.map((forecast, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-slate-700/50 backdrop-blur-sm rounded-xl border border-slate-600/50">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">{getWeatherIcon(forecast.condition)}</div>
              <div>
                <div className="font-medium text-white">
                  {forecast.day}
                </div>
                <div className="text-sm text-slate-400">
                  {forecast.condition}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-lg font-bold text-white">
                  {forecast.high}°
                </div>
                <div className="text-sm text-slate-400">
                  {forecast.low}°
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </WeatherCard>
  );
};

// Wind Speed Card Component
const WindSpeedCard = ({ windSpeed, gustSpeed, direction }) => (
  <WeatherCard className="p-6 bg-slate-800/90 backdrop-blur-lg border border-slate-700/50">
    <div className="text-center mb-4">
      <div className="flex justify-center mb-3">
        <div className="text-6xl text-blue-400">💨</div>
      </div>
      <div className="text-slate-300 text-sm font-medium mb-2">Wind Speed</div>
      <div className="text-4xl font-bold text-white mb-1">{windSpeed || '11'}</div>
      <div className="text-slate-400 text-sm">km/h</div>
      <div className="mt-3 px-3 py-1 bg-blue-500/20 rounded-full text-blue-300 text-xs inline-block">
        Light breeze
      </div>
    </div>
    
    <div className="grid grid-cols-2 gap-4 mt-6">
      <div className="text-center">
        <div className="text-slate-400 text-xs mb-1">Gust Speed</div>
        <div className="flex items-center justify-center space-x-1">
          <span className="text-orange-400 text-lg">🌪️</span>
          <span className="text-white font-semibold">{gustSpeed || '6'}</span>
          <span className="text-slate-400 text-xs">m/s</span>
        </div>
      </div>
      <div className="text-center">
        <div className="text-slate-400 text-xs mb-1">Direction</div>
        <div className="flex items-center justify-center space-x-1">
          <span className="text-blue-400 text-lg">🧭</span>
          <span className="text-white font-semibold">{direction || '290°'}</span>
          <span className="text-slate-400 text-xs">WNW</span>
        </div>
      </div>
    </div>
    
    <div className="mt-4 text-xs text-slate-400 text-center">
      Current wind speed is {windSpeed || '11'} km/h, with gusts at {gustSpeed || '6'} m/s
    </div>
  </WeatherCard>
);

// Cloud Cover & Visibility Card
const CloudVisibilityCard = ({ cloudCover, visibility }) => (
  <WeatherCard className="p-6 bg-slate-800/90 backdrop-blur-lg border border-slate-700/50">
    <div className="flex justify-center mb-4">
      <div className="text-6xl">☁️</div>
    </div>
    
    <div className="grid grid-cols-2 gap-6">
      <div className="text-center">
        <div className="text-slate-300 text-sm font-medium mb-2">Cloud Cover</div>
        <div className="text-3xl font-bold text-white mb-1">{cloudCover || '75'}<span className="text-lg">%</span></div>
      </div>
      <div className="text-center">
        <div className="text-slate-300 text-sm font-medium mb-2">Visibility</div>
        <div className="text-3xl font-bold text-white mb-1">{visibility || '4'}</div>
        <div className="text-slate-400 text-sm">km</div>
      </div>
    </div>
    
    <div className="mt-4 text-xs text-slate-400 text-center">
      Recent visibility is {visibility || '4'}km with {cloudCover || '75'}% cloud coverage, so plan accordingly!
    </div>
  </WeatherCard>
);

// Precipitation Card
const PrecipitationCard = ({ precipitation, precipitationType }) => (
  <WeatherCard className="p-6 bg-slate-800/90 backdrop-blur-lg border border-slate-700/50">
    <div className="text-center">
      <div className="text-slate-300 text-sm font-medium mb-4">Precipitation</div>
      <div className="flex justify-center mb-4">
        <div className="relative">
          <div className="text-5xl">🌧️</div>
          <div className="absolute -bottom-1 -right-1 text-2xl">☀️</div>
        </div>
      </div>
      <div className="text-4xl font-bold text-white mb-1">{precipitation || '0.07'}</div>
      <div className="text-slate-400 text-sm">mm</div>
      
      <div className="mt-4 text-xs text-slate-400 text-center">
        Current precipitation is light with {precipitation || '0.07'}mm expected
      </div>
    </div>
  </WeatherCard>
);

// Pressure Card with Gauge
const PressureCard = ({ pressure, pressureLevel }) => (
  <WeatherCard className="p-6 bg-slate-800/90 backdrop-blur-lg border border-slate-700/50">
    <div className="text-slate-300 text-sm font-medium mb-4">Pressure</div>
    
    <div className="flex justify-center mb-4">
      <div className="relative w-24 h-24">
        {/* Pressure Gauge Background */}
        <div className="absolute inset-0 rounded-full border-8 border-slate-600"></div>
        {/* Pressure Gauge Fill */}
        <div className="absolute inset-0 rounded-full border-8 border-t-red-500 border-r-yellow-500 border-b-green-500 border-l-blue-500 transform rotate-45"></div>
        {/* Center dot */}
        <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-red-500 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
      </div>
    </div>
    
    <div className="text-center">
      <div className="text-4xl font-bold text-white mb-1">{pressure || '1006'}</div>
      <div className="text-slate-400 text-sm mb-3">mb</div>
      <div className="px-3 py-1 bg-pink-500/20 rounded-full text-pink-300 text-xs inline-block">
        {pressureLevel || 'Moderate'}
      </div>
    </div>
    
    <div className="mt-4">
      <div className="h-2 bg-gradient-to-r from-green-500 via-yellow-500 via-red-500 to-purple-500 rounded-full mb-2"></div>
      <div className="text-xs text-slate-400 text-center">
        Current pressure level is {pressure || '1006'} mb.
      </div>
    </div>
  </WeatherCard>
);

// UV Index Card
const UVIndexCard = ({ uvIndex, uvLevel }) => (
  <WeatherCard className="p-6 bg-slate-800/90 backdrop-blur-lg border border-slate-700/50">
    <div className="text-slate-300 text-sm font-medium mb-4">UV Index</div>
    
    <div className="flex justify-center mb-4">
      <div className="w-16 h-16 bg-gradient-to-b from-yellow-300 to-orange-500 rounded-full flex items-center justify-center">
        <div className="text-2xl">☀️</div>
      </div>
    </div>
    
    <div className="text-center">
      <div className="text-slate-300 text-sm mb-2">UV Index</div>
      <div className="text-5xl font-bold text-white mb-3">{uvIndex || '0'}</div>
      
      <div className="mb-4">
        <div className="h-2 bg-gradient-to-r from-green-400 via-yellow-400 via-orange-400 to-red-500 rounded-full mb-2"></div>
        <div className="px-3 py-1 bg-green-500/20 rounded-full text-green-300 text-xs inline-block">
          {uvLevel || 'Low'}
        </div>
      </div>
    </div>
  </WeatherCard>
);

// Suggestions Card
const SuggestionsCard = ({ location, date }) => (
  <WeatherCard className="p-6 bg-slate-800/90 backdrop-blur-lg border border-slate-700/50">
    <div className="mb-4">
      <div className="text-slate-300 text-sm font-medium">Suggestions for</div>
      <div className="text-blue-400 font-semibold">{location || 'Nagpur'}</div>
      <div className="text-slate-400 text-sm">{date || 'Today'}</div>
      <div className="text-slate-400 text-sm">{new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) || '1 Aug.'}</div>
    </div>
    
    <div className="grid grid-cols-2 gap-4">
      <div className="text-center p-3 bg-slate-700/50 rounded-lg">
        <div className="text-3xl mb-2">☂️</div>
        <div className="text-white text-sm font-medium">Umbrella</div>
        <div className="text-green-400 text-xs">Suggested</div>
      </div>
      <div className="text-center p-3 bg-slate-700/50 rounded-lg">
        <div className="text-3xl mb-2">👕</div>
        <div className="text-white text-sm font-medium">Clothing</div>
        <div className="text-blue-400 text-xs">Breathable</div>
      </div>
      <div className="text-center p-3 bg-slate-700/50 rounded-lg">
        <div className="text-3xl mb-2">🚗</div>
        <div className="text-white text-sm font-medium">Driving</div>
        <div className="text-green-400 text-xs">Enjoy Driving</div>
      </div>
      <div className="text-center p-3 bg-slate-700/50 rounded-lg">
        <div className="text-3xl mb-2">🧴</div>
        <div className="text-white text-sm font-medium">Sunscreen</div>
        <div className="text-blue-400 text-xs">Apply</div>
      </div>
    </div>
  </WeatherCard>
);

// Main Weather Dashboard Component
const WeatherDashboard = ({ location = 'Your Location' }) => {
  const [weatherData, setWeatherData] = useState(null);
  const [aqiData, setAqiData] = useState(null);
  const [hourlyForecast, setHourlyForecast] = useState([]);
  const [weeklyForecast, setWeeklyForecast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [coordinates, setCoordinates] = useState({ lat: null, lon: null });
  const [showMap, setShowMap] = useState(false);
  const [cityName, setCityName] = useState('Your Location');
  const [locationDetails, setLocationDetails] = useState(null);

  const getCurrentLocation = () => {
    console.log('🌍 [WeatherDashboard] Getting current location...');
    
    if (navigator.geolocation) {
      // Add timeout to prevent infinite waiting
      const timeoutId = setTimeout(() => {
        console.log('⏰ [WeatherDashboard] Geolocation timeout, using fallback coordinates');
        setCoordinates({
          lat: 28.6139,
          lon: 77.2090
        });
      }, 10000); // 10 second timeout

      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeoutId);
          console.log('✅ [WeatherDashboard] Location obtained:', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setCoordinates({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        (error) => {
          clearTimeout(timeoutId);
          console.error('❌ [WeatherDashboard] Error getting location:', error);
          console.log('🔄 [WeatherDashboard] Using fallback coordinates (Delhi)');
          // Fallback to Delhi coordinates
          setCoordinates({
            lat: 28.6139,
            lon: 77.2090
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 600000 // 10 minutes
        }
      );
    } else {
      console.log('❌ [WeatherDashboard] Geolocation not supported, using fallback coordinates');
      // Fallback to Delhi coordinates
      setCoordinates({
        lat: 28.6139,
        lon: 77.2090
      });
    }
  };

  // Function to get city name from coordinates
  const getCityName = async (lat, lon) => {
    try {
      console.log('🌍 [WeatherDashboard] Getting city name for:', { lat, lon });
      
      // Try multiple geocoding services
      const geocodingServices = [
        // BigDataCloud (free, no API key needed)
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
        
        // Nominatim (OpenStreetMap, free)
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`
      ];

      for (const serviceUrl of geocodingServices) {
        try {
          const response = await fetch(serviceUrl);
          if (response.ok) {
            const data = await response.json();
            
            if (serviceUrl.includes('bigdatacloud')) {
              const city = data.city || data.locality || data.principalSubdivision || 'Unknown City';
              const country = data.countryName || '';
              setCityName(`${city}${country ? `, ${country}` : ''}`);
              setLocationDetails(data);
              console.log('✅ [WeatherDashboard] City name from BigDataCloud:', city);
              return city;
            } else if (serviceUrl.includes('nominatim')) {
              const address = data.address || {};
              const city = address.city || address.town || address.village || address.state || 'Unknown City';
              const country = address.country || '';
              setCityName(`${city}${country ? `, ${country}` : ''}`);
              setLocationDetails(data);
              console.log('✅ [WeatherDashboard] City name from Nominatim:', city);
              return city;
            }
          }
        } catch (serviceError) {
          console.warn('⚠️ [WeatherDashboard] Geocoding service failed:', serviceError);
        }
      }
      
      // Fallback city name
      setCityName('Your Location'); 
      return 'Your Location';
    } catch (error) {
      console.error('❌ [WeatherDashboard] Error getting city name:', error);
      setCityName('Your Location');
      return 'Your Location';
    }
  };

  const loadWeatherData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🌤️ [WeatherDashboard] Starting weather data fetch...');
      console.log('🌤️ [WeatherDashboard] Coordinates:', coordinates);
      
      // Get city name first
      await getCityName(coordinates.lat, coordinates.lon);
      
      const baseURL = 'http://localhost:5000/api';
      const currentWeatherURL = `${baseURL}/weather/current?lat=${coordinates.lat}&lon=${coordinates.lon}`;
      console.log('🌤️ [WeatherDashboard] Current weather API URL:', currentWeatherURL);
      
      // Fetch current weather from backend
      const currentResponse = await fetch(currentWeatherURL);
      console.log('🌤️ [WeatherDashboard] Current weather response status:', currentResponse.status);
      console.log('🌤️ [WeatherDashboard] Current weather response headers:', currentResponse.headers);
      
      if (currentResponse.ok) {
        const responseText = await currentResponse.text();
        console.log('🌤️ [WeatherDashboard] Raw response text:', responseText);
        
        try {
          const currentData = JSON.parse(responseText);
          console.log('🌤️ [WeatherDashboard] Parsed current weather data:', currentData);
          
          setWeatherData({
            temperature: Math.round(currentData.data.temperature),
            condition: currentData.data.description || currentData.data.condition,
            humidity: currentData.data.humidity,
            windSpeed: Math.round(currentData.data.windSpeed),
            visibility: currentData.data.visibility || 10,
            pressure: currentData.data.pressure,
            isDay: new Date().getHours() >= 6 && new Date().getHours() < 18
          });
          console.log('✅ [WeatherDashboard] Weather data updated successfully');
        } catch (parseError) {
          console.error('❌ [WeatherDashboard] JSON parse error:', parseError);
          console.error('❌ [WeatherDashboard] Response was not valid JSON:', responseText);
          throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}...`);
        }
      } else {
        const errorText = await currentResponse.text();
        console.error('❌ [WeatherDashboard] Current weather API failed with status:', currentResponse.status);
        console.error('❌ [WeatherDashboard] Error response:', errorText);
        
        // Fallback to mock data if API fails
        console.log('🔄 [WeatherDashboard] Using fallback mock data');
        setWeatherData({
          temperature: Math.floor(Math.random() * 20) + 15,
          condition: ['Clear', 'Sunny', 'Partly Cloudy', 'Cloudy', 'Rainy', 'Mist'][Math.floor(Math.random() * 6)],
          humidity: Math.floor(Math.random() * 40) + 40,
          windSpeed: Math.floor(Math.random() * 15) + 5,
          visibility: Math.floor(Math.random() * 5) + 5,
          pressure: Math.floor(Math.random() * 100) + 1000,
          isDay: new Date().getHours() >= 6 && new Date().getHours() < 18
        });
      }

      // Fetch hourly forecast
      const hourlyForecastURL = `${baseURL}/weather/hourly?lat=${coordinates.lat}&lon=${coordinates.lon}`;
      console.log('🌤️ [WeatherDashboard] Hourly forecast API URL:', hourlyForecastURL);
      
      const hourlyResponse = await fetch(hourlyForecastURL);
      console.log('🌤️ [WeatherDashboard] Hourly forecast response status:', hourlyResponse.status);
      
      if (hourlyResponse.ok) {
        const hourlyResponseText = await hourlyResponse.text();
        console.log('🌤️ [WeatherDashboard] Raw hourly response:', hourlyResponseText);
        
        try {
          const hourlyData = JSON.parse(hourlyResponseText);
          console.log('🌤️ [WeatherDashboard] Parsed hourly forecast data:', hourlyData);
          setHourlyForecast(hourlyData.data.slice(0, 8));
          console.log('✅ [WeatherDashboard] Hourly forecast updated successfully');
        } catch (parseError) {
          console.error('❌ [WeatherDashboard] Hourly forecast JSON parse error:', parseError);
          throw new Error(`Invalid hourly forecast JSON: ${hourlyResponseText.substring(0, 100)}...`);
        }
      } else {
        const hourlyErrorText = await hourlyResponse.text();
        console.error('❌ [WeatherDashboard] Hourly forecast API failed:', hourlyErrorText);
        console.log('🔄 [WeatherDashboard] Using fallback hourly data');
        
        // Mock hourly forecast
        setHourlyForecast(Array.from({ length: 8 }, (_, i) => ({
          time: new Date(Date.now() + i * 3 * 60 * 60 * 1000).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            hour12: true 
          }),
          temp: Math.floor(Math.random() * 15) + 20,
          condition: ['Clear', 'Sunny', 'Cloudy', 'Rainy'][Math.floor(Math.random() * 4)]
        })));
      }

      // Fetch weekly forecast
      const weeklyForecastURL = `${baseURL}/weather/forecast?lat=${coordinates.lat}&lon=${coordinates.lon}`;
      console.log('🌤️ [WeatherDashboard] Weekly forecast API URL:', weeklyForecastURL);
      
      const forecastResponse = await fetch(weeklyForecastURL);
      console.log('🌤️ [WeatherDashboard] Weekly forecast response status:', forecastResponse.status);
      
      if (forecastResponse.ok) {
        const forecastResponseText = await forecastResponse.text();
        console.log('🌤️ [WeatherDashboard] Raw weekly response:', forecastResponseText);
        
        try {
          const forecastData = JSON.parse(forecastResponseText);
          console.log('🌤️ [WeatherDashboard] Parsed weekly forecast data:', forecastData);
          setWeeklyForecast(forecastData.data.slice(0, 7));
          console.log('✅ [WeatherDashboard] Weekly forecast updated successfully');
        } catch (parseError) {
          console.error('❌ [WeatherDashboard] Weekly forecast JSON parse error:', parseError);
          throw new Error(`Invalid weekly forecast JSON: ${forecastResponseText.substring(0, 100)}...`);
        }
      } else {
        const forecastErrorText = await forecastResponse.text();
        console.error('❌ [WeatherDashboard] Weekly forecast API failed:', forecastErrorText);
        console.log('🔄 [WeatherDashboard] Using fallback weekly data');
        
        // Mock weekly forecast
        setWeeklyForecast([
          'Today', 'Tomorrow', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'
        ].map(day => ({
          day,
          high: Math.floor(Math.random() * 15) + 25,
          low: Math.floor(Math.random() * 10) + 15,
          condition: ['Clear', 'Sunny', 'Cloudy', 'Rainy'][Math.floor(Math.random() * 4)]
        })));
      }

      // Mock AQI data
      console.log('🌤️ [WeatherDashboard] Setting mock AQI data');
      setAqiData({
        aqi: {
          index: Math.floor(Math.random() * 50) + 50,
          category: 'MODERATE'
        },
        pollutants: {
          pm25: { value: Math.floor(Math.random() * 30) + 15 },
          pm10: { value: Math.floor(Math.random() * 40) + 30 }
        }
      });
      
      console.log('✅ [WeatherDashboard] Weather data loading completed successfully');
      
    } catch (err) {
      console.error('❌ [WeatherDashboard] Weather loading error:', err);
      console.error('❌ [WeatherDashboard] Error stack:', err.stack);
      setError(`Failed to load weather data: ${err.message}`);
      
      // Set comprehensive fallback data on error
      console.log('🔄 [WeatherDashboard] Setting comprehensive fallback data due to error');
      setWeatherData({
        temperature: 27,
        condition: 'Mist',
        humidity: 84,
        windSpeed: 5,
        visibility: 8,
        pressure: 1001,
        isDay: new Date().getHours() >= 6 && new Date().getHours() < 18
      });
      
      setHourlyForecast([
        { time: '12 PM', temp: 28, condition: 'Mist' },
        { time: '1 PM', temp: 30, condition: 'Sunny' },
        { time: '2 PM', temp: 32, condition: 'Sunny' },
        { time: '3 PM', temp: 31, condition: 'Partly Cloudy' },
        { time: '4 PM', temp: 29, condition: 'Cloudy' },
        { time: '5 PM', temp: 27, condition: 'Cloudy' }
      ]);
      
      setWeeklyForecast([
        { day: 'Today', high: 32, low: 24, condition: 'Mist' },
        { day: 'Tomorrow', high: 30, low: 22, condition: 'Sunny' },
        { day: 'Wed', high: 28, low: 20, condition: 'Rainy' },
        { day: 'Thu', high: 26, low: 18, condition: 'Cloudy' },
        { day: 'Fri', high: 29, low: 21, condition: 'Sunny' }
      ]);
      
      setAqiData({
        aqi: { index: 75, category: 'MODERATE' },
        pollutants: { pm25: { value: 22 }, pm10: { value: 35 } }
      });
    } finally {
      setLoading(false);
    }
  }, [coordinates]);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (coordinates.lat && coordinates.lon) {
      loadWeatherData();
    }
  }, [coordinates, loadWeatherData]);

  // Safety timeout to prevent infinite loading
  useEffect(() => {
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.log('⏰ [WeatherDashboard] Loading timeout reached, forcing completion');
        setLoading(false);
        setError('Loading timeout - using fallback data');
        
        // Set basic fallback data if still loading
        if (!weatherData) {
          setWeatherData({
            temperature: 25,
            condition: 'Partly Cloudy',
            humidity: 65,
            windSpeed: 12,
            visibility: 8,
            pressure: 1013,
            isDay: new Date().getHours() >= 6 && new Date().getHours() < 18
          });
        }
        
        if (!coordinates.lat || !coordinates.lon) {
          setCoordinates({ lat: 28.6139, lon: 77.2090 });
        }
      }
    }, 15000); // 15 second safety timeout

    return () => clearTimeout(loadingTimeout);
  }, [loading, weatherData, coordinates.lat, coordinates.lon]);

  if (loading) {
    return (
      <AnimatedBackground>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 max-w-md">
            <div className="animate-spin text-6xl mb-4">🌀</div>
            <p className="mt-4 text-white text-lg">Loading weather data...</p>
            <p className="mt-2 text-white/70 text-sm">Fetching live weather conditions</p>
            
            {/* Debug info */}
            <div className="mt-4 text-xs text-white/50 space-y-1">
              <div>📍 Location: {coordinates.lat ? `${coordinates.lat.toFixed(4)}, ${coordinates.lon.toFixed(4)}` : 'Getting location...'}</div>
              <div>🔄 Status: {coordinates.lat ? 'Loading weather data' : 'Getting your location'}</div>
            </div>
            
            {/* Loading bar */}
            <div className="mt-4 w-full bg-white/10 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{width: coordinates.lat ? '75%' : '25%'}}></div>
            </div>
            
            <p className="mt-2 text-white/50 text-xs">
              {coordinates.lat ? 'Almost there...' : 'Please allow location access'}
            </p>
          </div>
        </div>
      </AnimatedBackground>
    );
  }

  return (
    <AnimatedBackground showMap={true} showGeometric={true}>
      <div className="min-h-screen bg-slate-900">
        {/* Modern Header */}
        <header className="bg-slate-800/90 backdrop-blur-lg shadow-lg border-b border-slate-700/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Weather Pro
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  Live weather conditions and forecasts
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <button 
                  onClick={loadWeatherData}
                  className="p-2 rounded-full bg-slate-700/50 hover:bg-slate-600/50 transition-colors backdrop-blur-sm border border-slate-600/50 text-white"
                >
                  <span className="text-lg">🔄</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Weather Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 backdrop-blur-lg border border-red-500/30 text-red-100 rounded-lg">
              <div className="flex items-center space-x-2">
                <span className="text-xl">⚠️</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Hero Section - Main Weather Display with Map */}
          <WeatherHeroSection 
            location={location} 
            weatherData={weatherData} 
            aqiData={aqiData}
            getCurrentLocation={getCurrentLocation}
            setShowMap={setShowMap}
            showMap={showMap}
            cityName={cityName}
          />

          {/* Weather Cards Grid - Matching AQI.in Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Row 1 */}
            <WindSpeedCard 
              windSpeed={weatherData?.windSpeed || 11}
              gustSpeed={6}
              direction="290° WNW"
            />
            
            <CloudVisibilityCard 
              cloudCover={75}
              visibility={4}
            />
            
            <PressureCard 
              pressure={weatherData?.pressure || 1006}
              pressureLevel="Moderate"
            />
            
            <SuggestionsCard 
              location={location}
              date="Today"
            />
            
            {/* Row 2 */}
            <div className="md:col-span-1">
              <PrecipitationCard 
                precipitation={0.07}
                precipitationType="light rain"
              />
            </div>
            
            <div className="md:col-span-1">
              <UVIndexCard 
                uvIndex={0}
                uvLevel="Low"
              />
            </div>
            
            {/* Additional Weather Stats */}
            <WeatherCard className="p-6 bg-slate-800/90 backdrop-blur-lg border border-slate-700/50">
              <div className="text-center">
                <div className="text-slate-300 text-sm font-medium mb-2">Temperature</div>
                <div className="text-5xl font-bold text-white mb-2">
                  {weatherData?.temperature || 28}°
                </div>
                <div className="text-slate-400 text-sm mb-3">
                  Feels like {(weatherData?.temperature || 28) + 2}°
                </div>
                <div className="px-3 py-1 bg-orange-500/20 rounded-full text-orange-300 text-xs inline-block">
                  {weatherData?.condition || 'Partly Cloudy'}
                </div>
              </div>
            </WeatherCard>
            
            <WeatherCard className="p-6 bg-slate-800/90 backdrop-blur-lg border border-slate-700/50">
              <div className="text-center">
                <div className="text-slate-300 text-sm font-medium mb-2">Humidity</div>
                <div className="text-5xl font-bold text-white mb-2">
                  {weatherData?.humidity || 65}<span className="text-2xl">%</span>
                </div>
                <div className="text-slate-400 text-sm mb-3">Comfortable level</div>
                <div className="flex justify-center">
                  <div className="text-4xl">💧</div>
                </div>
              </div>
            </WeatherCard>
          </div>

          {/* Forecast Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-slate-800/90 backdrop-blur-lg border border-slate-700/50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4 text-white flex items-center">
                <span className="mr-2">⏰</span>
                24-Hour Forecast
              </h3>
              <HourlyForecast forecasts={hourlyForecast} />
            </div>
            
            <div className="bg-slate-800/90 backdrop-blur-lg border border-slate-700/50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4 text-white flex items-center">
                <span className="mr-2">📅</span>
                7-Day Forecast
              </h3>
              <WeeklyForecast forecasts={weeklyForecast} />
            </div>
          </div>

          {/* Bottom Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <WeatherCard className="p-6 bg-red-500/10 backdrop-blur-lg border border-red-500/30 cursor-pointer hover:bg-red-500/20 transition-colors">
              <div className="flex items-center justify-center space-x-3">
                <span className="text-3xl">🗺️</span>
                <div className="text-center">
                  <div className="text-white font-semibold">Map</div>
                  <div className="text-red-300 text-sm">View weather map</div>
                </div>
              </div>
            </WeatherCard>
            
            <WeatherCard className="p-6 bg-blue-500/10 backdrop-blur-lg border border-blue-500/30 cursor-pointer hover:bg-blue-500/20 transition-colors">
              <div className="flex items-center justify-center space-x-3">
                <span className="text-3xl">📊</span>
                <div className="text-center">
                  <div className="text-white font-semibold">Ranking</div>
                  <div className="text-blue-300 text-sm">Weather rankings</div>
                </div>
              </div>
            </WeatherCard>
            
            <WeatherCard className="p-6 bg-orange-500/10 backdrop-blur-lg border border-orange-500/30 cursor-pointer hover:bg-orange-500/20 transition-colors">
              <div className="flex items-center justify-center space-x-3">
                <span className="text-3xl">🌡️</span>
                <div className="text-center">
                  <div className="text-white font-semibold">Climate Change</div>
                  <div className="text-orange-300 text-sm">Long-term trends</div>
                </div>
              </div>
            </WeatherCard>
          </div>

          {/* Interactive Map Section */}
          {showMap && (
            <div className="mb-8 animate-fadeIn">
              <WeatherCard className="p-6 bg-gradient-to-br from-blue-600/10 to-teal-600/10 border-blue-400/30">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                    <span className="text-2xl">🗺️</span>
                    <span>Interactive Weather & AQI Map</span>
                  </h3>
                  <button 
                    onClick={() => setShowMap(false)}
                    className="px-3 py-1 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
                  >
                    ✕ Close Map
                  </button>
                </div>
                <div className="h-96 rounded-lg overflow-hidden border border-white/20 shadow-inner">
                  <OpenStreetMap 
                    latitude={coordinates.lat || 28.6139}
                    longitude={coordinates.lon || 77.2090}
                    aqiData={[
                      {
                        lat: coordinates.lat || 28.6139,
                        lon: coordinates.lon || 77.2090,
                        aqi: aqiData?.aqi?.index || 75,
                        location: location || 'Current Location'
                      }
                    ]}
                  />
                </div>
                <div className="mt-4 text-center">
                  <p className="text-white/70 text-sm">
                    🌡️ Interactive map showing current location, weather conditions, and AQI data
                  </p>
                </div>
              </WeatherCard>
            </div>
          )}
        </main>
      </div>
    </AnimatedBackground>
  );
};

export default WeatherDashboard;
