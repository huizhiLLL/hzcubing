import express from 'express'
import jwt from 'jsonwebtoken'
import { body, validationResult } from 'express-validator'
import User from '../models/User.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
  )
}

// Validation rules
const registerValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('nickname')
    .trim()
    .notEmpty().withMessage('Nickname is required')
    .isLength({ max: 50 }).withMessage('Nickname must be less than 50 characters')
]

const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email'),
  body('password')
    .notEmpty().withMessage('Password is required')
]

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', registerValidation, async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        code: 400,
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const { email, password, nickname, bio } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({
        code: 400,
        message: 'Email already registered'
      })
    }

    // Create user
    const user = new User({
      email,
      password,
      nickname,
      bio: bio || ''
    })

    await user.save()

    // Generate token
    const token = generateToken(user._id)

    res.status(201).json({
      code: 200,
      message: 'Registration successful',
      data: {
        token,
        user: {
          id: user._id,
          _id: user._id,
          email: user.email,
          nickname: user.nickname,
          bio: user.bio,
          wcaId: user.wcaId,
          avatar: user.avatar,
          role: user.role,
          status: user.status
        }
      }
    })
  } catch (error) {
    next(error)
  }
})

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', loginValidation, async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        code: 400,
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const { email, password } = req.body

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password')

    if (!user) {
      return res.status(404).json({
        code: 404,
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

    // Check password
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({
        code: 401,
        message: 'Invalid credentials'
      })
    }

    // Generate token
    const token = generateToken(user._id)

    res.json({
      code: 200,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          _id: user._id,
          email: user.email,
          nickname: user.nickname,
          bio: user.bio,
          wcaId: user.wcaId,
          avatar: user.avatar,
          role: user.role,
          status: user.status
        }
      }
    })
  } catch (error) {
    next(error)
  }
})

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res, next) => {
  try {
    res.json({
      code: 200,
      message: 'Success',
      data: {
        id: req.user._id,
        _id: req.user._id,
        email: req.user.email,
        nickname: req.user.nickname,
        bio: req.user.bio,
        wcaId: req.user.wcaId,
        avatar: req.user.avatar,
        role: req.user.role,
        status: req.user.status,
        createdAt: req.user.createdAt,
        updatedAt: req.user.updatedAt
      }
    })
  } catch (error) {
    next(error)
  }
})

export default router
