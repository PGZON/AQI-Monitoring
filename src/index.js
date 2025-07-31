import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { registerSW } from './utils/pwaUtils';
import performanceMonitor from './utils/performanceMonitor';

// Initialize performance monitoring in development
if (process.env.NODE_ENV === 'development') {
  performanceMonitor.analyzeBundleSize();
  
  // Monitor memory usage periodically
  setInterval(() => {
    performanceMonitor.monitorMemoryUsage();
  }, 30000); // Every 30 seconds
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker for PWA functionality
registerSW();

// Enhanced Web Vitals reporting with performance data
reportWebVitals((metric) => {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Web Vital:', metric);
  }
  
  // Send to analytics in production
  if (process.env.NODE_ENV === 'production') {
    // You can send this to your analytics service
    // Example: gtag('event', metric.name, { value: metric.value });
  }
});
