import React, { useState, useEffect } from 'react';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        <div className="nav-logo">
          <img src="/logo.png" alt="AirWatch" className="logo-image" />
          <span className="logo-text">AirWatch</span>
        </div>
        
        <div className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
          <button 
            className="nav-link"
            onClick={() => scrollToSection('home')}
          >
            Home
          </button>
          <button 
            className="nav-link"
            onClick={() => scrollToSection('features')}
          >
            Features
          </button>
          <button 
            className="nav-link"
            onClick={() => scrollToSection('how-it-works')}
          >
            How It Works
          </button>
          <button 
            className="nav-link"
            onClick={() => scrollToSection('about')}
          >
            About
          </button>
          <button className="nav-btn login-btn">Login</button>
          <button className="nav-btn signup-btn">Sign Up</button>
        </div>

        <div className="nav-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
