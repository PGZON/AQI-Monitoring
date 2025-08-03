/**
 * Personal Insights Banner Component
 * Shows personalized AQI insights and statistics
 */

import React from 'react';
import { getAQICategoryColor } from '../../utils/getAQICategoryColor';

/**
 *         <InsightStat
          value={stats.daysTracked || 0}
          label="Days Tracked"
          icon="📅"
          color="blue"
        />
        
        <InsightStat
          value={stats.locationsVisited || 0}
          label="Locations"
          icon="🗺️"
          color="green"
        />
        
        <InsightStat
          value={stats.checksThisWeek || 0}
          label="This Week"
          icon="🔄"
          color="purple"
        />nt
 */
const InsightStat = ({ value, label, icon, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-800 border-blue-200',
    green: 'bg-green-50 text-green-800 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    red: 'bg-red-50 text-red-800 border-red-200',
    purple: 'bg-purple-50 text-purple-800 border-purple-200'
  };

  return (
    <div className={`border rounded-lg p-3 ${colorClasses[color]}`}>
      <div className="flex items-center space-x-2">
        <span className="text-lg">{icon}</span>
        <div>
          <div className="font-bold text-lg">{value}</div>
          <div className="text-xs font-medium">{label}</div>
        </div>
      </div>
    </div>
  );
};

/**
 * Trend Arrow Component
 */
const TrendArrow = ({ direction, percentage }) => {
  const getTrendInfo = () => {
    switch (direction) {
      case 'improving':
        return {
          arrow: '📈',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          text: 'Improving'
        };
      case 'declining':
        return {
          arrow: '📉',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          text: 'Declining'
        };
      default:
        return {
          arrow: '➡️',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          text: 'Stable'
        };
    }
  };

  const trend = getTrendInfo();

  return (
    <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full ${trend.bgColor}`}>
      <span>{trend.arrow}</span>
      <span className={`font-medium text-sm ${trend.color}`}>
        {trend.text} {percentage > 0 && `${percentage}%`}
      </span>
    </div>
  );
};

/**
 * Quick Achievement Badge
 */
const AchievementBadge = ({ title, description, icon, earned = false }) => {
  return (
    <div className={`p-3 rounded-lg border-2 ${
      earned 
        ? 'border-yellow-300 bg-yellow-50' 
        : 'border-gray-200 bg-gray-50'
    }`}>
      <div className="flex items-center space-x-3">
        <div className={`text-2xl ${earned ? '' : 'grayscale opacity-50'}`}>
          {icon}
        </div>
        <div className="flex-1">
          <h4 className={`font-medium text-sm ${
            earned ? 'text-yellow-800' : 'text-gray-600'
          }`}>
            {title}
          </h4>
          <p className={`text-xs ${
            earned ? 'text-yellow-700' : 'text-gray-500'
          }`}>
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Main Personal Insights Banner Component
 */
const PersonalInsightsBanner = ({ 
  insights,
  compact = false,
  loading = false,
  error = null 
}) => {
  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-16 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-lg border border-red-200 p-6">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">💡</div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Insights Unavailable</h3>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // Provide default insights structure if none exists
  const safeInsights = insights || {
    primary: "Welcome to AQI Analytics! Start tracking to see your personalized insights.",
    stats: {
      daysTracked: 0,
      locationsVisited: 0,
      checksThisWeek: 0,
      bestAQIThisWeek: null,
      avgAQIThisWeek: null
    },
    trend: {
      direction: 'improving',
      percentage: 0
    }
  };

  // Empty state
  if (!safeInsights || !safeInsights.stats) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center">
          <div className="text-gray-400 text-4xl mb-4">💡</div>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Insights Yet</h3>
          <p className="text-gray-500 text-sm">
            Keep using the app to generate personalized air quality insights!
          </p>
        </div>
      </div>
    );
  }

  const { primary, stats = {}, trend = {} } = safeInsights;
  const bestAQIColors = stats.bestAQIThisWeek ? getAQICategoryColor(stats.bestAQIThisWeek) : null;

  // Compact version for smaller spaces
  if (compact) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-4">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">💡</div>
          <div className="flex-1">
            <p className="font-medium text-blue-900 text-sm">{primary}</p>
            <div className="flex items-center space-x-4 mt-2">
              <span className="text-xs text-blue-700">
                {stats.daysTracked || 0} days tracked
              </span>
              <TrendArrow direction={trend.direction || 'improving'} percentage={trend.percentage || 0} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Personal Insights</h3>
        <p className="text-sm text-gray-600">
          Your personalized air quality tracking summary
        </p>
      </div>

      {/* Primary Insight */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6">
        <div className="flex items-start space-x-4">
          <div className="text-3xl">💡</div>
          <div className="flex-1">
            <p className="text-lg font-medium text-blue-900 mb-3">{primary}</p>
            <div className="flex items-center space-x-3">
              <TrendArrow direction={trend.direction || 'improving'} percentage={trend.percentage || 0} />
              <span className="text-sm text-blue-700">
                <p className="text-sm text-gray-600 mb-4">
                Based on your {stats.daysTracked || 0} days of tracking
              </p>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <InsightStat
          value={stats.daysTracked}
          label="Days Tracked"
          icon="📅"
          color="blue"
        />
        
        <InsightStat
          value={stats.locationsVisited}
          label="Locations Visited"
          icon="🗺️"
          color="green"
        />
        
        <InsightStat
          value={stats.checksThisWeek}
          label="Checks This Week"
          icon="👀"
          color="purple"
        />
        
        <div className="bg-white border rounded-lg p-3 relative">
          <div className="flex items-center space-x-2">
            <span className="text-lg">🏆</span>
            <div>
              <div 
                className="font-bold text-lg px-2 py-1 rounded text-white text-xs"
                style={{ backgroundColor: bestAQIColors?.hex || '#6B7280' }}
              >
                {stats.bestAQIThisWeek || '--'}
              </div>
              <div className="text-xs font-medium text-gray-600 mt-1">Best AQI</div>
            </div>
          </div>
        </div>
      </div>

      {/* Achievement Badges */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-900 mb-3">Achievements</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <AchievementBadge
            title="Air Quality Aware"
            description="Track AQI for 7+ days"
            icon="🌟"
            earned={(stats.daysTracked || 0) >= 7}
          />
          
          <AchievementBadge
            title="Location Explorer"
            description="Check AQI in 3+ locations"
            icon="🗺️"
            earned={(stats.locationsVisited || 0) >= 3}
          />
          
          <AchievementBadge
            title="Health Conscious"
            description="Check AQI 20+ times in a week"
            icon="💚"
            earned={(stats.checksThisWeek || 0) >= 20}
          />
          
          <AchievementBadge
            title="Clean Air Finder"
            description="Find location with AQI < 30"
            icon="🌬️"
            earned={(stats.bestAQIThisWeek || 100) < 30}
          />
        </div>
      </div>

      {/* Weekly Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-3">This Week's Summary</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">{stats.avgAQIThisWeek || '--'}</div>
            <div className="text-sm text-gray-600">Average AQI</div>
          </div>
          
          <div>
            <div className="text-2xl font-bold text-gray-900">{stats.checksThisWeek || 0}</div>
            <div className="text-sm text-gray-600">Total Checks</div>
          </div>
          
          <div>
            <div className="text-2xl font-bold text-gray-900">{stats.locationsVisited || 0}</div>
            <div className="text-sm text-gray-600">Locations</div>
          </div>
        </div>
      </div>

      {/* Tips Section */}
      <div className="mt-6 p-4 bg-green-50 rounded-lg">
        <div className="flex items-start space-x-3">
          <div className="text-xl">🌱</div>
          <div>
            <h4 className="font-semibold text-green-800 mb-1">Keep It Up!</h4>
            <p className="text-sm text-green-700">
              {trend.direction === 'improving' 
                ? "You're doing great at tracking air quality! Your awareness is improving your daily decisions."
                : "Stay consistent with checking air quality to make informed decisions about outdoor activities."
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalInsightsBanner;
