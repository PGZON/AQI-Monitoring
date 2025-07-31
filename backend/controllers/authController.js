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

module.exports = {
  signup,
  login,
  getMe,
  updateProfile,
  changePassword,
  logout,
  deleteAccount,
  getUserStats
};
