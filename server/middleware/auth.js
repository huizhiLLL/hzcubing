import jwt from 'jsonwebtoken'
import User from '../models/User.js'

export const protect = async (req, res, next) => {
  try {
    let token

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1]
    }

    if (!token) {
      return res.status(401).json({
        code: 401,
        message: 'Not authorized, no token provided'
      })
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Get user from token
    const user = await User.findById(decoded.userId).select('-password')

    if (!user) {
      return res.status(401).json({
        code: 401,
        message: 'User not found'
      })
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(403).json({
        code: 403,
        message: 'Account is disabled'
      })
    }

    req.user = user
    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        code: 401,
        message: 'Invalid token'
      })
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        code: 401,
        message: 'Token expired'
      })
    }
    next(error)
  }
}

// Optional auth - doesn't fail if no token
export const optionalAuth = async (req, res, next) => {
  try {
    let token

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1]
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const user = await User.findById(decoded.userId).select('-password')
      
      if (user && user.status === 'active') {
        req.user = user
      }
    }

    next()
  } catch (error) {
    // Ignore errors, continue without auth
    next()
  }
}

// Admin only middleware
export const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      code: 401,
      message: 'Not authorized'
    })
  }

  if (!['admin', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({
      code: 403,
      message: 'Admin access required'
    })
  }

  next()
}

// Super admin only middleware
export const superAdminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      code: 401,
      message: 'Not authorized'
    })
  }

  if (req.user.role !== 'super_admin') {
    return res.status(403).json({
      code: 403,
      message: 'Super admin access required'
    })
  }

  next()
}
