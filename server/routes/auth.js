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
    .isLength({ max: 50 }).withMessage('Nickname must be less than 50 characters'),
  body('qqId')
    .optional()
    .trim()
    .isLength({ min: 1, max: 20 }).withMessage('QQ ID must be 1-20 characters')
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

    const { email, password, nickname, bio, qqId } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({
        code: 400,
        message: 'Email already registered'
      })
    }

    // Check if QQ ID is already bound
    if (qqId) {
      const existingQQ = await User.findOne({ qqId })
      if (existingQQ) {
        return res.status(400).json({
          code: 400,
          message: 'QQ ID already bound to another account'
        })
      }
    }

    // Create user
    const user = new User({
      email,
      password,
      nickname,
      bio: bio || '',
      qqId: qqId || null
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

// @route   POST /api/auth/bind-qq
// @desc    Bind QQ ID to current user
// @access  Private
router.post('/bind-qq', protect, async (req, res, next) => {
  try {
    const { qqId } = req.body
    
    if (!qqId || qqId.trim() === '') {
      return res.status(400).json({
        code: 400,
        message: 'QQ ID is required'
      })
    }
    
    // Check if QQ ID is already bound to another user
    const existingUser = await User.findOne({ qqId })
    if (existingUser && existingUser._id.toString() !== req.user._id.toString()) {
      return res.status(400).json({
        code: 400,
        message: 'QQ ID already bound to another account'
      })
    }
    
    // Update user
    req.user.qqId = qqId.trim()
    await req.user.save()
    
    res.json({
      code: 200,
      message: 'QQ ID bound successfully',
      data: {
        qqId: req.user.qqId
      }
    })
  } catch (error) {
    next(error)
  }
})

// @route   POST /api/auth/bind-user-by-nickname
// @desc    Bind QQ ID to a user by nickname (for AstrBot plugin)
// @access  Public
router.post('/bind-user-by-nickname', async (req, res, next) => {
  try {
    const { qqId, nickname } = req.body

    if (!qqId || qqId.trim() === '') {
      return res.status(400).json({
        code: 400,
        message: 'QQ ID is required'
      })
    }

    if (!nickname || nickname.trim() === '') {
      return res.status(400).json({
        code: 400,
        message: 'Nickname is required'
      })
    }

    const normalizedQQ = qqId.trim()
    const normalizedNickname = nickname.trim()

    const targetUser = await User.findOne({ nickname: normalizedNickname })

    if (!targetUser) {
      return res.status(404).json({
        code: 404,
        message: 'User not found'
      })
    }

    const existingQQUser = await User.findOne({ qqId: normalizedQQ })
    if (existingQQUser && existingQQUser._id.toString() !== targetUser._id.toString()) {
      return res.status(400).json({
        code: 400,
        message: 'QQ ID already bound to another account'
      })
    }

    targetUser.qqId = normalizedQQ
    await targetUser.save()

    res.json({
      code: 200,
      message: 'User bound successfully',
      data: {
        userId: targetUser._id,
        nickname: targetUser.nickname,
        qqId: targetUser.qqId
      }
    })
  } catch (error) {
    next(error)
  }
})

// @route   GET /api/auth/find-user-by-qq
// @desc    Find user by QQ ID (for AstrBot plugin)
// @access  Public
router.get('/find-user-by-qq', async (req, res, next) => {
  try {
    const { qqId } = req.query
    
    if (!qqId) {
      return res.status(400).json({
        code: 400,
        message: 'QQ ID is required'
      })
    }
    
    const user = await User.findOne({ qqId }).select('-password')
    
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: 'User not found'
      })
    }
    
    res.json({
      code: 200,
      message: 'Success',
      data: {
        id: user._id,
        nickname: user.nickname,
        email: user.email,
        qqId: user.qqId
      }
    })
  } catch (error) {
    next(error)
  }
})

// @route   POST /api/auth/submit-record-by-qq
// @desc    Submit record by QQ ID (for AstrBot plugin, no auth required)
// @access  Public
router.post('/submit-record-by-qq', async (req, res, next) => {
  try {
    const { qqId, event, singleSeconds, averageSeconds, cube, method } = req.body
    
    if (!qqId) {
      return res.status(400).json({
        code: 400,
        message: 'QQ ID is required'
      })
    }
    
    if (!event) {
      return res.status(400).json({
        code: 400,
        message: 'Event is required'
      })
    }
    
    // Find user by QQ ID
    const user = await User.findOne({ qqId })
    
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: 'User not found, please register first'
      })
    }
    
    const Record = (await import('../models/Record.js')).default

    const normalizedSingleSeconds = singleSeconds !== null && singleSeconds !== undefined ? Number(singleSeconds) : null
    const normalizedAverageSeconds = averageSeconds !== null && averageSeconds !== undefined ? Number(averageSeconds) : null

    const [previousSingleBestRecord, previousAverageBestRecord] = await Promise.all([
      normalizedSingleSeconds !== null && Number.isFinite(normalizedSingleSeconds)
        ? Record.findOne({ event, singleSeconds: { $ne: null } })
          .sort({ singleSeconds: 1, timestamp: 1, _id: 1 })
          .lean()
        : null,
      normalizedAverageSeconds !== null && Number.isFinite(normalizedAverageSeconds)
        ? Record.findOne({ event, averageSeconds: { $ne: null } })
          .sort({ averageSeconds: 1, timestamp: 1, _id: 1 })
          .lean()
        : null
    ])
    
    // Create record
    const record = new Record({
      userId: user._id,
      nickname: user.nickname,
      event,
      singleSeconds: normalizedSingleSeconds,
      averageSeconds: normalizedAverageSeconds,
      cube: cube || null,
      method: method || null
    })
    
    await record.save()
    
    const isSingleGR = record.singleSeconds !== null && (
      !previousSingleBestRecord || record.singleSeconds < previousSingleBestRecord.singleSeconds
    )
    const isAverageGR = record.averageSeconds !== null && (
      !previousAverageBestRecord || record.averageSeconds < previousAverageBestRecord.averageSeconds
    )
    
    res.json({
      code: 200,
      message: 'Record submitted successfully',
      data: {
        _id: record._id,
        userId: user._id,
        nickname: user.nickname,
        event: record.event,
        singleSeconds: record.singleSeconds,
        averageSeconds: record.averageSeconds,
        isSingleGR,
        isAverageGR,
        previousSingleBest: previousSingleBestRecord ? {
          userId: previousSingleBestRecord.userId,
          nickname: previousSingleBestRecord.nickname,
          seconds: previousSingleBestRecord.singleSeconds,
          timestamp: previousSingleBestRecord.timestamp
        } : null,
        previousAverageBest: previousAverageBestRecord ? {
          userId: previousAverageBestRecord.userId,
          nickname: previousAverageBestRecord.nickname,
          seconds: previousAverageBestRecord.averageSeconds,
          timestamp: previousAverageBestRecord.timestamp
        } : null
      }
    })
  } catch (error) {
    next(error)
  }
})

export default router
