/**
 * Authentication Context
 * Manages Firebase authentication state and provides auth methods
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { auth } from '../config/firebase';

// Create authentication context
const AuthContext = createContext({});

// Custom hook to use authentication context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Authentication provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  console.log('🔧 AuthProvider render:', { user: !!user, loading });

  // Google sign-in
  const signInWithGoogle = async () => {
    try {
      setError(null);
      // Don't set loading here to avoid conflicts with dashboard

      const provider = new GoogleAuthProvider();
      // Add scopes to get user profile information
      provider.addScope('email');
      provider.addScope('profile');
      provider.addScope('openid');

      // Configure the provider to get full user info
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      const result = await signInWithPopup(auth, provider);
      console.log('✅ Google sign-in successful:', result.user.email);
      
      return result.user;
    } catch (error) {
      console.error('❌ Google sign-in error:', error);
      setError(error.message);
      throw error;
    }
  };

  // Email/Password sign-in
  const signInWithEmail = async (email, password) => {
    try {
      setError(null);
      // Don't set loading here to avoid conflicts with dashboard

      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Email sign-in successful:', result.user.email);
      
      return result.user;
    } catch (error) {
      console.error('❌ Email sign-in error:', error);
      setError(error.message);
      throw error;
    }
  };

  // Email/Password sign-up
  const signUpWithEmail = async (email, password, displayName) => {
    try {
      setError(null);
      // Don't set loading here to avoid conflicts with dashboard

      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with display name if provided
      if (displayName && result.user) {
        await updateProfile(result.user, {
          displayName: displayName
        });
      }
      
      console.log('✅ Email sign-up successful:', result.user.email);
      
      return result.user;
    } catch (error) {
      console.error('❌ Email sign-up error:', error);
      setError(error.message);
      throw error;
    }
  };

  // Password reset
  const resetPassword = async (email) => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
      console.log('✅ Password reset email sent to:', email);
    } catch (error) {
      console.error('❌ Password reset error:', error);
      setError(error.message);
      throw error;
    }
  };

  // Sign out
  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
      console.log('✅ User signed out successfully');
    } catch (error) {
      console.error('❌ Sign out error:', error);
      setError(error.message);
      throw error;
    }
  };

  // Get user ID token for API requests
  const getIdToken = async () => {
    if (!user) return null;
    try {
      const token = await user.getIdToken();
      return token;
    } catch (error) {
      console.error('❌ Error getting ID token:', error);
      return null;
    }
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!user;
  };

  // Get user display info
  const getUserInfo = () => {
    if (!user) return null;
    
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified
    };
  };

  // Listen for authentication state changes
  useEffect(() => {
    console.log('🔧 AuthContext: Setting up auth state listener');
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🔄 Auth state changed:', { 
        hasUser: !!user, 
        email: user?.email,
        displayName: user?.displayName
      });
      
      if (user) {
        console.log('✅ User authenticated:', {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          uid: user.uid
        });
        
        setUser(user);
        setLoading(false);
        
        // Store user in MongoDB backend (non-blocking)
        setTimeout(async () => {
          try {
            const token = await user.getIdToken();
            const response = await fetch('http://localhost:5000/api/auth/google-login', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                emailVerified: user.emailVerified
              })
            });
            
            if (response.ok) {
              const userData = await response.json();
              console.log('✅ User stored in backend:', userData);
            } else {
              console.warn('⚠️ Failed to store user in backend:', response.status);
            }
          } catch (backendError) {
            console.error('❌ Backend storage error:', backendError);
          }
        }, 1000); // Wait 1 second to avoid blocking the UI
        
      } else {
        console.log('❌ No authenticated user');
        setUser(null);
        setLoading(false);
      }
      
      console.log('🔧 AuthContext: Auth state processing complete');
    });

    // Cleanup subscription on unmount
    return () => {
      console.log('🔧 AuthContext: Cleaning up auth listener');
      unsubscribe();
    };
  }, []);

  // Context value
  const value = {
    user,
    loading,
    error,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    logout,
    getIdToken,
    isAuthenticated,
    getUserInfo,
    setError
  };

  console.log('🔧 AuthProvider: Providing context value:', { 
    hasUser: !!user, 
    loading,
    userEmail: user?.email 
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
