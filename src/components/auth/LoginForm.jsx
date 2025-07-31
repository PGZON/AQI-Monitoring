import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const LoginForm = ({ onShowSignup }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  // Safety check for login function
  React.useEffect(() => {
    console.log('🔧 [LoginForm] Component mounted, login function:', typeof login);
  }, [login]);

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear specific field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = (e) => {
    console.log('🖱️ [LoginForm] Button clicked, event:', e);
    
    // Prevent double execution
    if (isSubmitting) {
      console.log('⚠️ [LoginForm] Already processing, ignoring click');
      return;
    }
    
    console.log('🔄 [LoginForm] Event type:', e?.type);
    console.log('🔄 [LoginForm] Button element:', e?.target);
    console.log('🔄 [LoginForm] Current target:', e?.currentTarget);
    
    // Prevent any default behavior more aggressively
    if (e) {
      if (e.preventDefault) {
        e.preventDefault();
        console.log('✅ preventDefault called');
      }
      if (e.stopPropagation) {
        e.stopPropagation();
        console.log('✅ stopPropagation called');
      }
      if (e.stopImmediatePropagation) {
        e.stopImmediatePropagation();
        console.log('✅ stopImmediatePropagation called');
      }
    }
    
    console.log('🚀 [LoginForm] Login process started - no page refresh');
    console.log('📝 [LoginForm] Form data:', { email: formData.email, password: '***' });
    
    // Make the function async after preventing default
    const performLogin = async () => {
      if (!validateForm()) {
        console.warn('⚠️ [LoginForm] Form validation failed');
        return;
      }

      console.log('✅ [LoginForm] Form validation passed');
      setIsSubmitting(true);
      
      try {
        console.log('🔄 [LoginForm] Calling login function...');
        
        // Safety check
        if (typeof login !== 'function') {
          console.error('❌ [LoginForm] Login function is not available:', typeof login);
          setErrors({ submit: 'Authentication system not ready. Please refresh the page.' });
          return;
        }
        
        const result = await login(formData.email, formData.password);
        
        console.log('📥 [LoginForm] Login result received:', result);
        
        if (result && result.success) {
          console.log('✅ [LoginForm] Login successful, navigating to:', from);
          navigate(from, { replace: true });
        } else {
          console.error('❌ [LoginForm] Login failed:', result?.message || 'Unknown error');
          setErrors({ submit: result?.message || 'Login failed. Please try again.' });
        }
      } catch (error) {
        console.error('💥 [LoginForm] Unexpected error during login:', error);
        setErrors({ submit: 'An unexpected error occurred. Please try again.' });
      } finally {
        setIsSubmitting(false);
        console.log('🏁 [LoginForm] Login process completed');
      }
    };
    
    // Call the async function
    performLogin();
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white shadow-lg rounded-lg px-8 py-6">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>

        <div className="space-y-4">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.email ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter your email"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.password ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Signing In...
              </div>
            ) : (
              'Sign In'
            )}
          </button>
        </div>

        {/* Sign Up Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <button
              onClick={onShowSignup}
              className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:underline"
            >
              Sign up here
            </button>
          </p>
        </div>

        {/* Forgot Password Link */}
        <div className="mt-3 text-center">
          <Link
            to="/forgot-password"
            className="text-sm text-blue-600 hover:text-blue-500 focus:outline-none focus:underline"
          >
            Forgot your password?
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
