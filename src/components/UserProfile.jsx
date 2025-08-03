/**
 * User Profile Component
 * Shows current authentication status and user information
 */

import React from 'react';
import { useAuth } from '../context/AuthContext';

const UserProfile = () => {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center p-4">
        <div className="bg-gray-100 rounded-lg p-4">
          <p className="text-gray-600">Not signed in</p>
          <p className="text-sm text-gray-500 mt-1">Please sign in to continue</p>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-center space-x-3">
        {user.photoURL && (
          <img
            src={user.photoURL}
            alt={user.displayName || 'User'}
            className="w-10 h-10 rounded-full"
          />
        )}
        <div className="flex-1">
          <p className="font-medium text-gray-900">
            {user.displayName || 'User'}
          </p>
          <p className="text-sm text-gray-600">{user.email}</p>
        </div>
      </div>
      
      <div className="mt-3 flex items-center justify-between">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          ✓ Authenticated
        </span>
        
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Sign out
        </button>
      </div>
    </div>
  );
};

export default UserProfile;
