/**
 * Lazy-loaded Heatmap Component
 * Only loads when needed to improve initial bundle size
 */

import React, { Suspense } from 'react';
import LoadingFallback from './LoadingFallback';

// Lazy load the actual heatmap component
const LazyHeatmap = React.lazy(() => import('./Heatmap'));

const HeatmapLazy = (props) => {
  return (
    <Suspense fallback={<LoadingFallback type="component" height="500px" message="Loading interactive map..." />}>
      <LazyHeatmap {...props} />
    </Suspense>
  );
};

export default HeatmapLazy;
