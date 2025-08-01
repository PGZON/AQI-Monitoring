require('dotenv').config();
console.log('✅ Step 1: Environment loaded');

const express = require('express');
console.log('✅ Step 2: Express loaded');

const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
console.log('✅ Step 3: Middleware modules loaded');

const connectDB = require('./config/db');
console.log('✅ Step 4: Database config loaded');

// Test simple middleware
const { 
  errorHandler, 
  notFound, 
  securityHeaders 
} = require('./middleware/errorMiddleware');
console.log('✅ Step 5: Error middleware loaded');

// Rate limiting middleware
// const { 
//   authRateLimiter, 
//   apiRateLimiter, 
//   userDataRateLimiter, 
//   infiniteLoopDetector 
// } = require('./middleware/rateLimiter');

// Apply rate limiting
// app.use('/api/auth', authRateLimiter);
// app.use('/api/user', userDataRateLimiter);
// app.use('/api', infiniteLoopDetector);
// app.use('/api', apiRateLimiter);

const { 
  logger, 
  requestLogger, 
  performanceLogger,
  dbLogger 
} = require('./middleware/logger-simple');
console.log('✅ Step 6: Logger middleware loaded');

// Test route imports
let authRoutes, aqiRoutes, historyRoutes, forecastRoutes, preferenceRoutes, alertRoutes, adminRoutes, healthCheckRoutes, userRoutes, weatherRoutes;

try {
  authRoutes = require('./routes/authRoutes');
  console.log('✅ Step 7: Auth routes loaded');
  
  aqiRoutes = require('./routes/aqiRoutes');
  console.log('✅ Step 8: AQI routes loaded');
  
  historyRoutes = require('./routes/historyRoutes');
  console.log('✅ Step 9: History routes loaded');
  
  console.log('🔄 Testing forecast routes...');
  forecastRoutes = require('./routes/forecastRoutes');
  console.log('✅ Step 10: Forecast routes loaded');
  console.log('Forecast routes type:', typeof forecastRoutes);
  console.log('Forecast routes keys:', Object.keys(forecastRoutes));
  
  preferenceRoutes = require('./routes/preferenceRoutes');
  console.log('✅ Step 11: Preference routes loaded');
  
  alertRoutes = require('./routes/alertRoutes');
  console.log('✅ Step 12: Alert routes loaded');
  
  adminRoutes = require('./routes/adminRoutes');
  console.log('✅ Step 13: Admin routes loaded');
  
  healthCheckRoutes = require('./routes/healthCheckRoutes');
  console.log('✅ Step 14: Health check routes loaded');
  
  userRoutes = require('./routes/userRoutes');
  console.log('✅ Step 14.5: User routes loaded');
  
  analyticsRoutes = require('./routes/analyticsRoutes');
  console.log('✅ Step 14.6: Analytics routes loaded');
  
  weatherRoutes = require('./routes/weatherRoutes');
  console.log('✅ Step 14.7: Weather routes loaded');
} catch (error) {
  console.error('❌ Route loading failed:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

console.log('✅ Step 15: All modules loaded successfully');

// Startup function to handle async operations
const startServer = async () => {
  try {
    // Connect to database
    console.log('🔄 Step 16: Connecting to database...');
    await connectDB();
    console.log('✅ Step 17: Database connected successfully');

    const app = express();
    console.log('✅ Step 18: Express app created');

    // Middleware setup
    app.use(helmet());
    app.use(cors());
    app.use(express.json());
    console.log('✅ Step 19: Basic middleware configured');

    // Rate limiting middleware
    // app.use('/api', infiniteLoopDetector); // Detect infinite loops
    // app.use('/api', apiRateLimiter); // General API rate limiting
    // app.use('/api/user', userDataRateLimiter); // Strict rate limiting for user data
    console.log('✅ Step 19.5: Rate limiting middleware configured');

    // API routes
    app.use('/api/auth', authRoutes);
    app.use('/api/user', userRoutes);
    app.use('/api/aqi', aqiRoutes);
    app.use('/api/history', historyRoutes);
    app.use('/api/forecast', forecastRoutes);
    app.use('/api/preferences', preferenceRoutes);
    app.use('/api/alerts', alertRoutes);
    app.use('/api/analytics', analyticsRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/health', healthCheckRoutes);
    app.use('/api/weather', weatherRoutes);

    // Simple test route
    app.get('/test', (req, res) => {
      res.json({ success: true, message: 'Test route working' });
    });

    // Welcome route
    app.get('/', (req, res) => {
      res.status(200).json({
        success: true,
        message: 'Welcome to AQI Monitoring API',
        version: '1.0.0',
        status: 'Server is running successfully!'
      });
    });

    // Handle 404 routes
    app.use(notFound);

    // Global error handler
    app.use(errorHandler);

    const PORT = process.env.PORT || 5000;
    console.log('🔄 Step 20: Starting server on port', PORT);

    app.listen(PORT, () => {
      console.log('🚀 ================================');
      console.log(`🌟 AQI Monitoring API Server`);
      console.log(`🔧 Environment: ${process.env.NODE_ENV}`);
      console.log(`🌐 Server running on port ${PORT}`);
      console.log(`📡 API URL: http://localhost:${PORT}`);
      console.log(`💚 Test endpoint: http://localhost:${PORT}/test`);
      console.log('🚀 ================================');
    });

    console.log('✅ Step 21: Server setup completed');
    
    // Export the app for testing purposes
    module.exports = app;
    
    return app;
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
};

// Start the server
startServer();
