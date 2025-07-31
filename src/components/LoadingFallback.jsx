/**
 * Loading Fallback Component for React.Suspense
 * Optimized loading states for lazy-loaded components
 */

import React from 'react';

/**
 * Basic Loading Spinner
 */
export const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-gray-200 border-t-blue-600 ${sizeClasses[size]} ${className}`} />
  );
};

/**
 * Page Loading Fallback
 */
export const PageLoadingFallback = ({ message = 'Loading...' }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <p className="text-lg text-gray-600">{message}</p>
        <div className="mt-2 text-sm text-gray-500">
          Please wait while we load the content
        </div>
      </div>
    </div>
  );
};

/**
 * Component Loading Fallback
 */
export const ComponentLoadingFallback = ({ height = '400px', message = 'Loading component...' }) => {
  return (
    <div 
      className="bg-white rounded-lg border border-gray-200 flex items-center justify-center"
      style={{ height }}
    >
      <div className="text-center">
        <LoadingSpinner size="md" className="mx-auto mb-3" />
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
};

/**
 * Chart Loading Fallback with Skeleton
 */
export const ChartLoadingFallback = ({ height = '400px' }) => {
  return (
    <div 
      className="bg-white rounded-lg border border-gray-200 p-6"
      style={{ height }}
    >
      <div className="animate-pulse">
        {/* Title skeleton */}
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        
        {/* Chart area skeleton */}
        <div className="flex items-end space-x-2 h-64">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bg-gray-200 rounded-t"
              style={{
                height: `${Math.random() * 60 + 20}%`,
                width: '12%'
              }}
            />
          ))}
        </div>
        
        {/* Legend skeleton */}
        <div className="flex items-center justify-center space-x-6 mt-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Card Grid Loading Fallback
 */
export const CardGridLoadingFallback = ({ cards = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(cards)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="w-8 h-8 bg-gray-200 rounded"></div>
            </div>
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Table Loading Fallback
 */
export const TableLoadingFallback = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="animate-pulse">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {[...Array(columns)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
        
        {/* Rows */}
        {[...Array(rows)].map((_, rowIndex) => (
          <div key={rowIndex} className="px-6 py-4 border-b border-gray-200 last:border-b-0">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {[...Array(columns)].map((_, colIndex) => (
                <div key={colIndex} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Default Export - Most commonly used fallback
 */
const LoadingFallback = ({ type = 'page', ...props }) => {
  switch (type) {
    case 'component':
      return <ComponentLoadingFallback {...props} />;
    case 'chart':
      return <ChartLoadingFallback {...props} />;
    case 'cards':
      return <CardGridLoadingFallback {...props} />;
    case 'table':
      return <TableLoadingFallback {...props} />;
    case 'page':
    default:
      return <PageLoadingFallback {...props} />;
  }
};

export default LoadingFallback;
