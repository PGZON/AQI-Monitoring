import React from 'react';

const AQICard = ({ data }) => {
  if (!data) return null;

  const { aqi, location, pollutants, coordinates } = data;
  
  // Extract AQI value - handle both number and object formats
  const aqiValue = typeof aqi === 'number' ? aqi : aqi?.index || 0;

  // Get AQI color and emoji based on value
  const getAQIInfo = (aqiValue) => {
    if (aqiValue <= 50) {
      return { 
        color: '#00e400', 
        bgColor: '#e8f5e8', 
        emoji: '🟢', 
        level: 'Good',
        message: 'Air quality is considered satisfactory, and air pollution poses little or no risk.'
      };
    } else if (aqiValue <= 100) {
      return { 
        color: '#ffff00', 
        bgColor: '#fffbe6', 
        emoji: '🟡', 
        level: 'Moderate',
        message: 'Air quality is acceptable for most people. However, sensitive people may experience minor symptoms.'
      };
    } else if (aqiValue <= 150) {
      return { 
        color: '#ff7e00', 
        bgColor: '#fff4e6', 
        emoji: '🟠', 
        level: 'Unhealthy for Sensitive Groups',
        message: 'Sensitive people may experience health effects. The general public is not likely to be affected.'
      };
    } else if (aqiValue <= 200) {
      return { 
        color: '#ff0000', 
        bgColor: '#ffeaea', 
        emoji: '🔴', 
        level: 'Unhealthy',
        message: 'Everyone may begin to experience health effects. Sensitive people may experience more serious effects.'
      };
    } else if (aqiValue <= 300) {
      return { 
        color: '#8f3f97', 
        bgColor: '#f5e6f7', 
        emoji: '🟣', 
        level: 'Very Unhealthy',
        message: 'Health warnings of emergency conditions. The entire population is more likely to be affected.'
      };
    } else {
      return { 
        color: '#7e0023', 
        bgColor: '#f2e6ea', 
        emoji: '🆘', 
        level: 'Hazardous',
        message: 'Health alert: everyone may experience more serious health effects.'
      };
    }
  };

  const aqiInfo = getAQIInfo(aqiValue);

  // Pollutant info with units and descriptions
  const pollutantInfo = {
    pm2_5: { name: 'PM2.5', unit: 'µg/m³', description: 'Fine Particulate Matter' },
    pm10: { name: 'PM10', unit: 'µg/m³', description: 'Coarse Particulate Matter' },
    co: { name: 'CO', unit: 'ppm', description: 'Carbon Monoxide' },
    no2: { name: 'NO₂', unit: 'ppm', description: 'Nitrogen Dioxide' },
    o3: { name: 'O₃', unit: 'ppm', description: 'Ozone' },
    so2: { name: 'SO₂', unit: 'ppm', description: 'Sulfur Dioxide' }
  };

  return (
    <div className="aqi-card" style={{ backgroundColor: aqiInfo.bgColor }}>
      {/* Main AQI Display */}
      <div className="aqi-main">
        <div className="aqi-header">
          <div className="aqi-location">
            <span className="location-icon">📍</span>
            <h2 className="location-name">
              {typeof location === 'string' ? location : location?.formatted || location?.name || 'Unknown Location'}
            </h2>
            {coordinates && (
              <span className="coordinates">
                {coordinates.latitude.toFixed(4)}, {coordinates.longitude.toFixed(4)}
              </span>
            )}
          </div>
        </div>

        <div className="aqi-display">
          <div className="aqi-value-container">
            <span className="aqi-emoji">{aqiInfo.emoji}</span>
            <div className="aqi-value" style={{ color: aqiInfo.color }}>
              {aqiValue}
            </div>
            <div className="aqi-label">AQI</div>
          </div>
          
          <div className="aqi-status">
            <h3 className="status-level" style={{ color: aqiInfo.color }}>
              {aqiInfo.level}
            </h3>
            <p className="status-message">{aqiInfo.message}</p>
          </div>
        </div>
      </div>

      {/* Pollutants Grid */}
      <div className="pollutants-section">
        <h3 className="pollutants-title">Pollutant Levels</h3>
        <div className="pollutants-grid">
          {Object.entries(pollutants).map(([key, value]) => {
            const info = pollutantInfo[key];
            if (!info) return null;

            // Handle both object format {value, unit} and direct value format
            const pollutantValue = typeof value === 'object' && value !== null ? value.value : value;
            const pollutantUnit = typeof value === 'object' && value !== null ? value.unit : info.unit;

            return (
              <div key={key} className="pollutant-item">
                <div className="pollutant-header">
                  <span className="pollutant-name">{info.name}</span>
                  <span className="pollutant-description">{info.description}</span>
                </div>
                <div className="pollutant-value">
                  <span className="value">{pollutantValue}</span>
                  <span className="unit">{pollutantUnit}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Health Recommendations */}
      <div className="health-recommendations">
        <h3 className="recommendations-title">Health Recommendations</h3>
        <div className="recommendations-content">
          {aqiValue <= 100 ? (
            <div className="recommendation-item">
              <span className="rec-icon">✅</span>
              <span>Great day for outdoor activities!</span>
            </div>
          ) : aqiValue <= 150 ? (
            <>
              <div className="recommendation-item">
                <span className="rec-icon">⚠️</span>
                <span>Sensitive individuals should limit outdoor activities</span>
              </div>
              <div className="recommendation-item">
                <span className="rec-icon">🚶</span>
                <span>General public can enjoy outdoor activities normally</span>
              </div>
            </>
          ) : aqiValue <= 200 ? (
            <>
              <div className="recommendation-item">
                <span className="rec-icon">🚫</span>
                <span>Avoid prolonged outdoor activities</span>
              </div>
              <div className="recommendation-item">
                <span className="rec-icon">😷</span>
                <span>Consider wearing a mask outdoors</span>
              </div>
            </>
          ) : (
            <>
              <div className="recommendation-item">
                <span className="rec-icon">🏠</span>
                <span>Stay indoors and keep windows closed</span>
              </div>
              <div className="recommendation-item">
                <span className="rec-icon">😷</span>
                <span>Wear N95 masks if you must go outside</span>
              </div>
              <div className="recommendation-item">
                <span className="rec-icon">🏥</span>
                <span>Seek medical attention if experiencing symptoms</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AQICard;
