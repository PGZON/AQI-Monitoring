const User = require('../models/User');
const { sendTokenResponse } = require('../middleware/authMiddleware');

/**
 * @desc    Register new user
 * @route   POST /api/auth/signup
 * @access  Public
 */
const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    console.log('🔐 Signup attempt for:', email);

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password
    });

    console.log('✅ User created successfully:', user.email);

    // Send token response
    sendTokenResponse(user, 201, res, 'User registered successfully');

  } catch (error) {
    console.error('❌ Signup error:', error);
    next(error);
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Login attempt for:', email);

    // Validate email and password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check for user and include password for comparison
    const user = await User.findByEmail(email).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    await user.updateLastLogin();

    console.log('✅ User logged in successfully:', user.email);

    // Send token response
    sendTokenResponse(user, 200, res, 'Login successful');

  } catch (error) {
    console.error('❌ Login error:', error);
    next(error);
  }
};

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user.profile
    });
  } catch (error) {
    console.error('❌ Get me error:', error);
    next(error);
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, preferences } = req.body;

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (preferences) updateData.preferences = { ...req.user.preferences, ...preferences };

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    console.log('✅ Profile updated for:', user.email);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user.profile
    });
  } catch (error) {
    console.error('❌ Update profile error:', error);
    next(error);
  }
};

/**
 * @desc    Change password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Set new password
    user.password = newPassword;
    await user.save();

    console.log('✅ Password changed for:', user.email);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('❌ Change password error:', error);
    next(error);
  }
};

/**
 * @desc    Logout user / clear cookie
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = async (req, res, next) => {
  try {
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });

    console.log('✅ User logged out:', req.user.email);

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('❌ Logout error:', error);
    next(error);
  }
};

/**
 * @desc    Delete user account
 * @route   DELETE /api/auth/delete-account
 * @access  Private
 */
const deleteAccount = async (req, res, next) => {
  try {
    const { password } = req.body;

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    // Verify password before deletion
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Password is incorrect'
      });
    }

    // Instead of deleting, deactivate the account
    user.isActive = false;
    await user.save();

    console.log('⚠️ Account deactivated for:', user.email);

    res.status(200).json({
      success: true,
      message: 'Account deactivated successfully'
    });
  } catch (error) {
    console.error('❌ Delete account error:', error);
    next(error);
  }
};

/**
 * @desc    Get user statistics (Admin only)
 * @route   GET /api/auth/stats
 * @access  Private/Admin
 */
const getUserStats = async (req, res, next) => {
  try {
    const stats = await User.getUserStats();

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Get user stats error:', error);
    next(error);
  }
};

/**
 * @desc    Get saved locations
 * @route   GET /api/user/locations
 * @access  Private
 */
const getSavedLocations = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const locations = user.savedLocations || [];

    res.status(200).json({
      success: true,
      data: { locations }
    });
  } catch (error) {
    console.error('❌ Get saved locations error:', error);
    next(error);
  }
};

/**
 * @desc    Add saved location
 * @route   POST /api/user/locations
 * @access  Private
 */
const addSavedLocation = async (req, res, next) => {
  try {
    const { name, coordinates } = req.body;
    const user = await User.findById(req.user.id);

    const newLocation = {
      id: Date.now().toString(),
      name,
      coordinates,
      isDefault: user.savedLocations.length === 0,
      addedAt: new Date().toISOString()
    };

    user.savedLocations.push(newLocation);
    await user.save();

    res.status(201).json({
      success: true,
      data: newLocation
    });
  } catch (error) {
    console.error('❌ Add saved location error:', error);
    next(error);
  }
};

/**
 * @desc    Remove saved location
 * @route   DELETE /api/user/locations/:locationId
 * @access  Private
 */
const removeSavedLocation = async (req, res, next) => {
  try {
    const { locationId } = req.params;
    const user = await User.findById(req.user.id);

    user.savedLocations = user.savedLocations.filter(
      loc => loc.id !== locationId
    );

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Location removed successfully'
    });
  } catch (error) {
    console.error('❌ Remove saved location error:', error);
    next(error);
  }
};

/**
 * @desc    Set default location
 * @route   PUT /api/user/locations/:locationId/default
 * @access  Private
 */
const setDefaultLocation = async (req, res, next) => {
  try {
    const { locationId } = req.params;
    const user = await User.findById(req.user.id);

    // Reset all locations to not default
    user.savedLocations.forEach(loc => {
      loc.isDefault = false;
    });

    // Set the specified location as default
    const location = user.savedLocations.find(loc => loc.id === locationId);
    if (location) {
      location.isDefault = true;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Default location updated successfully'
    });
  } catch (error) {
    console.error('❌ Set default location error:', error);
    next(error);
  }
};

/**
 * @desc    Get user preferences
 * @route   GET /api/user/preferences
 * @access  Private
 */
const getPreferences = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const preferences = user.preferences || {
      notifications: { email: true, push: true },
      units: 'metric',
      aqiThreshold: 100
    };

    res.status(200).json({
      success: true,
      data: preferences
    });
  } catch (error) {
    console.error('❌ Get preferences error:', error);
    next(error);
  }
};

/**
 * @desc    Update user preferences
 * @route   PUT /api/user/preferences
 * @access  Private
 */
const updatePreferences = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const updates = req.body;

    user.preferences = {
      ...user.preferences,
      ...updates
    };

    await user.save();

    res.status(200).json({
      success: true,
      data: user.preferences
    });
  } catch (error) {
    console.error('❌ Update preferences error:', error);
    next(error);
  }
};

/**
 * @desc    Upload user avatar
 * @route   POST /api/user/avatar
 * @access  Private
 */
const uploadAvatar = async (req, res, next) => {
  try {
    // For now, return a placeholder response
    // In a real app, you'd handle file upload here
    res.status(200).json({
      success: true,
      data: {
        avatarUrl: 'https://via.placeholder.com/150'
      }
    });
  } catch (error) {
    console.error('❌ Upload avatar error:', error);
    next(error);
  }
};

/**
 * @desc    Export user data
 * @route   GET /api/user/export
 * @access  Private
 */
const exportData = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    const exportData = {
      profile: {
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      },
      preferences: user.preferences,
      savedLocations: user.savedLocations,
      stats: await User.getUserStats()
    };

    res.status(200).json({
      success: true,
      data: exportData
    });
  } catch (error) {
    console.error('❌ Export data error:', error);
    next(error);
  }
};

/**
 * @desc    Google OAuth login/signup
 * @route   POST /api/auth/google-login
 * @access  Public (but requires Firebase token)
 */
const googleLogin = async (req, res, next) => {
  try {
    const { uid, email, displayName, photoURL, emailVerified } = req.body;
    
    console.log('🔐 Google login attempt for:', email);

    // Check if user already exists
    let user = await User.findByEmail(email);
    
    if (user) {
      // Update existing user with Google info
      user.firebaseUid = uid;
      user.displayName = displayName;
      user.photoURL = photoURL;
      user.emailVerified = emailVerified;
      user.lastLogin = new Date();
      user.loginProvider = 'google';
      
      await user.save();
      console.log('✅ Existing user updated with Google info:', email);
    } else {
      // Create new user from Google account
      user = await User.create({
        firebaseUid: uid,
        name: displayName || email.split('@')[0],
        displayName: displayName,
        email: email.toLowerCase().trim(),
        photoURL: photoURL,
        emailVerified: emailVerified,
        loginProvider: 'google',
        isActive: true,
        lastLogin: new Date()
      });
      
      console.log('✅ New Google user created:', email);
    }

    // Return user data (no password hash needed for Google users)
    res.status(200).json({
      success: true,
      message: 'Google login successful',
      user: {
        id: user._id,
        name: user.name,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
        firebaseUid: user.firebaseUid,
        loginProvider: user.loginProvider,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error('❌ Google login error:', error);
    next(error);
  }
};

module.exports = {
  signup,
  login,
  getMe,
  updateProfile,
  changePassword,
  logout,
  deleteAccount,
  getUserStats,
  getSavedLocations,
  addSavedLocation,
  removeSavedLocation,
  setDefaultLocation,
  getPreferences,
  updatePreferences,
  uploadAvatar,
  exportData,
  googleLogin
};
