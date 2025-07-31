/**
 * Lazy-loaded Chart Components
 * Heavy visualization components loaded on demand
 */

import React, { Suspense } from 'react';
import LoadingFallback from './LoadingFallback';

// Lazy load forecast chart components
const LazyAQIForecastChart = React.lazy(() => import('./AQIForecastChart'));
const LazyForecastChart = React.lazy(() => import('./ForecastChart'));
const LazyForecastDashboard = React.lazy(() => import('./ForecastDashboard'));

// Lazy load analytics chart components
const LazyAQILineChart = React.lazy(() => import('./Analytics/AQILineChart'));

/**
 * Lazy AQI Forecast Chart
 */
export const AQIForecastChartLazy = (props) => {
  return (
    <Suspense fallback={<LoadingFallback type="chart" message="Loading forecast chart..." />}>
      <LazyAQIForecastChart {...props} />
    </Suspense>
  );
};

/**
 * Lazy Forecast Chart
 */
export const ForecastChartLazy = (props) => {
  return (
    <Suspense fallback={<LoadingFallback type="chart" message="Loading prediction chart..." />}>
      <LazyForecastChart {...props} />
    </Suspense>
  );
};

/**
 * Lazy Forecast Dashboard
 */
export const ForecastDashboardLazy = (props) => {
  return (
    <Suspense fallback={<LoadingFallback type="cards" cards={4} />}>
      <LazyForecastDashboard {...props} />
    </Suspense>
  );
};

/**
 * Lazy AQI Line Chart for Analytics
 */
export const AQILineChartLazy = (props) => {
  return (
    <Suspense fallback={<LoadingFallback type="chart" message="Loading trend analysis..." />}>
      <LazyAQILineChart {...props} />
    </Suspense>
  );
};

// Default export for the most commonly used chart
export default AQIForecastChartLazy;
