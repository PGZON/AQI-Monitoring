/**
 * Metric Card Component - Phase 13
 * Reusable card component for displaying admin dashboard metrics
 */

import React from 'react';
import LoadingSpinner from '../LoadingSpinner';

const MetricCard = ({
  title,
  value,
  unit = '',
  icon,
  trend = null,
  trendDirection = null,
  loading = false,
  error = null,
  onClick = null,
  className = '',
  color = 'blue',
  subtitle = null,
  actionLabel = null,
  onAction = null
}) => {
  const getColorClasses = (color) => {
    const colors = {
      blue: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        icon: 'text-blue-600',
        text: 'text-blue-900',
        trend: {
          up: 'text-green-600',
          down: 'text-red-600',
          neutral: 'text-gray-600'
        }
      },
      green: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        icon: 'text-green-600',
        text: 'text-green-900',
        trend: {
          up: 'text-green-600',
          down: 'text-red-600',
          neutral: 'text-gray-600'
        }
      },
      red: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: 'text-red-600',
        text: 'text-red-900',
        trend: {
          up: 'text-red-600',
          down: 'text-green-600',
          neutral: 'text-gray-600'
        }
      },
      yellow: {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        icon: 'text-yellow-600',
        text: 'text-yellow-900',
        trend: {
          up: 'text-green-600',
          down: 'text-red-600',
          neutral: 'text-gray-600'
        }
      },
      gray: {
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        icon: 'text-gray-600',
        text: 'text-gray-900',
        trend: {
          up: 'text-green-600',
          down: 'text-red-600',
          neutral: 'text-gray-600'
        }
      }
    };
    return colors[color] || colors.blue;
  };

  const colorClasses = getColorClasses(color);

  const formatValue = (val) => {
    if (typeof val === 'number') {
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`;
      } else if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}K`;
      }
      return val.toLocaleString();
    }
    return val;
  };

  const getTrendIcon = (direction) => {
    switch (direction) {
      case 'up': return '↗️';
      case 'down': return '↘️';
      case 'neutral': return '→';
      default: return '';
    }
  };

  if (error) {
    return (
      <div className={`bg-white rounded-lg border border-red-200 p-6 ${className}`}>
        <div className="text-center">
          <div className="text-red-500 text-2xl mb-2">⚠️</div>
          <div className="text-sm font-medium text-red-800 mb-1">{title}</div>
          <div className="text-xs text-red-600">Failed to load</div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`bg-white rounded-lg border ${colorClasses.border} p-6 transition-all duration-200 hover:shadow-md ${
        onClick ? 'cursor-pointer hover:scale-105' : ''
      } ${className}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">{title}</h3>
            {icon && (
              <div className={`text-2xl ${colorClasses.icon}`}>
                {icon}
              </div>
            )}
          </div>

          {/* Value */}
          <div className="mb-2">
            {loading ? (
              <div className="flex items-center">
                <LoadingSpinner size="sm" />
                <span className="ml-2 text-gray-500">Loading...</span>
              </div>
            ) : (
              <div className="flex items-baseline">
                <span className={`text-2xl font-bold ${colorClasses.text}`}>
                  {formatValue(value)}
                </span>
                {unit && (
                  <span className="ml-1 text-sm text-gray-500">{unit}</span>
                )}
              </div>
            )}
          </div>

          {/* Subtitle */}
          {subtitle && (
            <div className="text-xs text-gray-500 mb-2">
              {subtitle}
            </div>
          )}

          {/* Trend */}
          {trend !== null && trendDirection && (
            <div className="flex items-center">
              <span className="text-sm mr-1">
                {getTrendIcon(trendDirection)}
              </span>
              <span className={`text-sm font-medium ${colorClasses.trend[trendDirection]}`}>
                {Math.abs(trend)}%
              </span>
              <span className="text-xs text-gray-500 ml-1">
                {trendDirection === 'up' ? 'increase' : trendDirection === 'down' ? 'decrease' : 'no change'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action Button */}
      {actionLabel && onAction && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAction();
            }}
            className={`text-sm font-medium ${colorClasses.icon} hover:underline`}
          >
            {actionLabel} →
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Metric Cards Grid Component
 */
export const MetricCardsGrid = ({ children, columns = 4, className = '' }) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
    6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
  };

  return (
    <div className={`grid ${gridCols[columns] || gridCols[4]} gap-6 ${className}`}>
      {children}
    </div>
  );
};

/**
 * Metric Card with Chart Component (for trend visualization)
 */
export const MetricCardWithChart = ({
  title,
  value,
  unit = '',
  icon,
  chartData = [],
  chartColor = '#3b82f6',
  loading = false,
  error = null,
  className = ''
}) => {
  if (error) {
    return <MetricCard title={title} value="Error" error={error} className={className} />;
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          {loading ? (
            <div className="flex items-center mt-2">
              <LoadingSpinner size="sm" />
              <span className="ml-2 text-gray-500">Loading...</span>
            </div>
          ) : (
            <div className="flex items-baseline mt-2">
              <span className="text-2xl font-bold text-gray-900">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </span>
              {unit && <span className="ml-1 text-sm text-gray-500">{unit}</span>}
            </div>
          )}
        </div>
        {icon && <div className="text-2xl text-blue-600">{icon}</div>}
      </div>

      {/* Mini Chart */}
      {chartData.length > 0 && (
        <div className="h-16">
          <svg className="w-full h-full" viewBox="0 0 300 64">
            <polyline
              fill="none"
              stroke={chartColor}
              strokeWidth="2"
              points={chartData.map((point, index) => 
                `${(index / (chartData.length - 1)) * 300},${64 - (point / Math.max(...chartData)) * 64}`
              ).join(' ')}
            />
          </svg>
        </div>
      )}
    </div>
  );
};

export default MetricCard;
