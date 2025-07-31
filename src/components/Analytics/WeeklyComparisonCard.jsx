/**
 * Weekly Comparison Card Component
 * Shows this week vs last week AQI comparison with visual indicators
 */

import React from 'react';
import { getAQICategory, getAQICategoryColor } from '../../utils/getAQICategoryColor';

/**
 * AQI Comparison Badge Component
 */
const AQIBadge = ({ aqi, label, size = 'normal' }) => {
  const category = getAQICategory(aqi);
  const colors = getAQICategoryColor(aqi);
  
  const sizeClasses = {
    small: 'px-2 py-1 text-xs',
    normal: 'px-3 py-2 text-sm',
    large: 'px-4 py-3 text-base'
  };
  
  return (
    <div className="text-center">
      <div 
        className={`${sizeClasses[size]} rounded-lg font-semibold text-white inline-block min-w-16`}
        style={{ backgroundColor: colors.hex }}
      >
        {aqi}
      </div>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
      <p className="text-xs text-gray-400">{category.label}</p>
    </div>
  );
};

/**
 * Change Indicator Component
 */
const ChangeIndicator = ({ change }) => {
  const { percentage, direction, arrow } = change;
  
  const getChangeColor = () => {
    if (direction === 'better') return 'text-green-600 bg-green-50';
    if (direction === 'worse') return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };
  
  const getChangeText = () => {
    if (direction === 'better') return 'Improved';
    if (direction === 'worse') return 'Worsened';
    return 'No Change';
  };
  
  return (
    <div className={`px-4 py-3 rounded-lg ${getChangeColor()}`}>
      <div className="flex items-center justify-center space-x-2">
        <span className="text-2xl">{arrow}</span>
        <div className="text-center">
          <div className="font-bold text-lg">
            {Math.abs(percentage)}%
          </div>
          <div className="text-sm font-medium">
            {getChangeText()}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Week Stats Component
 */
const WeekStats = ({ weekData, title, subtitle }) => {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="text-center mb-3">
        <h4 className="font-semibold text-gray-900">{title}</h4>
        <p className="text-sm text-gray-600">{subtitle}</p>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Average:</span>
          <AQIBadge aqi={weekData.average} label="" size="small" />
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Best Day:</span>
          <AQIBadge aqi={weekData.bestDay} label="" size="small" />
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Worst Day:</span>
          <AQIBadge aqi={weekData.worstDay} label="" size="small" />
        </div>
      </div>
    </div>
  );
};

/**
 * Health Impact Indicator
 */
const HealthImpactIndicator = ({ thisWeekAvg, lastWeekAvg }) => {
  const getHealthMessage = (aqi) => {
    if (aqi <= 50) return { message: 'Air quality is satisfactory', icon: '😊', color: 'text-green-600' };
    if (aqi <= 100) return { message: 'Air quality is acceptable', icon: '😐', color: 'text-yellow-600' };
    if (aqi <= 150) return { message: 'May cause issues for sensitive groups', icon: '😷', color: 'text-orange-600' };
    return { message: 'Air quality is unhealthy', icon: '😰', color: 'text-red-600' };
  };
  
  const thisWeekHealth = getHealthMessage(thisWeekAvg);
  const improvement = thisWeekAvg < lastWeekAvg;
  
  return (
    <div className="bg-blue-50 rounded-lg p-4">
      <div className="flex items-center space-x-3">
        <div className="text-2xl">{thisWeekHealth.icon}</div>
        <div className="flex-1">
          <p className={`font-medium ${thisWeekHealth.color}`}>
            {thisWeekHealth.message}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {improvement ? 
              '✅ Air quality improved from last week' : 
              '⚠️ Air quality declined from last week'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Main Weekly Comparison Card Component
 */
const WeeklyComparisonCard = ({ 
  data,
  loading = false,
  error = null 
}) => {
  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
          <div className="h-16 bg-gray-200 rounded mt-4"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-lg border border-red-200 p-6">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Comparison Unavailable</h3>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!data) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center">
          <div className="text-gray-400 text-4xl mb-4">📈</div>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Comparison Data</h3>
          <p className="text-gray-500 text-sm">Unable to load weekly comparison data.</p>
        </div>
      </div>
    );
  }

  const { thisWeek, lastWeek, change } = data;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Weekly AQI Comparison</h3>
        <p className="text-sm text-gray-600">
          Comparing this week's air quality performance with last week
        </p>
      </div>

      {/* Main Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* This Week Stats */}
        <WeekStats 
          weekData={thisWeek}
          title="This Week"
          subtitle={`Past ${thisWeek.days} days`}
        />

        {/* Change Indicator */}
        <div className="flex items-center justify-center">
          <ChangeIndicator change={change} />
        </div>

        {/* Last Week Stats */}
        <WeekStats 
          weekData={lastWeek}
          title="Last Week"
          subtitle={`Previous ${lastWeek.days} days`}
        />
      </div>

      {/* Health Impact */}
      <HealthImpactIndicator 
        thisWeekAvg={thisWeek.average}
        lastWeekAvg={lastWeek.average}
      />

      {/* Additional Insights */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-gray-900">
              {thisWeek.days + lastWeek.days}
            </div>
            <div className="text-xs text-gray-600">Days Tracked</div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-gray-900">
              {Math.round((thisWeek.average + lastWeek.average) / 2)}
            </div>
            <div className="text-xs text-gray-600">2-Week Average</div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-gray-900">
              {Math.min(thisWeek.bestDay, lastWeek.bestDay)}
            </div>
            <div className="text-xs text-gray-600">Best Overall</div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-gray-900">
              {Math.max(thisWeek.worstDay, lastWeek.worstDay)}
            </div>
            <div className="text-xs text-gray-600">Worst Overall</div>
          </div>
        </div>
      </div>

      {/* Footer with tips */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <span className="font-medium">💡 Tip:</span>
          {change.direction === 'better' ? 
            ' Great progress! Keep monitoring to maintain good air quality.' :
            change.direction === 'worse' ?
            ' Consider checking forecast and planning outdoor activities accordingly.' :
            ' Air quality has been consistent. Continue monitoring for changes.'
          }
        </p>
      </div>
    </div>
  );
};

export default WeeklyComparisonCard;
