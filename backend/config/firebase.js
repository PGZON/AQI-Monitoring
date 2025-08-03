/**
 * Firebase Configuration for Backend
 * Handles Firebase Admin SDK initialization for server-side authentication
 */

const admin = require('firebase-admin');
require('dotenv').config();

/**
 * Initialize Firebase Admin SDK
 * This is used for verifying Firebase ID tokens on the server side
 */
const initializeFirebaseAdmin = () => {
  try {
    // Check if Firebase Admin is already initialized
    if (admin.apps.length === 0) {
      // For development, we'll use the Firebase config from environment variables
      // In production, you should use a service account key file
      const firebaseConfig = {
        apiKey: process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.FIREBASE_APP_ID,
        measurementId: process.env.FIREBASE_MEASUREMENT_ID
      };

      // Initialize with project ID for development
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID,
        // Note: For production, you should use a service account key:
        // credential: admin.credential.cert(serviceAccount),
      });

      console.log('✅ Firebase Admin SDK initialized successfully');
    }

    return admin;
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin SDK:', error);
    throw error;
  }
};

/**
 * Verify Firebase ID Token
 * @param {string} idToken - Firebase ID token from client
 * @returns {Promise<Object>} Decoded token with user information
 */
const verifyFirebaseToken = async (idToken) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return {
      success: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name,
        picture: decodedToken.picture,
        emailVerified: decodedToken.email_verified,
        provider: decodedToken.firebase.sign_in_provider
      }
    };
  } catch (error) {
    console.error('❌ Error verifying Firebase token:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get Firebase configuration for client-side
 * @returns {Object} Firebase configuration object
 */
const getFirebaseClientConfig = () => {
  return {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID
  };
};

module.exports = {
  initializeFirebaseAdmin,
  verifyFirebaseToken,
  getFirebaseClientConfig,
  admin
};
