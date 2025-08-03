/**
 * Firebase Authentication Middleware
 * Verifies Firebase ID tokens and handles authentication
 */

const { verifyFirebaseToken } = require('../config/firebase');

/**
 * Authentication middleware for protected routes
 * Verifies Firebase ID token from Authorization header
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'Authorization header missing'
      });
    }

    // Extract token from "Bearer TOKEN_HERE" format
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token missing from authorization header'
      });
    }

    // Verify the Firebase ID token
    const result = await verifyFirebaseToken(token);
    
    if (!result.success) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
        details: result.error
      });
    }

    // Add user information to request object
    req.user = result.user;
    next();

  } catch (error) {
    console.error('❌ Authentication middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication server error'
    });
  }
};

/**
 * Optional authentication middleware for routes that work with or without auth
 * If token is provided, it verifies it, otherwise continues without user data
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      // No auth header, continue without user data
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      // No token, continue without user data
      req.user = null;
      return next();
    }

    // Try to verify the token
    const result = await verifyFirebaseToken(token);
    
    if (result.success) {
      req.user = result.user;
    } else {
      req.user = null;
    }

    next();

  } catch (error) {
    console.error('⚠️  Optional auth middleware error:', error);
    // Continue without user data on error
    req.user = null;
    next();
  }
};

/**
 * Role-based authorization middleware
 * Checks if user has required role/permission
 */
const requireRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // For now, we'll use a simple role system
    // In production, you might want to store roles in Firestore
    const userRole = req.user.role || 'user';
    
    if (userRole !== requiredRole && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required role: ${requiredRole}`
      });
    }

    next();
  };
};

/**
 * Validate user email domain (if needed for organization restrictions)
 */
const requireDomain = (allowedDomains) => {
  return (req, res, next) => {
    if (!req.user || !req.user.email) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const emailDomain = req.user.email.split('@')[1];
    
    if (!allowedDomains.includes(emailDomain)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Email domain ${emailDomain} not allowed`
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireRole,
  requireDomain
};
