import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-main">
            <div className="footer-brand">
              <div className="footer-logo">
                <span className="logo-icon">🌍</span>
                <span className="logo-text">AirWatch</span>
              </div>
              <p className="footer-description">
                Real-time air quality monitoring for healthier living. 
                Making clean air information accessible to everyone.
              </p>
              <div className="social-links">
                <button className="social-link" aria-label="Facebook">
                  <span>📘</span>
                </button>
                <button className="social-link" aria-label="Twitter">
                  <span>🐦</span>
                </button>
                <button className="social-link" aria-label="LinkedIn">
                  <span>💼</span>
                </button>
                <button className="social-link" aria-label="Instagram">
                  <span>📷</span>
                </button>
              </div>
            </div>

            <div className="footer-links">
              <div className="link-group">
                <h4 className="link-group-title">Navigation</h4>
                <ul className="link-list">
                  <li>
                    <button onClick={() => scrollToSection('home')} className="footer-link">
                      Home
                    </button>
                  </li>
                  <li>
                    <button onClick={() => scrollToSection('features')} className="footer-link">
                      Features
                    </button>
                  </li>
                  <li>
                    <button onClick={() => scrollToSection('how-it-works')} className="footer-link">
                      How It Works
                    </button>
                  </li>
                  <li>
                    <button onClick={() => scrollToSection('about')} className="footer-link">
                      About
                    </button>
                  </li>
                </ul>
              </div>

              <div className="link-group">
                <h4 className="link-group-title">Features</h4>
                <ul className="link-list">
                  <li><button className="footer-link">Real-time AQI</button></li>
                  <li><button className="footer-link">Air Quality Maps</button></li>
                  <li><button className="footer-link">Forecasting</button></li>
                  <li><button className="footer-link">Health Alerts</button></li>
                </ul>
              </div>

              <div className="link-group">
                <h4 className="link-group-title">Support</h4>
                <ul className="link-list">
                  <li><button className="footer-link">Help Center</button></li>
                  <li><button className="footer-link">Contact Us</button></li>
                  <li><button className="footer-link">Privacy Policy</button></li>
                  <li><button className="footer-link">Terms of Service</button></li>
                </ul>
              </div>

              <div className="link-group">
                <h4 className="link-group-title">Stay Updated</h4>
                <p className="newsletter-text">
                  Get the latest air quality insights and health tips.
                </p>
                <div className="newsletter-form">
                  <input 
                    type="email" 
                    placeholder="Enter your email"
                    className="newsletter-input"
                  />
                  <button className="newsletter-button">
                    Subscribe
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <div className="footer-bottom-content">
              <p className="copyright">
                © {currentYear} AirWatch. All rights reserved.
              </p>
              <div className="footer-bottom-links">
                <button className="footer-bottom-link">Privacy</button>
                <button className="footer-bottom-link">Terms</button>
                <button className="footer-bottom-link">Cookies</button>
              </div>
              <button onClick={scrollToTop} className="back-to-top">
                <span>↑</span>
                Back to Top
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
