import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  console.log('🌐 PublicRoute check:', { 
    hasUser: !!user, 
    loading, 
    userEmail: user?.email 
  });

  // Show loading spinner while checking authentication
  if (loading) {
    console.log('⏳ PublicRoute: Still loading authentication...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect to dashboard if already authenticated
  if (user) {
    console.log('✅ PublicRoute: User authenticated, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  console.log('🌐 PublicRoute: No user, rendering public content');
  return children;
};

export default PublicRoute;
