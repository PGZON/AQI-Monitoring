/**
 * Data Review Component - Phase 13
 * Admin interface for monitoring live pollutant data and data quality metrics
 */

import React, { useState, useEffect, useCallback } from 'react';
import adminService from '../../services/adminService';
import LoadingSpinner from '../../components/LoadingSpinner';
import MetricCard, { MetricCardsGrid } from '../../components/admin/MetricCard';

const DataReview = () => {
  const [pollutantData, setPollutantData] = useState([]);
  const [dataQuality, setDataQuality] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    location: '',
    status: 'all',
    aqiRange: 'all'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('lastUpdated');
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchData = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const [dataResponse, qualityResponse] = await Promise.all([
        adminService.getLivePollutantData(page, 50, { 
          ...filters, 
          sortBy, 
          sortOrder 
        }),
        adminService.getDataQualityMetrics('24h')
      ]);

      setPollutantData(dataResponse.data);
      setTotalPages(Math.ceil(dataResponse.total / 50));
      setCurrentPage(page);
      setDataQuality(qualityResponse);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load pollutant data');
    } finally {
      setLoading(false);
    }
  }, [filters, sortBy, sortOrder]);

  useEffect(() => {
    fetchData(1);
  }, [fetchData]);

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  }, []);

  const handleSort = useCallback((field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  }, [sortBy, sortOrder]);

  const handleExportData = useCallback(async () => {
    try {
      const blob = await adminService.exportData('csv', '24h', filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `pollutant-data-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to export data:', err);
      alert('Failed to export data. Please try again.');
    }
  }, [filters]);

  const getAQIColor = (aqi) => {
    if (aqi <= 50) return 'text-green-600';
    if (aqi <= 100) return 'text-yellow-600';
    if (aqi <= 150) return 'text-orange-600';
    if (aqi <= 200) return 'text-red-600';
    if (aqi <= 300) return 'text-purple-600';
    return 'text-red-800';
  };

  const getAQIBgColor = (aqi) => {
    if (aqi <= 50) return 'bg-green-100';
    if (aqi <= 100) return 'bg-yellow-100';
    if (aqi <= 150) return 'bg-orange-100';
    if (aqi <= 200) return 'bg-red-100';
    if (aqi <= 300) return 'bg-purple-100';
    return 'bg-red-200';
  };

  const getAQICategory = (aqi) => {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'offline': return 'bg-red-100 text-red-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (loading && pollutantData.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-lg text-gray-600">Loading pollutant data...</p>
        </div>
      </div>
    );
  }

  if (error && pollutantData.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-800 mb-2">Error Loading Data</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => fetchData(1)}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Live Data Review</h1>
              <p className="mt-2 text-gray-600">
                Monitor real-time pollutant data and data quality metrics
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleExportData}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                📊 Export Data
              </button>
              
              <button
                onClick={() => fetchData(currentPage)}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span className={loading ? 'animate-spin' : ''}>🔄</span>
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Data Quality Metrics */}
        {dataQuality && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Quality (24h)</h2>
            <MetricCardsGrid columns={5}>
              <MetricCard
                title="Completeness"
                value={`${Math.round(dataQuality.completeness * 100)}%`}
                icon="📊"
                color={dataQuality.completeness >= 0.95 ? 'green' : dataQuality.completeness >= 0.85 ? 'yellow' : 'red'}
                subtitle="Data availability"
              />
              
              <MetricCard
                title="Accuracy" 
                value={`${Math.round(dataQuality.accuracy * 100)}%`}
                icon="🎯"
                color={dataQuality.accuracy >= 0.9 ? 'green' : dataQuality.accuracy >= 0.8 ? 'yellow' : 'red'}
                subtitle="Data correctness"
              />
              
              <MetricCard
                title="Freshness"
                value={`${Math.round(dataQuality.freshness * 100)}%`}
                icon="⏰"
                color={dataQuality.freshness >= 0.9 ? 'green' : dataQuality.freshness >= 0.8 ? 'yellow' : 'red'}
                subtitle="Recent updates"
              />
              
              <MetricCard
                title="Total Records"
                value={dataQuality.totalRecords}
                icon="📋"
                color="blue"
                subtitle="Data points collected"
              />
              
              <MetricCard
                title="Error Rate"
                value={`${Math.round(dataQuality.errorRate * 100)}%`}
                icon="⚠️"
                color={dataQuality.errorRate <= 0.02 ? 'green' : dataQuality.errorRate <= 0.05 ? 'yellow' : 'red'}
                subtitle="Failed readings"
              />
            </MetricCardsGrid>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                placeholder="Search by location..."
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="offline">Offline</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                AQI Range
              </label>
              <select
                value={filters.aqiRange}
                onChange={(e) => handleFilterChange('aqiRange', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Ranges</option>
                <option value="good">Good (0-50)</option>
                <option value="moderate">Moderate (51-100)</option>
                <option value="unhealthy_sensitive">Unhealthy for Sensitive (101-150)</option>
                <option value="unhealthy">Unhealthy (151-200)</option>
                <option value="very_unhealthy">Very Unhealthy (201-300)</option>
                <option value="hazardous">Hazardous (300+)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('location')}
                  >
                    Location {sortBy === 'location' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('aqi')}
                  >
                    AQI {sortBy === 'aqi' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pollutants
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('lastUpdated')}
                  >
                    Last Updated {sortBy === 'lastUpdated' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pollutantData.map((station) => (
                  <tr key={station.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {station.location}
                        </div>
                        <div className="text-sm text-gray-500">
                          {station.latitude?.toFixed(4)}, {station.longitude?.toFixed(4)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(station.status)}`}>
                        {station.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getAQIBgColor(station.aqi)} ${getAQIColor(station.aqi)}`}>
                        {station.aqi}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {getAQICategory(station.aqi)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>PM2.5: <span className="font-medium">{station.pm25}</span></div>
                        <div>PM10: <span className="font-medium">{station.pm10}</span></div>
                        <div>NO2: <span className="font-medium">{station.no2}</span></div>
                        <div>SO2: <span className="font-medium">{station.so2}</span></div>
                        <div>CO: <span className="font-medium">{station.co}</span></div>
                        <div>O3: <span className="font-medium">{station.o3}</span></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTimestamp(station.lastUpdated)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => fetchData(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => fetchData(currentPage + 1)}
                  disabled={currentPage === totalPages || loading}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing page <span className="font-medium">{currentPage}</span> of{' '}
                    <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => fetchData(currentPage - 1)}
                      disabled={currentPage === 1 || loading}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => fetchData(currentPage + 1)}
                      disabled={currentPage === totalPages || loading}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataReview;
