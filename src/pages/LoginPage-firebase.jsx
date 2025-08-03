import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GoogleSignInButton from '../components/GoogleSignInButton';
import UserProfile from '../components/UserProfile';

const LoginPage = () => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  // Redirect if already authenticated
  if (isAuthenticated()) {
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

        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Sign in to your account
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                Use your Google account to access the AQI monitoring dashboard
              </p>
            </div>

            <GoogleSignInButton
              className="w-full"
              onSignInSuccess={(user) => {
                console.log('Login successful:', user.email);
              }}
              onSignInError={(error) => {
                console.error('Login failed:', error.message);
              }}
            />

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                By signing in, you agree to our{' '}
                <a href="#" className="text-blue-600 hover:text-blue-500">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-blue-600 hover:text-blue-500">
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Demo Section */}
        <div className="mt-8 bg-white py-6 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Firebase Authentication Demo
            </h3>
            <UserProfile />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
