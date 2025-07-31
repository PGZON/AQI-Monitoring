/**
 * Admin Dashboard Component - Phase 13
 * Main overview dashboard for admin panel with system metrics and health status
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import adminService from '../../services/adminService';
import MetricCard, { MetricCardsGrid } from '../../components/admin/MetricCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

const AdminDashboard = () => {
  const navigate = useNavigate();
  
  // State management
  const [dashboardData, setDashboardData] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [apiUsage, setApiUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Data fetching
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [metrics, health, usage] = await Promise.all([
        adminService.getDashboardMetrics(),
        adminService.getSystemHealth(),
        adminService.getAPIUsageStats('24h')
      ]);

      setDashboardData(metrics);
      setSystemHealth(health);
      setApiUsage(usage);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh setup
  useEffect(() => {
    fetchDashboardData();

    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchDashboardData, 60000); // Refresh every minute
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchDashboardData, autoRefresh]);

  // Manual refresh
  const handleRefresh = useCallback(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Loading state
  if (loading && !dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-lg text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-800 mb-2">Dashboard Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
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
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="mt-2 text-gray-600">
                System overview and performance metrics
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

              {/* Refresh button */}
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span className={loading ? 'animate-spin' : ''}>🔄</span>
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Last updated info */}
          {lastUpdated && (
            <div className="mt-4 text-sm text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>

        {/* System Health Status */}
        {systemHealth && (
          <div className="mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">System Health</h2>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  systemHealth.status === 'healthy' 
                    ? 'bg-green-100 text-green-800'
                    : systemHealth.status === 'warning'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {systemHealth.status === 'healthy' ? '✅ Healthy' : 
                   systemHealth.status === 'warning' ? '⚠️ Warning' : '❌ Error'}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Uptime</div>
                  <div className="text-lg font-medium text-gray-900">{systemHealth.uptime}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Memory Usage</div>
                  <div className="text-lg font-medium text-gray-900">
                    {systemHealth.memory ? 
                      `${Math.round((systemHealth.memory.used / systemHealth.memory.total) * 100)}%` 
                      : 'N/A'
                    }
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">DB Connections</div>
                  <div className="text-lg font-medium text-gray-900">
                    {systemHealth.database?.connections || 0}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Key Metrics */}
        {dashboardData && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Key Metrics</h2>
            <MetricCardsGrid columns={4}>
              <MetricCard
                title="Total Users"
                value={dashboardData.totalUsers}
                icon="👥"
                trend={5.2}
                trendDirection="up"
                color="blue"
                onClick={() => navigate('/admin/users')}
                actionLabel="View Users"
                onAction={() => navigate('/admin/users')}
              />
              
              <MetricCard
                title="Active Users"
                value={dashboardData.activeUsers}
                icon="🟢"
                trend={12.3}
                trendDirection="up"
                color="green"
                subtitle="Last 24 hours"
              />
              
              <MetricCard
                title="API Requests"
                value={dashboardData.apiRequests}
                icon="📡"
                trend={-2.1}
                trendDirection="down"
                color="blue"
                subtitle="Last 24 hours"
                onClick={() => navigate('/admin/logs')}
              />
              
              <MetricCard
                title="Average AQI"
                value={dashboardData.averageAQI}
                icon="🌬️"
                trend={8.5}
                trendDirection="up"
                color={dashboardData.averageAQI > 100 ? 'red' : dashboardData.averageAQI > 50 ? 'yellow' : 'green'}
                subtitle="Global average"
              />
            </MetricCardsGrid>
          </div>
        )}

        {/* Secondary Metrics */}
        {dashboardData && (
          <div className="mb-8">
            <MetricCardsGrid columns={4}>
              <MetricCard
                title="ML Model Runs"
                value={dashboardData.modelRuns}
                icon="🤖"
                color="purple"
                subtitle="Last 24 hours"
                onClick={() => navigate('/admin/ml')}
                actionLabel="View Models"
                onAction={() => navigate('/admin/ml')}
              />
              
              <MetricCard
                title="Data Points"
                value={dashboardData.dataPoints}
                icon="📊"
                color="blue"
                subtitle="Total collected"
                onClick={() => navigate('/admin/data')}
              />
              
              <MetricCard
                title="Alerts Sent"
                value={dashboardData.alertsSent}
                icon="🚨"
                color="red"
                subtitle="Last 24 hours"
              />
              
              <MetricCard
                title="System Uptime"
                value={dashboardData.systemUptime}
                icon="⏱️"
                color="green"
                subtitle="Current session"
              />
            </MetricCardsGrid>
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* API Usage Chart */}
          {apiUsage && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">API Usage (24h)</h3>
                <div className="text-sm text-gray-500">
                  Total: {apiUsage.total.requests.toLocaleString()} requests
                </div>
              </div>
              
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={apiUsage.hourly}>
                    <XAxis 
                      dataKey="time" 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(time) => new Date(time).getHours() + ':00'}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      labelFormatter={(time) => new Date(time).toLocaleTimeString()}
                      formatter={(value, name) => [value.toLocaleString(), 'Requests']}
                    />
                    <Area
                      type="monotone"
                      dataKey="requests"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* API Endpoints Usage */}
          {apiUsage && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top API Endpoints</h3>
              
              <div className="space-y-3">
                {apiUsage.byEndpoint.slice(0, 5).map((endpoint, index) => (
                  <div key={endpoint.endpoint} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{endpoint.endpoint}</div>
                        <div className="text-sm text-gray-500">
                          Avg: {endpoint.avgResponseTime}ms
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">
                        {endpoint.requests.toLocaleString()}
                      </div>
                      <div className="text-sm text-red-600">
                        {endpoint.errors} errors
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/admin/users"
              className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <span className="text-2xl">👥</span>
              <div>
                <div className="font-medium text-blue-900">Manage Users</div>
                <div className="text-sm text-blue-600">View and edit user accounts</div>
              </div>
            </Link>

            <Link
              to="/admin/ml"
              className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <span className="text-2xl">🤖</span>
              <div>
                <div className="font-medium text-purple-900">ML Models</div>
                <div className="text-sm text-purple-600">Monitor model performance</div>
              </div>
            </Link>

            <Link
              to="/admin/data"
              className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <span className="text-2xl">📊</span>
              <div>
                <div className="font-medium text-green-900">Data Review</div>
                <div className="text-sm text-green-600">View live pollutant data</div>
              </div>
            </Link>

            <Link
              to="/admin/logs"
              className="flex items-center space-x-3 p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
            >
              <span className="text-2xl">📝</span>
              <div>
                <div className="font-medium text-yellow-900">System Logs</div>
                <div className="text-sm text-yellow-600">Monitor errors and events</div>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-lg">🔄</span>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">System backup completed</div>
                <div className="text-xs text-gray-500">2 minutes ago</div>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              <span className="text-lg">🤖</span>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">ML model training started</div>
                <div className="text-xs text-gray-500">15 minutes ago</div>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <span className="text-lg">👤</span>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">New user registered</div>
                <div className="text-xs text-gray-500">1 hour ago</div>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
              <span className="text-lg">⚠️</span>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">High AQI detected in Los Angeles</div>
                <div className="text-xs text-gray-500">2 hours ago</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
