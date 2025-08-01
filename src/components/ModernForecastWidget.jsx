/**
 * Modern Weather-Style AQI Forecast Component
 * Beautiful card-based forecast display similar to weather apps
 */

import React, { useState, useEffect } from 'react';

// Get AQI color and emoji based on value
const getAQIStyle = (aqi) => {
  if (aqi <= 50) return { 
    color: 'text-green-600', 
    bg: 'bg-green-100', 
    emoji: '😊',
    text: 'Good'
  };
  if (aqi <= 100) return { 
    color: 'text-yellow-600', 
    bg: 'bg-yellow-100', 
    emoji: '😐',
    text: 'Moderate'
  };
  if (aqi <= 150) return { 
    color: 'text-orange-600', 
    bg: 'bg-orange-100', 
    emoji: '😷',
    text: 'Unhealthy for Sensitive'
  };
  if (aqi <= 200) return { 
    color: 'text-red-600', 
    bg: 'bg-red-100', 
    emoji: '😨',
    text: 'Unhealthy'
  };
  return { 
    color: 'text-purple-600', 
    bg: 'bg-purple-100', 
    emoji: '💀',
    text: 'Hazardous'
  };
};

// Individual forecast card
const ForecastCard = ({ time, aqi, temp, conditions, isNow = false }) => {
  const style = getAQIStyle(aqi);
  
  return (
    <div className={`
      relative rounded-2xl p-4 text-center transition-all duration-300
      ${isNow ? 'bg-blue-500 text-white shadow-lg transform scale-105' : 'bg-white dark:bg-gray-800 hover:shadow-md'}
    `}>
      {isNow && (
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
          <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">Now</span>
        </div>
      )}
      
      <div className="space-y-2">
        <div className={`text-sm font-medium ${isNow ? 'text-blue-100' : 'text-gray-600 dark:text-gray-400'}`}>
          {time}
        </div>
        
        <div className="text-3xl">
          {isNow ? '🌟' : style.emoji}
        </div>
        
        <div className={`text-2xl font-bold ${isNow ? 'text-white' : style.color}`}>
          {aqi}
        </div>
        
        <div className={`text-xs ${isNow ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
          AQI
        </div>
        
        {temp && (
          <div className={`text-sm ${isNow ? 'text-blue-100' : 'text-gray-600 dark:text-gray-300'}`}>
            {temp}°C
          </div>
        )}
        
        <div className={`text-xs ${isNow ? 'text-blue-100' : style.color}`}>
          {isNow ? 'Current' : style.text}
        </div>
      </div>
    </div>
  );
};

// Hourly forecast component
const HourlyForecast = ({ forecasts = [] }) => {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center">
        <span className="mr-2">⏰</span>
        24-Hour Forecast
      </h4>
      
      <div className="flex space-x-3 overflow-x-auto pb-2">
        {forecasts.map((forecast, index) => (
          <div key={index} className="flex-shrink-0">
            <ForecastCard
              time={forecast.time}
              aqi={forecast.aqi}
              temp={forecast.temp}
              conditions={forecast.conditions}
              isNow={index === 0}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

// Daily forecast component
const DailyForecast = ({ forecasts = [] }) => {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center">
        <span className="mr-2">📅</span>
        7-Day Forecast
      </h4>
      
      <div className="space-y-2">
        {forecasts.map((forecast, index) => {
          const style = getAQIStyle(forecast.high);
          
          return (
            <div 
              key={index} 
              className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{style.emoji}</div>
                <div>
                  <div className="font-medium text-gray-800 dark:text-white">
                    {forecast.day}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {forecast.conditions}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className={`text-lg font-bold ${style.color}`}>
                    {forecast.high}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {forecast.low}
                  </div>
                </div>
                <div className="text-sm text-gray-400">
                  AQI
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Air quality trends chart
const AQITrendChart = ({ data = [] }) => {
  const maxAQI = Math.max(...data.map(d => d.aqi));
  
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center">
        <span className="mr-2">📈</span>
        AQI Trend (Last 24h)
      </h4>
      
      <div className="relative h-32 bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
        <div className="flex items-end justify-between h-full">
          {data.map((point, index) => {
            const height = (point.aqi / maxAQI) * 100;
            const style = getAQIStyle(point.aqi);
            
            return (
              <div key={index} className="flex flex-col items-center space-y-1">
                <div 
                  className={`w-3 rounded-t transition-all duration-500 ${style.bg}`}
                  style={{ height: `${height}%` }}
                ></div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {point.time}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Main Modern Forecast Component
const ModernForecastWidget = ({ location, compact = false }) => {
  const [loading, setLoading] = useState(true);
  const [hourlyData, setHourlyData] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadForecastData();
  }, [location]);

  const loadForecastData = async () => {
    try {
      setLoading(true);
      
      // Generate mock data for now - replace with actual API calls
      const mockHourlyData = Array.from({ length: 8 }, (_, i) => ({
        time: new Date(Date.now() + i * 3 * 60 * 60 * 1000).toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          hour12: true 
        }),
        aqi: Math.floor(Math.random() * 150) + 10,
        temp: Math.floor(Math.random() * 15) + 20,
        conditions: ['Clear', 'Partly Cloudy', 'Hazy', 'Polluted'][Math.floor(Math.random() * 4)]
      }));

      const mockDailyData = [
        'Today', 'Tomorrow', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'
      ].map(day => ({
        day,
        high: Math.floor(Math.random() * 100) + 50,
        low: Math.floor(Math.random() * 50) + 20,
        conditions: ['Mostly Clear', 'Moderate Air', 'Light Pollution', 'Heavy Smog'][Math.floor(Math.random() * 4)]
      }));

      const mockTrendData = Array.from({ length: 12 }, (_, i) => ({
        time: new Date(Date.now() - (11 - i) * 2 * 60 * 60 * 1000).toLocaleTimeString('en-US', { 
          hour: 'numeric' 
        }),
        aqi: Math.floor(Math.random() * 120) + 20
      }));

      setHourlyData(mockHourlyData);
      setDailyData(mockDailyData);
      setTrendData(mockTrendData);
      
    } catch (err) {
      console.error('Forecast loading error:', err);
      setError('Failed to load forecast data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        <div className="flex space-x-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 w-16 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        <div className="text-2xl mb-2">⚠️</div>
        <div className="text-sm">{error}</div>
      </div>
    );
  }

  if (compact) {
    return <HourlyForecast forecasts={hourlyData.slice(0, 4)} />;
  }

  return (
    <div className="space-y-8">
      <HourlyForecast forecasts={hourlyData} />
      <AQITrendChart data={trendData} />
      <DailyForecast forecasts={dailyData} />
    </div>
  );
};

export default ModernForecastWidget;
