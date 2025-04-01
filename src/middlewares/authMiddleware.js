import { verifyToken, extractToken } from '../utils/authUtils.js';
import User from '../models/userModel.js';

/**
 * Middleware to authenticate user based on JWT token
 */
export const authenticate = async (req, res, next) => {
  try {
    // Extract token from headers or cookies
    const token = extractToken(req);
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required. No token provided.' 
      });
    }

    // Verify the token
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid or expired token.' 
      });
    }

    // Find user and check if still active
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found.' 
      });
    }

    if (!user.isActive) {
      return res.status(403).json({ 
        success: false, 
        message: 'Account has been deactivated. Please contact support.' 
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Authentication failed due to server error.' 
    });
  }
};

/**
 * Middleware to check if user has required roles
 * @param {Array} roles - Array of allowed roles
 */
export const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required.' 
      });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions to access this resource.' 
      });
    }

    next();
  };
};

/**
 * Middleware to check if user owns a resource or is an admin
 * @param {Function} getResourceUserId - Function to extract user ID from resource
 */
export const ownershipOrAdmin = (getResourceUserId) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required.' 
        });
      }

      // If user is admin, allow access
      if (req.user.role === 'admin') {
        return next();
      }

      // Get user ID from the resource
      const resourceUserId = await getResourceUserId(req);
      
      // Check if user owns the resource
      if (resourceUserId && resourceUserId.equals(req.user._id)) {
        return next();
      }

      res.status(403).json({ 
        success: false, 
        message: 'You do not have permission to access this resource.' 
      });
    } catch (error) {
      console.error('Ownership check error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Authorization check failed due to server error.' 
      });
    }
  };
};

console.log('Auth middleware initialized'); 