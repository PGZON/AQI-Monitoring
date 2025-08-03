/**
 * User Profile Component
 * Displays user authentication status and profile information
 */

import React from 'react';
import { useAuth } from '../context/AuthContext';
import GoogleSignInButton from './GoogleSignInButton';

const UserProfile = ({ className = "" }) => {
  const { user, loading, logout, getUserInfo, error } = useAuth();

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-gray-600">Loading...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`space-y-3 ${className}`}>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}
        <GoogleSignInButton
          onSignInSuccess={(user) => {
            console.log('Sign-in successful:', user.email);
          }}
          onSignInError={(error) => {
            console.error('Sign-in error:', error.message);
          }}
        />
      </div>
    );
  }

  const userInfo = getUserInfo();

  const handleLogout = async () => {
    try {
      await logout();
      console.log('Successfully logged out');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 shadow-sm ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        {userInfo.photoURL && (
          <img
            src={userInfo.photoURL}
            alt="Profile"
            className="w-12 h-12 rounded-full border-2 border-gray-200"
          />
        )}
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">
            {userInfo.displayName || 'User'}
          </h3>
          <p className="text-sm text-gray-600">{userInfo.email}</p>
          {userInfo.emailVerified && (
            <span className="inline-flex items-center gap-1 text-xs text-green-600">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Verified
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>User ID:</span>
          <span className="font-mono text-xs">{userInfo.uid.substring(0, 8)}...</span>
        </div>
        <div className="flex justify-between">
          <span>Status:</span>
          <span className="text-green-600 font-medium">Authenticated</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="w-full px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default UserProfile;
