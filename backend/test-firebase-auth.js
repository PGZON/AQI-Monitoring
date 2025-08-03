/**
 * Firebase Authentication Test Script
 * Tests the Firebase configuration endpoints
 */

const express = require('express');
const cors = require('cors');
const { getFirebaseClientConfig, initializeFirebaseAdmin } = require('./config/firebase');

// Initialize Firebase Admin
console.log('🔄 Initializing Firebase Admin SDK...');
initializeFirebaseAdmin();

const app = express();
app.use(cors());
app.use(express.json());

// Test endpoint for Firebase config
app.get('/api/auth/config', (req, res) => {
  try {
    const config = getFirebaseClientConfig();
    console.log('✅ Firebase config retrieved successfully');
    
    res.json({
      success: true,
      config: config,
      message: 'Firebase configuration for client-side authentication'
    });
  } catch (error) {
    console.error('❌ Error getting Firebase config:', error);
    res.status(500).json({
      success: false,
      error: 'Server error getting configuration'
    });
  }
});

// Health check endpoint
app.get('/api/auth/health', (req, res) => {
  res.json({
    success: true,
    message: 'Firebase Auth service is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Firebase Authentication Test Server',
    endpoints: [
      'GET /api/auth/config - Get Firebase configuration',
      'GET /api/auth/health - Health check'
    ]
  });
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log('🚀 ================================');
  console.log('🔥 Firebase Auth Test Server');
  console.log(`🌐 Server running on port ${PORT}`);
  console.log(`📡 Config URL: http://localhost:${PORT}/api/auth/config`);
  console.log(`💚 Health URL: http://localhost:${PORT}/api/auth/health`);
  console.log('🚀 ================================');
});
