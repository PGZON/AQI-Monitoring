/**
 * Firebase Configuration for Frontend
 * Handles Firebase client-side authentication
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyDPrVAaAzmW6u61pRy4hC21LsVj2c8cnJo",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "aqimonitoring-616b7.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "aqimonitoring-616b7",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "aqimonitoring-616b7.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "797459470899",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:797459470899:web:bfed6eb0fa0e7f4a4ac5b1",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-MMLGCD0VRN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export default app;
