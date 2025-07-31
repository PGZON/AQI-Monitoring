import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginForm from '../components/auth/LoginForm';
import SignupForm from '../components/auth/SignupForm';
import GoogleAuthButton from '../components/auth/GoogleAuthButton';

const LoginPage = () => {
  const [isSignup, setIsSignup] = useState(false);
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  // Redirect if already authenticated
  if (isAuthenticated && !loading) {
    return <Navigate to={from} replace />;
  }

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">AQI Monitor</h1>
          <p className="mt-2 text-gray-600">Air Quality Monitoring System</p>
        </div>

        {/* Toggle Tabs */}
        <div className="bg-white rounded-lg shadow-sm p-1 mb-6">
          <div className="flex">
            <button
              onClick={() => setIsSignup(false)}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                !isSignup
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsSignup(true)}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                isSignup
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="space-y-6">
          {isSignup ? (
            <SignupForm onShowLogin={() => setIsSignup(false)} />
          ) : (
            <LoginForm onShowSignup={() => setIsSignup(true)} />
          )}

          {/* Google OAuth Button */}
          <div className="max-w-md mx-auto">
            <GoogleAuthButton />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            By signing in, you agree to our{' '}
            <a href="/terms" className="text-blue-600 hover:text-blue-500">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-blue-600 hover:text-blue-500">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
