/**
 * Profile Page Component
 * Main interface for user profile, saved locations, and preferences
 */

import React, { useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import SavedLocations from '../components/SavedLocations';
import PreferencesForm from '../components/PreferencesForm';
import AlertSettings from '../components/AlertSettings';
import LoadingSpinner from '../components/LoadingSpinner';
import PWAInfoCard from '../components/PWAStatus';

/**
 * Profile Info Component
 */
const ProfileInfo = () => {
  const { user: authUser, logout } = useAuth();
  const { profile, stats, loading, errors, updateProfile, clearError } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [avatarFile, setAvatarFile] = useState(null);
  const fileInputRef = useRef(null);

  // Initialize edit form when profile loads
  React.useEffect(() => {
    if (profile && !editForm.name) {
      setEditForm({
        name: profile.name || '',
        email: profile.email || ''
      });
    }
  }, [profile, editForm.name]);

  const handleEditToggle = useCallback(() => {
    if (isEditing) {
      // Cancel editing
      setEditForm({
        name: profile?.name || '',
        email: profile?.email || ''
      });
    }
    setIsEditing(!isEditing);
  }, [isEditing, profile]);

  const handleSaveProfile = useCallback(async () => {
    try {
      await updateProfile(editForm);
      setIsEditing(false);
    } catch (error) {
      // Error handled by context
    }
  }, [editForm, updateProfile]);

  const handleAvatarSelect = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      setAvatarFile(file);
      // Here you could upload the avatar or show a preview
    }
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [logout]);

  if (loading.profile && !profile) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="lg" text="Loading profile..." />
        </div>
      </div>
    );
  }

  const displayProfile = profile || authUser;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
        <div className="flex items-center space-x-2">
          {isEditing ? (
            <>
              <button
                onClick={handleEditToggle}
                className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={loading.profile}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
              >
                {loading.profile && <LoadingSpinner size="sm" />}
                <span>Save</span>
              </button>
            </>
          ) : (
            <button
              onClick={handleEditToggle}
              className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {errors.profile && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">❌ {errors.profile}</p>
          <button
            onClick={() => clearError('profile')}
            className="text-xs text-red-500 hover:text-red-700 underline mt-1"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Avatar Section */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {displayProfile?.avatar ? (
                <img 
                  src={displayProfile.avatar} 
                  alt="Profile" 
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                displayProfile?.name?.charAt(0)?.toUpperCase() || 'U'
              )}
            </div>
            
            {isEditing && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
              >
                📷
              </button>
            )}
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarSelect}
            className="hidden"
          />
          
          {avatarFile && (
            <p className="text-xs text-gray-500 mt-2">
              Selected: {avatarFile.name}
            </p>
          )}
        </div>

        {/* Profile Details */}
        <div className="md:col-span-2 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            {isEditing ? (
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <p className="text-gray-900">{displayProfile?.name || 'Not set'}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            {isEditing ? (
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <p className="text-gray-900">{displayProfile?.email || 'Not set'}</p>
            )}
          </div>

          {/* Provider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Auth Provider</label>
            <div className="flex items-center space-x-2">
              <span className="text-gray-900 capitalize">
                {displayProfile?.provider || profile?.provider || 'Email'}
              </span>
              {displayProfile?.isVerified && (
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                  ✅ Verified
                </span>
              )}
            </div>
          </div>

          {/* Member Since */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Member Since</label>
            <p className="text-gray-900">
              {displayProfile?.createdAt ? 
                new Date(displayProfile.createdAt).toLocaleDateString() : 
                'Unknown'
              }
            </p>
          </div>

          {/* Last Login */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Login</label>
            <p className="text-gray-900">
              {displayProfile?.lastLogin ? 
                new Date(displayProfile.lastLogin).toLocaleString() : 
                'Unknown'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Account Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.totalApiCalls}</div>
              <div className="text-xs text-blue-800">API Calls</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.locationsTracked}</div>
              <div className="text-xs text-green-800">Locations</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{stats.alertsReceived}</div>
              <div className="text-xs text-yellow-800">Alerts</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{stats.accountAge}</div>
              <div className="text-xs text-purple-800">Days Active</div>
            </div>
          </div>
        </div>
      )}

      {/* Account Actions */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Account Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Logout
          </button>
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            Export Data
          </button>
          <button className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Tab Navigation Component
 */
const TabNavigation = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'locations', label: 'Locations', icon: '📍' },
    { id: 'preferences', label: 'Preferences', icon: '⚙️' },
    { id: 'alerts', label: 'Alerts', icon: '🔔' },
    { id: 'pwa', label: 'App Info', icon: '📱' }
  ];

  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

/**
 * Main Profile Page Component
 */
const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('success');

  const showToast = useCallback((message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 5000);
  }, []);
  const { user, logout } = useAuth();

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [logout]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                👤 User Profile
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Navigation Links */}
              <Link
                to="/dashboard"
                className="text-sm text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors flex items-center space-x-1"
              >
                <span>🌬️</span>
                <span>Dashboard</span>
              </Link>
              
              <Link
                to="/forecast"
                className="text-sm text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors flex items-center space-x-1"
              >
                <span>🔮</span>
                <span>Forecast</span>
              </Link>
              
              <div className="text-sm text-gray-700">
                Welcome, <span className="font-medium">{user?.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Settings</h1>
          <p className="text-gray-600">
            Manage your profile, saved locations, and preferences
          </p>
        </div>

        {/* Tab Navigation */}
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab Content */}
        <div className="min-h-[500px]">
          {activeTab === 'profile' && <ProfileInfo />}
          {activeTab === 'locations' && <SavedLocations />}
          {activeTab === 'preferences' && <PreferencesForm />}
          {activeTab === 'alerts' && <AlertSettings onSave={showToast} />}
          {activeTab === 'pwa' && <PWAInfoCard />}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>
            Your data is secure and encrypted • Last updated: {new Date().toLocaleString()}
          </p>
        </div>
      </div>
      
      {/* Simple Toast */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`p-4 rounded-lg shadow-lg ${
            toastType === 'error' 
              ? 'bg-red-500 text-white' 
              : 'bg-green-500 text-white'
          }`}>
            {toastMessage}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
