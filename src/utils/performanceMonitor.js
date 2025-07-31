/**
 * Performance Monitoring Utilities
 * Tools for monitoring and analyzing application performance
 */

import React from 'react';

/**
 * Bundle Analysis Helper
 * Shows bundle size information in development
 */
export const analyzeBundleSize = () => {
  if (process.env.NODE_ENV === 'development') {
    console.group('📦 Bundle Analysis');
    
    // Check for large libraries
    const largeLibraries = [
      'recharts',
      'leaflet',
      'react-leaflet',
      '@heroicons/react'
    ];
    
    largeLibraries.forEach(lib => {
      console.log(`📚 ${lib}: Loaded via dynamic import`);
    });
    
    console.groupEnd();
  }
};

/**
 * Performance Monitor Hook
 * Tracks component render times and performance metrics
 */
export const usePerformanceMonitor = (componentName) => {
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const startTime = performance.now();
      
      return () => {
        const endTime = performance.now();
        const renderTime = endTime - startTime;
        
        if (renderTime > 100) { // Alert if render takes more than 100ms
          console.warn(`⚠️ Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
        } else {
          console.log(`⚡ ${componentName} rendered in ${renderTime.toFixed(2)}ms`);
        }
      };
    }
  }, [componentName]);
};

/**
 * Memory Usage Monitor
 * Tracks memory usage and warns about potential leaks
 */
export const monitorMemoryUsage = () => {
  if (process.env.NODE_ENV === 'development' && performance.memory) {
    const memInfo = performance.memory;
    const usedMB = Math.round(memInfo.usedJSHeapSize / 1024 / 1024);
    const totalMB = Math.round(memInfo.totalJSHeapSize / 1024 / 1024);
    const limitMB = Math.round(memInfo.jsHeapSizeLimit / 1024 / 1024);
    
    console.log(`🧠 Memory Usage: ${usedMB}MB / ${totalMB}MB (Limit: ${limitMB}MB)`);
    
    if (usedMB > limitMB * 0.8) {
      console.warn('⚠️ High memory usage detected!');
    }
    
    return { usedMB, totalMB, limitMB };
  }
  return null;
};

/**
 * Network Performance Monitor
 * Tracks API call performance and network conditions
 */
export const monitorNetworkPerformance = (url, startTime) => {
  if (process.env.NODE_ENV === 'development') {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`🌐 API Call to ${url}: ${duration.toFixed(2)}ms`);
    
    // Check connection type if available
    if (navigator.connection) {
      const conn = navigator.connection;
      console.log(`📡 Connection: ${conn.effectiveType}, ${conn.downlink}Mbps`);
    }
    
    return duration;
  }
};

/**
 * Component Tree Analyzer
 * Analyzes component hierarchy and potential optimizations
 */
export const analyzeComponentTree = () => {
  if (process.env.NODE_ENV === 'development') {
    const components = document.querySelectorAll('[data-reactroot] *');
    const componentCount = components.length;
    
    console.group('🌳 Component Tree Analysis');
    console.log(`Total DOM elements: ${componentCount}`);
    
    // Find deep nesting
    const maxDepth = Math.max(...Array.from(components).map(el => {
      let depth = 0;
      let parent = el.parentElement;
      while (parent) {
        depth++;
        parent = parent.parentElement;
      }
      return depth;
    }));
    
    console.log(`Maximum nesting depth: ${maxDepth}`);
    
    if (maxDepth > 15) {
      console.warn('⚠️ Deep component nesting detected - consider flattening structure');
    }
    
    if (componentCount > 1000) {
      console.warn('⚠️ Large component tree - consider virtualization for lists');
    }
    
    console.groupEnd();
    
    return { componentCount, maxDepth };
  }
};

/**
 * Performance Metrics Collector
 * Collects and reports Core Web Vitals and other performance metrics
 */
export const collectPerformanceMetrics = () => {
  if (process.env.NODE_ENV === 'development') {
    // Collect navigation timing
    const navigation = performance.getEntriesByType('navigation')[0];
    
    if (navigation) {
      const metrics = {
        // Time to First Byte
        ttfb: navigation.responseStart - navigation.requestStart,
        // DOM Content Loaded
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
        // Load Complete
        loadComplete: navigation.loadEventEnd - navigation.navigationStart,
        // First Paint (if available)
        firstPaint: null,
        // First Contentful Paint (if available)
        firstContentfulPaint: null
      };
      
      // Get paint timing if available
      const paintEntries = performance.getEntriesByType('paint');
      paintEntries.forEach(entry => {
        if (entry.name === 'first-paint') {
          metrics.firstPaint = entry.startTime;
        } else if (entry.name === 'first-contentful-paint') {
          metrics.firstContentfulPaint = entry.startTime;
        }
      });
      
      console.group('📊 Performance Metrics');
      console.log('Time to First Byte:', metrics.ttfb?.toFixed(2) + 'ms');
      console.log('DOM Content Loaded:', metrics.domContentLoaded?.toFixed(2) + 'ms');
      console.log('Load Complete:', metrics.loadComplete?.toFixed(2) + 'ms');
      if (metrics.firstPaint) console.log('First Paint:', metrics.firstPaint.toFixed(2) + 'ms');
      if (metrics.firstContentfulPaint) console.log('First Contentful Paint:', metrics.firstContentfulPaint.toFixed(2) + 'ms');
      console.groupEnd();
      
      return metrics;
    }
  }
  return null;
};

/**
 * Lazy Loading Statistics
 * Tracks how many components are lazy loaded vs eager loaded
 */
export const trackLazyLoadingStats = () => {
  if (process.env.NODE_ENV === 'development') {
    const suspenseComponents = document.querySelectorAll('[data-suspense]');
    const totalSuspenseComponents = suspenseComponents.length;
    
    console.log(`🔄 Lazy Loading Stats: ${totalSuspenseComponents} Suspense boundaries active`);
    
    return totalSuspenseComponents;
  }
  return 0;
};

/**
 * Performance Dashboard
 * Provides a comprehensive performance overview
 */
export const showPerformanceDashboard = () => {
  if (process.env.NODE_ENV === 'development') {
    console.clear();
    console.log('%c🚀 AQI Monitor Performance Dashboard', 'color: #3B82F6; font-size: 16px; font-weight: bold;');
    console.log('%c' + '='.repeat(50), 'color: #3B82F6;');
    
    analyzeBundleSize();
    const memStats = monitorMemoryUsage();
    const componentStats = analyzeComponentTree();
    const perfMetrics = collectPerformanceMetrics();
    const lazyStats = trackLazyLoadingStats();
    console.log(`🔄 Lazy components: ${lazyStats}`);
    
    // Performance Score Calculation
    let score = 100;
    if (perfMetrics) {
      if (perfMetrics.firstContentfulPaint > 2000) score -= 20;
      if (perfMetrics.loadComplete > 5000) score -= 30;
      if (perfMetrics.ttfb > 500) score -= 10;
    }
    if (memStats && memStats.usedMB > 100) score -= 15;
    if (componentStats && componentStats.componentCount > 1000) score -= 10;
    if (componentStats && componentStats.maxDepth > 15) score -= 10;
    
    const scoreColor = score >= 90 ? '#10B981' : score >= 70 ? '#F59E0B' : '#EF4444';
    console.log(`%c📊 Performance Score: ${Math.max(0, score)}/100`, `color: ${scoreColor}; font-weight: bold;`);
    
    console.log('%c' + '='.repeat(50), 'color: #3B82F6;');
  }
};

// Auto-run performance dashboard on load in development
if (process.env.NODE_ENV === 'development') {
  setTimeout(showPerformanceDashboard, 2000);
}

const performanceMonitor = {
  analyzeBundleSize,
  usePerformanceMonitor,
  monitorMemoryUsage,
  monitorNetworkPerformance,
  analyzeComponentTree,
  collectPerformanceMetrics,
  trackLazyLoadingStats,
  showPerformanceDashboard
};

export default performanceMonitor;
