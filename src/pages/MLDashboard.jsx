import React, { useState } from 'react';
import MLPrediction from '../components/MLPrediction';
import AQIHeatmap from '../components/AQIHeatmap';

const MLDashboard = () => {
  const [activeTab, setActiveTab] = useState('prediction');

  const tabs = [
    { id: 'prediction', label: 'ML Prediction', icon: '🎯' },
    { id: 'heatmap', label: 'AQI Heatmap', icon: '🗺️' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">ML Dashboard</h1>
              <p className="mt-1 text-sm text-gray-600">
                Advanced AQI predictions and visualizations powered by Machine Learning
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>ML Service Active</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'prediction' && (
          <div>
            <MLPrediction />
          </div>
        )}

        {activeTab === 'heatmap' && (
          <div>
            <AQIHeatmap />
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">ML Model Information</h4>
              <ul className="space-y-1">
                <li>• Location-Aware LSTM Neural Network</li>
                <li>• Validation MAE: 32.75 AQI units</li>
                <li>• 15 input features with temporal encoding</li>
                <li>• 24-hour sequence prediction window</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Features</h4>
              <ul className="space-y-1">
                <li>• Real-time AQI predictions</li>
                <li>• Interactive heatmap visualization</li>
                <li>• Batch processing for multiple locations</li>
                <li>• Custom pollution data input</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Data Sources</h4>
              <ul className="space-y-1">
                <li>• OpenAQ API v3 integration</li>
                <li>• Historical air quality data</li>
                <li>• Meteorological parameters</li>
                <li>• Geographic location features</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MLDashboard;
