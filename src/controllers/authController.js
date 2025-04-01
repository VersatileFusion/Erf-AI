import User from '../models/userModel.js';
import { generateToken } from '../utils/authUtils.js';

/**
 * Register a new user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const register = async (req, res) => {
  console.log('User registration route accessed');
  try {
    const { username, email, password, fullName } = req.body;
    
    // Validate required fields
    if (!username || !password) {
      console.error('Missing required fields');
      return res.status(400).json({ 
        success: false, 
        message: 'Username and password are required' 
      });
    }
    
    // Check if username or email already exists
    const existingUser = await User.findByUsernameOrEmail(username) || 
                         (email && await User.findByUsernameOrEmail(email));
    
    if (existingUser) {
      console.error('Username or email already exists');
      return res.status(400).json({
        success: false,
        message: 'Username or email already exists'
      });
    }
    
    // Create user object
    const userData = {
      username,
      password,
      email,
      profile: {
        fullName: fullName || username
      }
    };
    
    // Create the first user as admin
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('Creating first user as admin');
      userData.role = 'admin';
    }
    
    // Create user in database
    const user = new User(userData);
    await user.save();
    
    // Generate token
    const token = generateToken(user);
    
    // Return user data without password
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      profile: user.profile,
      createdAt: user.createdAt
    };
    
    console.log('User registered successfully:', user._id);
    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Error registering user:', error);
    return res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: error.message
    });
  }
};

/**
 * Login user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const login = async (req, res) => {
  console.log('User login route accessed');
  try {
    const { username, password } = req.body;
    
    // Validate required fields
    if (!username || !password) {
      console.error('Missing required fields');
      return res.status(400).json({ 
        success: false, 
        message: 'Username and password are required' 
      });
    }
    
    // Find user by username or email
    const user = await User.findByUsernameOrEmail(username);
    
    if (!user) {
      console.error('User not found');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Check if user is active
    if (!user.isActive) {
      console.error('User account is deactivated');
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact an administrator.'
      });
    }
    
    // Compare password
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      console.error('Invalid password');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Update last login time
    user.lastLogin = Date.now();
    await user.save();
    
    // Generate token
    const token = generateToken(user);
    
    // Return user data without password
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      profile: user.profile,
      preferences: user.preferences,
      lastLogin: user.lastLogin
    };
    
    console.log('User logged in successfully:', user._id);
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Error logging in:', error);
    return res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
};

/**
 * Get current user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getProfile = async (req, res) => {
  console.log('Get profile route accessed');
  try {
    // User is already attached to request by auth middleware
    const user = req.user;
    
    console.log('Retrieved user profile:', user._id);
    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profile: user.profile,
        preferences: user.preferences,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Error getting user profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting user profile',
      error: error.message
    });
  }
};

/**
 * Update user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateProfile = async (req, res) => {
  console.log('Update profile route accessed');
  try {
    const { fullName, bio, avatar, organization, location, website } = req.body;
    const user = req.user;
    
    // Update profile
    const updatedUser = await user.updateProfile({
      fullName, 
      bio, 
      avatar, 
      organization, 
      location, 
      website
    });
    
    console.log('User profile updated:', user._id);
    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        profile: updatedUser.profile,
        updatedAt: updatedUser.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating user profile',
      error: error.message
    });
  }
};

/**
 * Update user preferences
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updatePreferences = async (req, res) => {
  console.log('Update preferences route accessed');
  try {
    const { theme, notifications } = req.body;
    const user = req.user;
    
    // Update preferences
    const updatedUser = await user.updatePreferences({
      theme,
      notifications
    });
    
    console.log('User preferences updated:', user._id);
    return res.status(200).json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: updatedUser.preferences
    });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating user preferences',
      error: error.message
    });
  }
};

/**
 * Change user password
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const changePassword = async (req, res) => {
  console.log('Change password route accessed');
  try {
    const { currentPassword, newPassword } = req.body;
    const user = req.user;
    
    // Validate passwords
    if (!currentPassword || !newPassword) {
      console.error('Missing password fields');
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }
    
    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      console.error('Current password is incorrect');
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
    // Update password
    const userToUpdate = await User.findById(user._id);
    userToUpdate.password = newPassword;
    await userToUpdate.save();
    
    console.log('Password changed successfully:', user._id);
    return res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    return res.status(500).json({
      success: false,
      message: 'Error changing password',
      error: error.message
    });
  }
};

/**
 * Admin: Get all users
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAllUsers = async (req, res) => {
  console.log('Get all users route accessed');
  try {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Get users without passwords
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const total = await User.countDocuments();
    
    console.log(`Retrieved ${users.length} users`);
    return res.status(200).json({
      success: true,
      users,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting all users:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting all users',
      error: error.message
    });
  }
};

/**
 * Admin: Update user role
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateUserRole = async (req, res) => {
  console.log('Update user role route accessed');
  try {
    const { userId, role } = req.body;
    
    // Validate role
    if (!role || !['user', 'admin'].includes(role)) {
      console.error('Invalid role');
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Role must be "user" or "admin"'
      });
    }
    
    // Find and update user
    const user = await User.findById(userId);
    if (!user) {
      console.error('User not found');
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update role
    user.role = role;
    user.updatedAt = Date.now();
    await user.save();
    
    console.log(`User role updated to ${role}:`, userId);
    return res.status(200).json({
      success: true,
      message: `User role updated to ${role}`,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating user role',
      error: error.message
    });
  }
};

/**
 * Admin: Activate/deactivate user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const toggleUserStatus = async (req, res) => {
  console.log('Toggle user status route accessed');
  try {
    const { userId, isActive } = req.body;
    
    // Find and update user
    const user = await User.findById(userId);
    if (!user) {
      console.error('User not found');
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update status
    user.isActive = isActive;
    user.updatedAt = Date.now();
    await user.save();
    
    const status = isActive ? 'activated' : 'deactivated';
    console.log(`User ${status}:`, userId);
    return res.status(200).json({
      success: true,
      message: `User ${status} successfully`,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Error toggling user status:', error);
    return res.status(500).json({
      success: false,
      message: 'Error toggling user status',
      error: error.message
    });
  }
}; 