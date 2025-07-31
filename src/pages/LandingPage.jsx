import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import Features from '../components/Features';
import HowItWorks from '../components/HowItWorks';
import AboutSection from '../components/AboutSection';
import CTASection from '../components/CTASection';
import Footer from '../components/Footer';

const LandingPage = () => {
  const navigate = useNavigate();
  
  const handleNavigate = (page) => {
    if (page === 'dashboard') {
      navigate('/login');
    } else {
      navigate(`/${page}`);
    }
  };

  return (
    <div className="landing-page">
      <Navbar onNavigate={handleNavigate} />
      <main>
        <HeroSection onNavigate={handleNavigate} />
        <Features />
        <HowItWorks />
        <AboutSection />
        <CTASection onNavigate={handleNavigate} />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
