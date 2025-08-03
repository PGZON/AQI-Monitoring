import React from 'react';
import { useAuth } from '../context/AuthContext';
import GoogleSignInButton from '../components/GoogleSignInButton';
import EmailLoginForm from '../components/EmailLoginForm';

const LoginPage = () => {
  const { user, loading } = useAuth();

  console.log('📝 LoginPage: Rendering login form', { 
    hasUser: !!user, 
    loading,
    userEmail: user?.email 
  });

  // No redirect logic here - let PublicRoute handle it

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
                Choose your preferred sign-in method
              </p>
            </div>

            {/* Google Sign-In */}
            <GoogleSignInButton
              className="w-full"
              onSignInSuccess={(user) => {
                console.log('Google login successful:', user.email, user.displayName);
              }}
              onSignInError={(error) => {
                console.error('Google login failed:', error.message);
              }}
            />

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* Email/Password Form */}
            <EmailLoginForm
              onLoginSuccess={(user) => {
                console.log('Email login successful:', user.email, user.displayName);
              }}
              onLoginError={(error) => {
                console.error('Email login failed:', error.message);
              }}
            />

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                By signing in, you agree to our{' '}
                <button className="text-blue-600 hover:text-blue-500 underline">
                  Terms of Service
                </button>{' '}
                and{' '}
                <button className="text-blue-600 hover:text-blue-500 underline">
                  Privacy Policy
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
