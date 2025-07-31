/**
 * Protected Admin Route Component - Phase 13
 * Route protection for admin-only pages with role-based access control
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../LoadingSpinner';

const ProtectedAdminRoute = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-lg text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has admin role
  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-red-800 mb-2">Access Denied</h2>
          <p className="text-red-600 mb-4">
            You don't have permission to access the admin panel.
          </p>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Current role: <span className="font-medium">{user?.role || 'user'}</span>
            </p>
            <p className="text-sm text-gray-600">
              Required role: <span className="font-medium">admin</span>
            </p>
          </div>
          <div className="mt-6 space-x-4">
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // User is authenticated and has admin role
  return children;
};

export default ProtectedAdminRoute;
