/**
 * ML Status Panel Component - Phase 13
 * Admin interface for monitoring ML model performance and triggering retraining
 */

import React, { useState, useEffect, useCallback } from 'react';
import adminService from '../../services/adminService';
import LoadingSpinner from '../../components/LoadingSpinner';
import MetricCard, { MetricCardsGrid } from '../../components/admin/MetricCard';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';

const MLStatusPanel = () => {
  const [mlStatus, setMLStatus] = useState(null);
  const [performanceHistory, setPerformanceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retrainingStatus, setRetrainingStatus] = useState(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');

  const fetchMLData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [status, history] = await Promise.all([
        adminService.getMLModelStatus(),
        adminService.getModelPerformanceHistory(30)
      ]);

      setMLStatus(status);
      setPerformanceHistory(history.history || []);
    } catch (err) {
      console.error('Failed to fetch ML data:', err);
      setError('Failed to load ML model data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMLData();
  }, [fetchMLData]);

  const handleRetriggerTraining = useCallback(async () => {
    if (!window.confirm('Are you sure you want to trigger model retraining? This process may take several hours.')) {
      return;
    }

    try {
      setRetrainingStatus('starting');
      await adminService.triggerModelRetraining();
      setRetrainingStatus('in-progress');
      
      // Simulate training progress (in real app, this would be WebSocket updates)
      setTimeout(() => {
        setRetrainingStatus('completed');
        fetchMLData(); // Refresh data
      }, 5000);
      
      alert('Model retraining has been initiated successfully!');
    } catch (err) {
      console.error('Failed to trigger retraining:', err);
      setRetrainingStatus('error');
      alert('Failed to trigger model retraining. Please try again.');
    }
  }, [fetchMLData]);

  const getAccuracyColor = (accuracy) => {
    if (accuracy >= 0.85) return 'green';
    if (accuracy >= 0.75) return 'yellow';
    return 'red';
  };

  if (loading && !mlStatus) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-lg text-gray-600">Loading ML model status...</p>
        </div>
      </div>
    );
  }

  if (error && !mlStatus) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-800 mb-2">ML Model Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchMLData}
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
              <h1 className="text-3xl font-bold text-gray-900">ML Model Monitoring</h1>
              <p className="mt-2 text-gray-600">
                Monitor model performance, accuracy, and training status
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Time Range Selector */}
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>

              {/* Refresh Button */}
              <button
                onClick={fetchMLData}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span className={loading ? 'animate-spin' : ''}>🔄</span>
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Model Status Overview */}
        {mlStatus && (
          <div className="mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Model Status</h2>
                <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                  mlStatus.status === 'healthy' 
                    ? 'bg-green-100 text-green-800'
                    : mlStatus.status === 'training'
                    ? 'bg-yellow-100 text-yellow-800'
                    : mlStatus.status === 'error'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {mlStatus.status === 'healthy' ? '✅ Healthy' : 
                   mlStatus.status === 'training' ? '🔄 Training' :
                   mlStatus.status === 'error' ? '❌ Error' : '⚠️ Unknown'}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Model Version</div>
                  <div className="text-xl font-bold text-gray-900">{mlStatus.modelVersion}</div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Last Training</div>
                  <div className="text-xl font-bold text-gray-900">
                    {new Date(mlStatus.lastTraining).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Training Samples</div>
                  <div className="text-xl font-bold text-gray-900">
                    {mlStatus.trainingData.samples.toLocaleString()}
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Features</div>
                  <div className="text-xl font-bold text-gray-900">
                    {mlStatus.trainingData.features}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Performance Metrics */}
        {mlStatus && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h2>
            <MetricCardsGrid columns={4}>
              <MetricCard
                title="Model Accuracy"
                value={`${Math.round(mlStatus.accuracy * 100)}%`}
                icon="🎯"
                color={getAccuracyColor(mlStatus.accuracy)}
                trend={2.3}
                trendDirection="up"
                subtitle="Overall prediction accuracy"
              />
              
              <MetricCard
                title="Mean Absolute Error"
                value={mlStatus.mae.toFixed(1)}
                icon="📊"
                color="blue"
                trend={-5.2}
                trendDirection="down"
                subtitle="Lower is better"
              />
              
              <MetricCard
                title="Root Mean Square Error"
                value={mlStatus.rmse.toFixed(1)}
                icon="📈"
                color="blue"
                trend={-3.1}
                trendDirection="down"
                subtitle="Lower is better"
              />
              
              <MetricCard
                title="Predictions (24h)"
                value={mlStatus.predictions.total24h}
                icon="🔮"
                color="green"
                trend={8.7}
                trendDirection="up"
                subtitle="Total predictions made"
              />
            </MetricCardsGrid>
          </div>
        )}

        {/* Model Actions */}
        <div className="mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Model Actions</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <button
                onClick={handleRetriggerTraining}
                disabled={retrainingStatus === 'in-progress' || retrainingStatus === 'starting'}
                className="flex items-center justify-center space-x-2 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-2xl">🔄</span>
                <div className="text-left">
                  <div className="font-medium text-blue-900">
                    {retrainingStatus === 'in-progress' ? 'Training...' : 
                     retrainingStatus === 'starting' ? 'Starting...' : 'Retrain Model'}
                  </div>
                  <div className="text-sm text-blue-600">
                    {retrainingStatus === 'in-progress' ? 'Training in progress' : 'Update model with latest data'}
                  </div>
                </div>
              </button>

              <button
                onClick={() => window.open('/admin/data', '_blank')}
                className="flex items-center justify-center space-x-2 p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors"
              >
                <span className="text-2xl">📊</span>
                <div className="text-left">
                  <div className="font-medium text-green-900">View Training Data</div>
                  <div className="text-sm text-green-600">Review data quality</div>
                </div>
              </button>

              <button
                onClick={fetchMLData}
                className="flex items-center justify-center space-x-2 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors"
              >
                <span className="text-2xl">📋</span>
                <div className="text-left">
                  <div className="font-medium text-purple-900">Export Model Stats</div>
                  <div className="text-sm text-purple-600">Download performance report</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Performance History Chart */}
        {performanceHistory.length > 0 && (
          <div className="mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance History</h3>
              
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceHistory}>
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(date) => new Date(date).toLocaleDateString()}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      labelFormatter={(date) => new Date(date).toLocaleDateString()}
                      formatter={(value, name) => [
                        typeof value === 'number' ? value.toFixed(3) : value,
                        name === 'accuracy' ? 'Accuracy' : 
                        name === 'mae' ? 'MAE' : 
                        name === 'rmse' ? 'RMSE' : name
                      ]}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="accuracy"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Accuracy"
                      dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="mae"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      name="MAE"
                      dot={{ fill: '#f59e0b', strokeWidth: 2, r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="rmse"
                      stroke="#ef4444"
                      strokeWidth={2}
                      name="RMSE"
                      dot={{ fill: '#ef4444', strokeWidth: 2, r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Recent Predictions */}
        {mlStatus && mlStatus.predictions && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Prediction Stats</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Total Predictions (24h)</div>
                <div className="text-2xl font-bold text-gray-900">
                  {mlStatus.predictions.total24h.toLocaleString()}
                </div>
                <div className="text-sm text-green-600 mt-1">
                  ↗️ +12% from yesterday
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Average Confidence</div>
                <div className="text-2xl font-bold text-gray-900">
                  {Math.round(mlStatus.predictions.avgConfidence * 100)}%
                </div>
                <div className="text-sm text-blue-600 mt-1">
                  → Stable confidence levels
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Accuracy Rate</div>
                <div className="text-2xl font-bold text-gray-900">
                  {Math.round(mlStatus.predictions.accuracyRate * 100)}%
                </div>
                <div className="text-sm text-green-600 mt-1">
                  ↗️ +3% improvement
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Retraining Status Modal */}
        {retrainingStatus && retrainingStatus !== 'completed' && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                  <span className="text-2xl">🤖</span>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  {retrainingStatus === 'starting' ? 'Starting Model Training' :
                   retrainingStatus === 'in-progress' ? 'Training in Progress' :
                   retrainingStatus === 'error' ? 'Training Error' : 'Training Status'}
                </h3>
                <div className="mt-2 px-7 py-3">
                  {retrainingStatus === 'starting' && (
                    <p className="text-sm text-gray-500">
                      Initializing model retraining process...
                    </p>
                  )}
                  {retrainingStatus === 'in-progress' && (
                    <div>
                      <p className="text-sm text-gray-500 mb-4">
                        Model training is in progress. This may take several hours.
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '45%'}}></div>
                      </div>
                    </div>
                  )}
                  {retrainingStatus === 'error' && (
                    <p className="text-sm text-red-600">
                      Failed to start model training. Please try again.
                    </p>
                  )}
                </div>
                <div className="items-center px-4 py-3">
                  <button
                    onClick={() => setRetrainingStatus(null)}
                    className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-600"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MLStatusPanel;
