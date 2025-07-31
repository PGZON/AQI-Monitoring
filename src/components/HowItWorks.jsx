import React from 'react';

const HowItWorks = () => {
  const steps = [
    {
      icon: '📍',
      title: 'Detect Location',
      description: 'Allow location access or manually enter your city to get started'
    },
    {
      icon: '📡',
      title: 'Fetch Real-Time AQI',
      description: 'Our system retrieves live air quality data from multiple sources'
    },
    {
      icon: '🌍',
      title: 'Visualize on Map',
      description: 'See air quality levels displayed on an interactive map with color coding'
    },
    {
      icon: '📊',
      title: 'Get Forecast & Alerts',
      description: 'Receive predictions and notifications for air quality changes'
    }
  ];

  return (
    <section id="how-it-works" className="how-it-works-section">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">
            Get real-time air quality insights in just a few simple steps
          </p>
        </div>
        
        <div className="steps-container">
          {steps.map((step, index) => (
            <div key={index} className="step-card">
              <div className="step-number">{index + 1}</div>
              <div className="step-icon">{step.icon}</div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-description">{step.description}</p>
              {index < steps.length - 1 && (
                <div className="step-connector">
                  <div className="connector-line"></div>
                  <div className="connector-arrow">→</div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="demo-preview">
          <div className="demo-card">
            <div className="demo-header">
              <span className="demo-location">📍 New York, NY</span>
              <span className="demo-time">Updated 2 min ago</span>
            </div>
            <div className="demo-aqi">
              <div className="aqi-circle moderate">
                <span className="aqi-number">78</span>
              </div>
              <div className="aqi-info">
                <h4>Moderate</h4>
                <p>Air quality is acceptable for most people</p>
              </div>
            </div>
            <div className="demo-pollutants">
              <div className="pollutant">
                <span className="pollutant-name">PM2.5</span>
                <div className="pollutant-bar">
                  <div className="pollutant-fill" style={{width: '60%'}}></div>
                </div>
                <span className="pollutant-value">23 μg/m³</span>
              </div>
              <div className="pollutant">
                <span className="pollutant-name">PM10</span>
                <div className="pollutant-bar">
                  <div className="pollutant-fill" style={{width: '45%'}}></div>
                </div>
                <span className="pollutant-value">41 μg/m³</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
