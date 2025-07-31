const express = require('express');
const mongoose = require('mongoose');
const { logger } = require('../middleware/logger');

const router = express.Router();

/**
 * Basic health check endpoint
 * Returns system status, uptime, database connectivity, and version info
 */
router.get('/', async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Check database connectivity
    const dbStatus = await checkDatabaseHealth();
    
    // Get system information
    const healthData = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      database: dbStatus,
      memory: getMemoryUsage(),
      responseTime: `${Date.now() - startTime}ms`,
      pid: process.pid,
      platform: process.platform,
      nodeVersion: process.version
    };

    // Log health check request
    logger.info('Health check performed', {
      category: 'health',
      status: healthData.status,
      dbStatus: dbStatus.status,
      responseTime: healthData.responseTime,
      ip: req.ip || req.connection.remoteAddress
    });

    res.status(200).json({
      success: true,
      data: healthData
    });

  } catch (error) {
    logger.error('Health check failed', {
      category: 'health',
      error: error.message,
      stack: error.stack,
      ip: req.ip || req.connection.remoteAddress
    });

    res.status(503).json({
      success: false,
      status: 'ERROR',
      message: 'Service unavailable',
      timestamp: new Date().toISOString(),
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * Detailed health check with component status
 */
router.get('/detailed', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const checks = await Promise.allSettled([
      checkDatabaseHealth(),
      checkMemoryHealth(),
      checkDiskSpace(),
      checkExternalServices()
    ]);

    const [dbCheck, memoryCheck, diskCheck, servicesCheck] = checks;

    const healthData = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      responseTime: `${Date.now() - startTime}ms`,
      components: {
        database: dbCheck.status === 'fulfilled' ? dbCheck.value : { status: 'ERROR', error: dbCheck.reason?.message },
        memory: memoryCheck.status === 'fulfilled' ? memoryCheck.value : { status: 'ERROR', error: memoryCheck.reason?.message },
        disk: diskCheck.status === 'fulfilled' ? diskCheck.value : { status: 'ERROR', error: diskCheck.reason?.message },
        externalServices: servicesCheck.status === 'fulfilled' ? servicesCheck.value : { status: 'ERROR', error: servicesCheck.reason?.message }
      },
      system: {
        pid: process.pid,
        platform: process.platform,
        nodeVersion: process.version,
        cpuUsage: process.cpuUsage(),
        loadAverage: process.platform !== 'win32' ? require('os').loadavg() : 'N/A (Windows)'
      }
    };

    // Determine overall status based on component health
    const hasErrors = Object.values(healthData.components).some(component => component.status === 'ERROR');
    if (hasErrors) {
      healthData.status = 'DEGRADED';
    }

    const hasWarnings = Object.values(healthData.components).some(component => component.status === 'WARNING');
    if (hasWarnings && healthData.status === 'OK') {
      healthData.status = 'WARNING';
    }

    logger.info('Detailed health check performed', {
      category: 'health',
      status: healthData.status,
      components: Object.keys(healthData.components).reduce((acc, key) => {
        acc[key] = healthData.components[key].status;
        return acc;
      }, {}),
      responseTime: healthData.responseTime,
      ip: req.ip || req.connection.remoteAddress
    });

    const statusCode = healthData.status === 'OK' ? 200 : 
                      healthData.status === 'WARNING' ? 200 : 503;

    res.status(statusCode).json({
      success: healthData.status !== 'ERROR',
      data: healthData
    });

  } catch (error) {
    logger.error('Detailed health check failed', {
      category: 'health',
      error: error.message,
      stack: error.stack,
      ip: req.ip || req.connection.remoteAddress
    });

    res.status(503).json({
      success: false,
      status: 'ERROR',
      message: 'Health check failed',
      timestamp: new Date().toISOString(),
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * Check database connectivity and performance
 */
async function checkDatabaseHealth() {
  const startTime = Date.now();
  
  try {
    // Check connection state
    if (mongoose.connection.readyState !== 1) {
      return {
        status: 'ERROR',
        message: 'Database not connected',
        readyState: mongoose.connection.readyState,
        responseTime: `${Date.now() - startTime}ms`
      };
    }

    // Perform a simple query to test responsiveness
    await mongoose.connection.db.admin().ping();
    
    const responseTime = Date.now() - startTime;
    
    return {
      status: responseTime > 1000 ? 'WARNING' : 'OK',
      message: 'Database connected',
      readyState: mongoose.connection.readyState,
      responseTime: `${responseTime}ms`,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    };
    
  } catch (error) {
    return {
      status: 'ERROR',
      message: error.message,
      responseTime: `${Date.now() - startTime}ms`
    };
  }
}

/**
 * Check memory usage and health
 */
async function checkMemoryHealth() {
  const memoryUsage = process.memoryUsage();
  const totalMemory = require('os').totalmem();
  const freeMemory = require('os').freemem();
  
  const usedMemoryPercentage = ((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100);
  const systemMemoryPercentage = (((totalMemory - freeMemory) / totalMemory) * 100);
  
  let status = 'OK';
  let warnings = [];
  
  if (usedMemoryPercentage > 85) {
    status = 'WARNING';
    warnings.push('High heap memory usage');
  }
  
  if (systemMemoryPercentage > 90) {
    status = 'WARNING';
    warnings.push('High system memory usage');
  }
  
  return {
    status,
    warnings: warnings.length > 0 ? warnings : undefined,
    heap: {
      used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
      percentage: `${usedMemoryPercentage.toFixed(1)}%`
    },
    system: {
      total: `${Math.round(totalMemory / 1024 / 1024)}MB`,
      free: `${Math.round(freeMemory / 1024 / 1024)}MB`,
      used: `${Math.round((totalMemory - freeMemory) / 1024 / 1024)}MB`,
      percentage: `${systemMemoryPercentage.toFixed(1)}%`
    }
  };
}

/**
 * Check disk space (simplified)
 */
async function checkDiskSpace() {
  // Note: This is a simplified check. In production, you might want to use a library like 'fs' or 'disk-usage'
  try {
    const fs = require('fs');
    // Simple existence check - in production, use proper disk space libraries
    fs.accessSync('./', fs.constants.R_OK | fs.constants.W_OK);
    
    return {
      status: 'OK',
      message: 'File system accessible',
      note: 'Full disk space monitoring requires additional libraries'
    };
  } catch (error) {
    return {
      status: 'ERROR',
      message: 'File system access error',
      error: error.message
    };
  }
}

/**
 * Check external services connectivity
 */
async function checkExternalServices() {
  const services = [];
  
  // Check OpenWeather API if key is configured
  if (process.env.OPENWEATHER_API_KEY) {
    try {
      const axios = require('axios');
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=London&appid=${process.env.OPENWEATHER_API_KEY}`,
        { timeout: 5000 }
      );
      
      services.push({
        name: 'OpenWeather API',
        status: response.status === 200 ? 'OK' : 'WARNING',
        responseTime: response.headers['x-response-time'] || 'N/A'
      });
    } catch (error) {
      services.push({
        name: 'OpenWeather API',
        status: 'ERROR',
        error: error.message
      });
    }
  }
  
  // Check ML service if configured
  if (process.env.ML_SERVICE_URL || process.env.NODE_BACKEND_URL) {
    const mlUrl = process.env.ML_SERVICE_URL || 'http://localhost:5001';
    try {
      const axios = require('axios');
      const response = await axios.get(`${mlUrl}/health`, { timeout: 3000 });
      
      services.push({
        name: 'ML Service',
        status: response.status === 200 ? 'OK' : 'WARNING',
        url: mlUrl
      });
    } catch (error) {
      services.push({
        name: 'ML Service',
        status: 'ERROR',
        error: error.message,
        url: mlUrl
      });
    }
  }
  
  // Determine overall external services status
  const hasErrors = services.some(service => service.status === 'ERROR');
  const hasWarnings = services.some(service => service.status === 'WARNING');
  
  let overallStatus = 'OK';
  if (hasErrors) overallStatus = 'ERROR';
  else if (hasWarnings) overallStatus = 'WARNING';
  
  return {
    status: overallStatus,
    services,
    count: services.length
  };
}

/**
 * Get formatted memory usage
 */
function getMemoryUsage() {
  const usage = process.memoryUsage();
  return {
    rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
    heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
    external: `${Math.round(usage.external / 1024 / 1024)}MB`
  };
}

module.exports = router;
