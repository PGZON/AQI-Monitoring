import React from 'react';

const Features = () => {
  const features = [
    {
      icon: '⚡',
      title: 'Live Air Quality Data',
      description: 'Real-time monitoring with updates every 60 seconds. Never miss critical air quality changes in your area.',
      color: 'blue',
      benefit: 'Stay instantly informed'
    },
    {
      icon: '🗺️',
      title: 'Visual Pollution Maps',
      description: 'Beautiful, interactive heatmaps show pollution hotspots and clean air zones across your region.',
      color: 'green',
      benefit: 'See the bigger picture'
    },
    {
      icon: '🤖',
      title: 'AI-Powered Forecasts',
      description: 'Machine learning algorithms predict air quality trends up to 7 days ahead with 95% accuracy.',
      color: 'purple',
      benefit: 'Plan your activities'
    },
    {
      icon: '🎯',
      title: 'Personalized Alerts',
      description: 'Custom notifications based on your health conditions, outdoor activities, and sensitivity levels.',
      color: 'orange',
      benefit: 'Tailored to your needs'
    },
    {
      icon: '�',
      title: 'Health Dashboard',
      description: 'Track your daily exposure, view health recommendations, and monitor long-term air quality trends.',
      color: 'red',
      benefit: 'Protect your health'
    },
    {
      icon: '�',
      title: 'Global Coverage',
      description: 'Access air quality data from 10,000+ monitoring stations across 500+ cities worldwide.',
      color: 'teal',
      benefit: 'Wherever you go'
    }
  ];

  return (
    <section id="features" className="features-section">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Key Features</h2>
          <p className="section-subtitle">
            Everything you need to monitor air quality and protect your health
          </p>
        </div>
        
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className={`feature-card ${feature.color}`}>
              <div className="feature-icon">
                <span>{feature.icon}</span>
              </div>
              <div className="feature-content">
                <h3 className="feature-title">{feature.title}</h3>
                <div className="feature-benefit">{feature.benefit}</div>
                <p className="feature-description">{feature.description}</p>
              </div>
              <div className="feature-hover-effect">
                <button className="feature-learn-more">Learn More →</button>
              </div>
            </div>
          ))}
        </div>

        <div className="features-showcase">
          <div className="showcase-content">
            <div className="showcase-text">
              <h3>Complete Air Quality Solution</h3>
              <p>
                Our comprehensive platform combines real-time monitoring, 
                predictive analytics, and personalized insights to help you 
                make informed decisions about your daily activities.
              </p>
              <ul className="showcase-benefits">
                <li>✓ 99.9% uptime with redundant data sources</li>
                <li>✓ Machine learning-powered forecasts</li>
                <li>✓ Health recommendations from certified experts</li>
                <li>✓ Integration with weather and pollen data</li>
              </ul>
            </div>
            <div className="showcase-visual">
              <div className="mock-dashboard">
                <div className="dashboard-header">
                  <h4>Your Air Quality Dashboard</h4>
                  <span className="status-indicator good">●</span>
                </div>
                <div className="dashboard-metrics">
                  <div className="metric">
                    <span className="metric-label">Current AQI</span>
                    <span className="metric-value good">42</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Forecast</span>
                    <span className="metric-trend">↗ Improving</span>
                  </div>
                </div>
                <div className="dashboard-chart">
                  <div className="chart-bars">
                    <div className="bar" style={{height: '30%'}}></div>
                    <div className="bar" style={{height: '45%'}}></div>
                    <div className="bar" style={{height: '60%'}}></div>
                    <div className="bar" style={{height: '40%'}}></div>
                    <div className="bar" style={{height: '25%'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
