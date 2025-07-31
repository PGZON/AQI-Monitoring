import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  console.log('🔧 [AuthProvider] AuthProvider component initializing');
  
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  console.log('📊 [AuthProvider] Initial state:', {
    user: user,
    token: token ? `${token.substring(0, 20)}...` : 'null',
    isAuthenticated: isAuthenticated,
    loading: loading
  });

  // Initialize authentication state on app load
  useEffect(() => {
    console.log('🔄 [AuthProvider] useEffect triggered - initializing auth');
    
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        console.log('🔍 [AuthProvider] Checking stored token:', storedToken ? `${storedToken.substring(0, 20)}...` : 'null');
        
        if (storedToken) {
          // Validate token with backend
          const response = await api.get('/auth/me');
          
          if (response.data.success) {
            setToken(storedToken);
            setUser(response.data.user);
            setIsAuthenticated(true);
          } else {
            // Invalid token, clear storage
            clearAuth();
          }
        }
      } catch (error) {
        console.log('Token validation failed:', error.message);
        clearAuth();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      console.log('🔐 [AuthContext] Starting login process for:', email);
      setLoading(true);
      
      console.log('📡 [AuthContext] Making API request to /auth/login');
      console.log('🔗 [AuthContext] API Base URL:', api.defaults.baseURL);
      
      const response = await api.post('/auth/login', { email, password });
      
      console.log('📥 [AuthContext] Raw API Response:', response);
      console.log('📥 [AuthContext] Response Status:', response.status);
      console.log('📥 [AuthContext] Response Headers:', response.headers);
      console.log('📥 [AuthContext] Response Data:', response.data);
      
      if (response.data.success) {
        const { token: newToken, user: userData } = response.data;
        
        console.log('✅ [AuthContext] Login successful, got token:', newToken?.substring(0, 20) + '...');
        console.log('✅ [AuthContext] User data:', userData);
        
        // Store token and update state
        localStorage.setItem('token', newToken);
        console.log('💾 [AuthContext] Token stored in localStorage');
        
        setToken(newToken);
        setUser(userData);
        setIsAuthenticated(true);
        
        console.log('🔄 [AuthContext] State updated - isAuthenticated:', true);
        console.log('🔄 [AuthContext] Current user state:', userData);
        
        return { success: true, user: userData };
      } else {
        console.warn('⚠️ [AuthContext] Login failed - response not successful:', response.data);
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      console.error('❌ [AuthContext] Login error caught:', error);
      console.error('❌ [AuthContext] Error response:', error.response);
      console.error('❌ [AuthContext] Error status:', error.response?.status);
      console.error('❌ [AuthContext] Error data:', error.response?.data);
      console.error('❌ [AuthContext] Error message:', error.message);
      
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      return { success: false, message };
    } finally {
      setLoading(false);
      console.log('🏁 [AuthContext] Login process completed');
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await api.post('/auth/register', userData);
      
      if (response.data.success) {
        const { token: newToken, user: newUser } = response.data;
        
        // Store token and update state
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(newUser);
        setIsAuthenticated(true);
        
        return { success: true, user: newUser };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async (googleToken) => {
    try {
      setLoading(true);
      const response = await api.post('/auth/google', { token: googleToken });
      
      if (response.data.success) {
        const { token: newToken, user: userData } = response.data;
        
        // Store token and update state
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(userData);
        setIsAuthenticated(true);
        
        return { success: true, user: userData };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Google login failed. Please try again.';
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearAuth();
    // Optional: Call backend logout endpoint
    // api.post('/auth/logout').catch(() => {});
  };

  const clearAuth = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    login,
    register,
    googleLogin,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
