/**
 * Logs Viewer Component - Phase 13
 * Admin interface for viewing system logs and error monitoring
 */

import React, { useState, useEffect, useCallback } from 'react';
import adminService from '../../services/adminService';
import LoadingSpinner from '../../components/LoadingSpinner';
import MetricCard, { MetricCardsGrid } from '../../components/admin/MetricCard';

const LogsViewer = () => {
  const [logs, setLogs] = useState([]);
  const [errorSummary, setErrorSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [expandedLog, setExpandedLog] = useState(null);

  const fetchLogs = useCallback(async (level = 'all', page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const [logsResponse, errorSummaryResponse] = await Promise.all([
        adminService.getSystemLogs(level, page, 100),
        adminService.getErrorSummary('24h')
      ]);

      setLogs(logsResponse.logs);
      setTotalPages(logsResponse.totalPages);
      setCurrentPage(page);
      setErrorSummary(errorSummaryResponse);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
      setError('Failed to load system logs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs(selectedLevel, 1);
  }, [fetchLogs, selectedLevel]);

  // Auto-refresh setup
  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchLogs(selectedLevel, currentPage);
      }, 10000); // Refresh every 10 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchLogs, selectedLevel, currentPage, autoRefresh]);

  const handleLevelChange = useCallback((level) => {
    setSelectedLevel(level);
  }, []);

  const handlePageChange = useCallback((page) => {
    fetchLogs(selectedLevel, page);
  }, [fetchLogs, selectedLevel]);

  const handleClearLogs = useCallback(async () => {
    if (!window.confirm('Are you sure you want to clear old logs? This action cannot be undone.')) {
      return;
    }

    try {
      await adminService.clearLogs('30d');
      alert('Old logs have been cleared successfully.');
      fetchLogs(selectedLevel, 1);
    } catch (err) {
      console.error('Failed to clear logs:', err);
      alert('Failed to clear logs. Please try again.');
    }
  }, [fetchLogs, selectedLevel]);

  const getLevelColor = (level) => {
    switch (level) {
      case 'error': return 'bg-red-100 text-red-800';
      case 'warn': return 'bg-yellow-100 text-yellow-800';
      case 'info': return 'bg-blue-100 text-blue-800';
      case 'debug': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLevelIcon = (level) => {
    switch (level) {
      case 'error': return '❌';
      case 'warn': return '⚠️';
      case 'info': return 'ℹ️';
      case 'debug': return '🔍';
      default: return '📝';
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading && logs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-lg text-gray-600">Loading system logs...</p>
        </div>
      </div>
    );
  }

  if (error && logs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-800 mb-2">Error Loading Logs</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => fetchLogs(selectedLevel, 1)}
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
              <h1 className="text-3xl font-bold text-gray-900">System Logs</h1>
              <p className="mt-2 text-gray-600">
                Monitor system activity, errors, and application events
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Auto-refresh toggle */}
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="text-sm text-gray-600">Auto-refresh</span>
              </label>

              {/* Clear logs button */}
              <button
                onClick={handleClearLogs}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Clear Old Logs
              </button>

              {/* Refresh Button */}
              <button
                onClick={() => fetchLogs(selectedLevel, currentPage)}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span className={loading ? 'animate-spin' : ''}>🔄</span>
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Error Summary */}
        {errorSummary && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Error Summary (24h)</h2>
            <MetricCardsGrid columns={4}>
              <MetricCard
                title="Total Errors"
                value={errorSummary.totalErrors}
                icon="❌"
                color="red"
                subtitle="All error levels"
              />
              
              <MetricCard
                title="Critical Errors"
                value={errorSummary.criticalErrors}
                icon="🚨"
                color="red"
                subtitle="Requires immediate attention"
              />
              
              <MetricCard
                title="Warnings"
                value={errorSummary.warningCount}
                icon="⚠️"
                color="yellow"
                subtitle="Potential issues"
              />
              
              <MetricCard
                title="Error Rate"
                value={`${((errorSummary.totalErrors / (errorSummary.totalErrors + 1000)) * 100).toFixed(2)}%`}
                icon="📊"
                color="blue"
                subtitle="Errors per total events"
              />
            </MetricCardsGrid>
          </div>
        )}

        {/* Log Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">Filter by level:</span>
              {['all', 'error', 'warn', 'info', 'debug'].map((level) => (
                <button
                  key={level}
                  onClick={() => handleLevelChange(level)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    selectedLevel === level
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {getLevelIcon(level)} {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>

            <div className="text-sm text-gray-600">
              Showing {logs.length} logs • Page {currentPage} of {totalPages}
            </div>
          </div>
        </div>

        {/* Logs List */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {logs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-4xl mb-4">📝</div>
              <h3 className="text-lg font-medium text-gray-600 mb-2">No Logs Found</h3>
              <p className="text-gray-500">No logs match the selected criteria.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {logs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="flex-shrink-0">
                        <span className="text-lg">{getLevelIcon(log.level)}</span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getLevelColor(log.level)}`}>
                            {log.level.toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-500">{log.module}</span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">{formatTimestamp(log.timestamp)}</span>
                        </div>
                        
                        <p className="text-sm text-gray-900 mb-1">{log.message}</p>
                        
                        {log.details && (
                          <div className="mt-2">
                            <button
                              onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              {expandedLog === log.id ? 'Hide Details' : 'Show Details'}
                            </button>
                            
                            {expandedLog === log.id && (
                              <div className="mt-2 p-3 bg-gray-100 rounded-md">
                                <pre className="text-xs text-gray-700 whitespace-pre-wrap">{log.details}</pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || loading}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Page <span className="font-medium">{currentPage}</span> of{' '}
                    <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1 || loading}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
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

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Log Management</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => handleLevelChange('error')}
              className="flex items-center justify-center space-x-2 p-4 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors"
            >
              <span className="text-2xl">❌</span>
              <div className="text-left">
                <div className="font-medium text-red-900">View Errors Only</div>
                <div className="text-sm text-red-600">Focus on critical issues</div>
              </div>
            </button>

            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center justify-center space-x-2 p-4 rounded-lg border transition-colors ${
                autoRefresh 
                  ? 'bg-green-50 hover:bg-green-100 border-green-200' 
                  : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
              }`}
            >
              <span className="text-2xl">{autoRefresh ? '⏸️' : '▶️'}</span>
              <div className="text-left">
                <div className={`font-medium ${autoRefresh ? 'text-green-900' : 'text-gray-900'}`}>
                  {autoRefresh ? 'Stop Auto-refresh' : 'Start Auto-refresh'}
                </div>
                <div className={`text-sm ${autoRefresh ? 'text-green-600' : 'text-gray-600'}`}>
                  {autoRefresh ? 'Currently refreshing every 10s' : 'Enable live log updates'}
                </div>
              </div>
            </button>

            <button
              onClick={() => window.open('/admin/system', '_blank')}
              className="flex items-center justify-center space-x-2 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
            >
              <span className="text-2xl">⚙️</span>
              <div className="text-left">
                <div className="font-medium text-blue-900">System Settings</div>
                <div className="text-sm text-blue-600">Configure log levels</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogsViewer;
