import React from 'react';

const CTASection = ({ onNavigate }) => {
  const handleDashboardClick = () => {
    if (onNavigate) {
      onNavigate('dashboard');
    } else {
      // Fallback for when navigation isn't available
      alert('Dashboard functionality will be implemented in Phase 2!');
    }
  };

  return (
    <section className="cta-section">
      <div className="container">
        <div className="cta-content">
          <div className="cta-background">
            <div className="cta-particle"></div>
            <div className="cta-particle"></div>
            <div className="cta-particle"></div>
            <div className="cta-particle"></div>
          </div>
          
          <div className="cta-text">
            <h2 className="cta-title">
              Start Monitoring <span className="highlight">Air Quality</span>
            </h2>
            <p className="cta-subtitle">
              Get real-time air quality data for your location and protect your health today.
            </p>
          </div>

          <div className="cta-buttons">
            <button className="cta-button primary" onClick={handleDashboardClick}>
              <span className="button-icon">🚀</span>
              Check Air Quality
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
