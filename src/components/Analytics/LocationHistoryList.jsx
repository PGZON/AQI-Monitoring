/**
 * Location History List Component
 * Displays previously viewed/searched locations with AQI data
 */

import React, { useState } from 'react';
import { getAQICategory, getAQICategoryColor } from '../../utils/getAQICategoryColor';

/**
 * Location Card Component
 */
const LocationCard = ({ location, onSelect, onToggleFavorite }) => {
  const category = getAQICategory(location.lastAQI);
  const colors = getAQICategoryColor(location.lastAQI);
  
  // Format last viewed date
  const formatLastViewed = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start justify-between">
        <div className="flex-1" onClick={() => onSelect(location)}>
          <div className="flex items-center space-x-2 mb-2">
            <h4 className="font-semibold text-gray-900">{location.name}</h4>
            {location.isFavorite && (
              <span className="text-yellow-500 text-sm">⭐</span>
            )}
          </div>
          
          <div className="flex items-center space-x-3 mb-2">
            <div 
              className="px-3 py-1 rounded-lg text-white text-sm font-medium"
              style={{ backgroundColor: colors.hex }}
            >
              AQI {location.lastAQI}
            </div>
            <span className="text-xs text-gray-500">{category.label}</span>
          </div>
          
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Last viewed: {formatLastViewed(location.lastViewed)}</span>
            <span>{location.viewCount} views</span>
          </div>
          
          <div className="text-xs text-gray-400 mt-1">
            {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
          </div>
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(location.id);
          }}
          className={`ml-3 p-2 rounded-lg transition-colors ${
            location.isFavorite 
              ? 'text-yellow-500 hover:bg-yellow-50' 
              : 'text-gray-400 hover:bg-gray-50 hover:text-yellow-500'
          }`}
          title={location.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {location.isFavorite ? '⭐' : '☆'}
        </button>
      </div>
    </div>
  );
};

/**
 * Filter and Sort Controls
 */
const FilterControls = ({ 
  sortBy, 
  onSortChange, 
  filterBy, 
  onFilterChange,
  showFavoritesOnly,
  onToggleFavoritesOnly 
}) => {
  const sortOptions = [
    { value: 'recent', label: 'Most Recent' },
    { value: 'frequent', label: 'Most Viewed' },
    { value: 'aqi-low', label: 'Best AQI' },
    { value: 'aqi-high', label: 'Worst AQI' },
    { value: 'name', label: 'Name A-Z' }
  ];

  const filterOptions = [
    { value: 'all', label: 'All Locations' },
    { value: 'good', label: 'Good AQI (0-50)' },
    { value: 'moderate', label: 'Moderate AQI (51-100)' },
    { value: 'unhealthy', label: 'Unhealthy AQI (101+)' }
  ];

  return (
    <div className="bg-gray-50 rounded-lg p-4 mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Sort:</label>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Filter:</label>
            <select
              value={filterBy}
              onChange={(e) => onFilterChange(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {filterOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <button
          onClick={onToggleFavoritesOnly}
          className={`px-3 py-1 text-sm rounded-lg transition-colors ${
            showFavoritesOnly 
              ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          ⭐ Favorites Only
        </button>
      </div>
    </div>
  );
};

/**
 * Empty State Component
 */
const EmptyState = ({ hasLocations, showFavoritesOnly, filterBy }) => {
  if (!hasLocations) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">📍</div>
        <h3 className="text-lg font-semibold text-gray-600 mb-2">No Locations Yet</h3>
        <p className="text-gray-500 text-sm max-w-md mx-auto">
          Start exploring air quality data in different locations. 
          Your viewed locations will appear here for quick access.
        </p>
      </div>
    );
  }

  if (showFavoritesOnly) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">⭐</div>
        <h3 className="text-lg font-semibold text-gray-600 mb-2">No Favorites</h3>
        <p className="text-gray-500 text-sm max-w-md mx-auto">
          Mark locations as favorites by clicking the star icon. 
          Your favorite locations will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="text-center py-12">
      <div className="text-gray-400 text-6xl mb-4">🔍</div>
      <h3 className="text-lg font-semibold text-gray-600 mb-2">No Results</h3>
      <p className="text-gray-500 text-sm max-w-md mx-auto">
        No locations match your current filter criteria. 
        Try adjusting your filters or search in different areas.
      </p>
    </div>
  );
};

/**
 * Main Location History List Component
 */
const LocationHistoryList = ({ 
  locations = [],
  onLocationSelect,
  loading = false,
  error = null 
}) => {
  const [sortBy, setSortBy] = useState('recent');
  const [filterBy, setFilterBy] = useState('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [localLocations, setLocalLocations] = useState(locations);

  // Update local state when props change
  React.useEffect(() => {
    setLocalLocations(locations);
  }, [locations]);

  // Handle favorite toggle
  const handleToggleFavorite = (locationId) => {
    setLocalLocations(prev => 
      prev.map(loc => 
        loc.id === locationId 
          ? { ...loc, isFavorite: !loc.isFavorite }
          : loc
      )
    );
  };

  // Apply filters and sorting
  const filteredAndSortedLocations = React.useMemo(() => {
    let filtered = [...localLocations];

    // Apply favorites filter
    if (showFavoritesOnly) {
      filtered = filtered.filter(loc => loc.isFavorite);
    }

    // Apply AQI filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(loc => {
        const aqi = loc.lastAQI;
        switch (filterBy) {
          case 'good': return aqi <= 50;
          case 'moderate': return aqi > 50 && aqi <= 100;
          case 'unhealthy': return aqi > 100;
          default: return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.lastViewed) - new Date(a.lastViewed);
        case 'frequent':
          return b.viewCount - a.viewCount;
        case 'aqi-low':
          return a.lastAQI - b.lastAQI;
        case 'aqi-high':
          return b.lastAQI - a.lastAQI;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [localLocations, sortBy, filterBy, showFavoritesOnly]);

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
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
          <div className="text-red-500 text-4xl mb-4">📍</div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Location History Unavailable</h3>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Location History</h3>
        <p className="text-sm text-gray-600">
          {localLocations.length} location{localLocations.length !== 1 ? 's' : ''} tracked • 
          {localLocations.filter(loc => loc.isFavorite).length} favorite{localLocations.filter(loc => loc.isFavorite).length !== 1 ? 's' : ''}
        </p>
      </div>

      <FilterControls
        sortBy={sortBy}
        onSortChange={setSortBy}
        filterBy={filterBy}
        onFilterChange={setFilterBy}
        showFavoritesOnly={showFavoritesOnly}
        onToggleFavoritesOnly={() => setShowFavoritesOnly(!showFavoritesOnly)}
      />

      {filteredAndSortedLocations.length === 0 ? (
        <EmptyState 
          hasLocations={localLocations.length > 0}
          showFavoritesOnly={showFavoritesOnly}
          filterBy={filterBy}
        />
      ) : (
        <div className="space-y-3">
          {filteredAndSortedLocations.map(location => (
            <LocationCard
              key={location.id}
              location={location}
              onSelect={onLocationSelect}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      )}

      {/* Footer */}
      {filteredAndSortedLocations.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              Showing {filteredAndSortedLocations.length} of {localLocations.length} locations
            </span>
            <span>
              Click any location to view detailed analytics
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationHistoryList;
