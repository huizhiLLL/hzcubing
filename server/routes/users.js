import express from 'express'
import { body, validationResult } from 'express-validator'
import User from '../models/User.js'
import { protect, optionalAuth } from '../middleware/auth.js'

const router = express.Router()

// Validation rules
const profileValidation = [
  body('nickname')
    .optional()
    .trim()
    .notEmpty().withMessage('Nickname cannot be empty')
    .isLength({ max: 50 }).withMessage('Nickname must be less than 50 characters'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Bio must be less than 500 characters'),
  body('wcaId')
    .optional()
    .trim()
    .toUpperCase()
]

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Public
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)

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
        _id: user._id,
        email: user.email,
        nickname: user.nickname,
        bio: user.bio,
        wcaId: user.wcaId,
        avatar: user.avatar,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    })
  } catch (error) {
    next(error)
  }
})

// @route   PUT /api/users/profile
// @desc    Update current user profile
// @access  Private
router.put('/profile', protect, profileValidation, async (req, res, next) => {
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

    const { nickname, bio, wcaId } = req.body

    // Update user
    const user = await User.findById(req.user._id)

    if (nickname) user.nickname = nickname
    if (bio !== undefined) user.bio = bio
    if (wcaId !== undefined) user.wcaId = wcaId

    await user.save()

    res.json({
      code: 200,
      message: 'Profile updated successfully',
      data: {
        id: user._id,
        _id: user._id,
        email: user.email,
        nickname: user.nickname,
        bio: user.bio,
        wcaId: user.wcaId,
        avatar: user.avatar,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    })
  } catch (error) {
    next(error)
  }
})

// @route   GET /api/users
// @desc    Get all users (for leaderboard)
// @access  Public
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20 } = req.query
    const pageNum = Math.max(1, parseInt(page))
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize)))
    const skip = (pageNum - 1) * pageSizeNum

    const users = await User.find({ status: 'active' })
      .select('nickname avatar role')
      .skip(skip)
      .limit(pageSizeNum)

    const total = await User.countDocuments({ status: 'active' })

    res.json({
      code: 200,
      message: 'Success',
      data: users,
      page: pageNum,
      pageSize: pageSizeNum,
      total
    })
  } catch (error) {
    next(error)
  }
})

export default router
