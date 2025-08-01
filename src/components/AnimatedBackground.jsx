/**
 * Background Map Component - Animated background with geographic elements
 * Creates a beautiful animated background similar to weather apps
 */

import React, { useEffect, useRef } from 'react';

const BackgroundMap = ({ className = '' }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resize();
    window.addEventListener('resize', resize);

    // Animation parameters
    let time = 0;
    const particles = [];
    
    // Create particles for floating effect
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.3 + 0.1
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.1)'); // Blue
      gradient.addColorStop(0.5, 'rgba(147, 51, 234, 0.1)'); // Purple
      gradient.addColorStop(1, 'rgba(239, 68, 68, 0.1)'); // Red
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw animated grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      
      const gridSize = 100;
      const offsetX = (time * 0.5) % gridSize;
      const offsetY = (time * 0.3) % gridSize;
      
      for (let x = -gridSize + offsetX; x < canvas.width + gridSize; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      
      for (let y = -gridSize + offsetY; y < canvas.height + gridSize; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw floating particles
      particles.forEach(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        // Wrap around screen
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;
        
        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`;
        ctx.fill();
      });

      // Draw wave patterns
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 2;
      
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        for (let x = 0; x <= canvas.width; x += 10) {
          const y = canvas.height * 0.5 + Math.sin((x + time * 2) * 0.01 + i * 2) * 50 * (i + 1);
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      time += 1;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-0 ${className}`}
      style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        opacity: 0.3
      }}
    />
  );
};

// Geometric pattern overlay
const GeometricOverlay = () => (
  <div className="fixed inset-0 pointer-events-none z-0">
    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 via-purple-50/20 to-pink-50/20"></div>
    
    {/* Floating geometric shapes */}
    {[...Array(20)].map((_, i) => (
      <div
        key={i}
        className={`absolute w-2 h-2 bg-white/10 rounded-full animate-pulse`}
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 3}s`,
          animationDuration: `${3 + Math.random() * 2}s`
        }}
      />
    ))}
    
    {/* Larger geometric elements */}
    <div className="absolute top-1/4 left-1/4 w-32 h-32 border border-white/5 rounded-full animate-spin" style={{ animationDuration: '20s' }}></div>
    <div className="absolute top-3/4 right-1/4 w-24 h-24 border border-white/5 rotate-45 animate-pulse"></div>
    <div className="absolute bottom-1/4 left-1/3 w-16 h-16 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg animate-bounce" style={{ animationDuration: '3s' }}></div>
  </div>
);

// Main background component with multiple layers
const AnimatedBackground = ({ children, showMap = true, showGeometric = true }) => {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Base gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900"></div>
      
      {/* Animated map canvas */}
      {showMap && <BackgroundMap />}
      
      {/* Geometric overlay */}
      {showGeometric && <GeometricOverlay />}
      
      {/* Content overlay */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default AnimatedBackground;
