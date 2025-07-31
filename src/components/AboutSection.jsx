import React from 'react';

const AboutSection = () => {
  return (
    <section id="about" className="about-section">
      <div className="container">
        <div className="about-content">
          <div className="about-text">
            <h2 className="section-title">About Air Quality Monitoring</h2>
            <p className="about-description">
              Air quality affects everyone's health and daily activities. Our platform provides 
              real-time air quality data to help you make informed decisions about when to 
              exercise outdoors, plan activities, or take protective measures.
            </p>
            
            <div className="health-impact">
              <h3>Why Air Quality Matters</h3>
              <ul className="impact-list">
                <li>Affects respiratory and cardiovascular health</li>
                <li>Impacts outdoor activities and exercise plans</li>
                <li>Influences daily commuting decisions</li>
                <li>Important for vulnerable groups (children, elderly, asthma)</li>
              </ul>
            </div>
          </div>

          <div className="about-visual">
            <div className="aqi-scale">
              <h3>AQI Health Index</h3>
              <div className="scale-items">
                <div className="scale-item good">
                  <span className="scale-range">0-50</span>
                  <span className="scale-label">Good</span>
                </div>
                <div className="scale-item moderate">
                  <span className="scale-range">51-100</span>
                  <span className="scale-label">Moderate</span>
                </div>
                <div className="scale-item unhealthy-sensitive">
                  <span className="scale-range">101-150</span>
                  <span className="scale-label">Unhealthy for Sensitive</span>
                </div>
                <div className="scale-item unhealthy">
                  <span className="scale-range">151-200</span>
                  <span className="scale-label">Unhealthy</span>
                </div>
                <div className="scale-item very-unhealthy">
                  <span className="scale-range">201-300</span>
                  <span className="scale-label">Very Unhealthy</span>
                </div>
                <div className="scale-item hazardous">
                  <span className="scale-range">301+</span>
                  <span className="scale-label">Hazardous</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="about-cta">
          <div className="cta-content">
            <h3>Join the Movement</h3>
            <p>Help us build a healthier future by staying informed about air quality in your community.</p>
            <button className="cta-button">
              Start Monitoring Now
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
