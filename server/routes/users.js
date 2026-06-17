import express from 'express'
import { body, validationResult } from 'express-validator'
import User from '../models/User.js'
import Record from '../models/Record.js'
import { protect, optionalAuth } from '../middleware/auth.js'
import { findUserByIdentifier } from '../utils/userLookup.js'

const router = express.Router()
const MAX_AVATAR_LENGTH = 2 * 1024 * 1024

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function isSupportedAvatar(value) {
  if (value === undefined || value === null || value === '') return true
  if (typeof value !== 'string') return false
  if (value.length > MAX_AVATAR_LENGTH) return false

  return (
    value.startsWith('data:image/') ||
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('/')
  )
}

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
    .toUpperCase(),
  body('avatar')
    .custom((value) => {
      if (!isSupportedAvatar(value)) {
        throw new Error('头像必须是有效的图片 Base64 数据或可访问的图片地址')
      }
      return true
    })
]

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

    const { nickname, bio, wcaId, avatar } = req.body

    // Update user
    const user = await User.findById(req.user._id)

    if (nickname) user.nickname = nickname
    if (bio !== undefined) user.bio = bio
    if (wcaId !== undefined) user.wcaId = wcaId
    if (avatar !== undefined) {
      user.avatar = avatar ? avatar.trim() : null
    }

    await user.save()

    res.json({
      code: 200,
      message: 'Profile updated successfully',
      data: {
        id: user.userNo,
        userNo: user.userNo,
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
      .select('userNo nickname avatar role email createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSizeNum)

    const total = await User.countDocuments({ status: 'active' })

    res.json({
      code: 200,
      message: 'Success',
      data: users.map(user => ({
        id: user.userNo,
        userNo: user.userNo,
        _id: user._id,
        nickname: user.nickname,
        avatar: user.avatar,
        role: user.role,
        email: user.email,
        createdAt: user.createdAt
      })),
      page: pageNum,
      pageSize: pageSizeNum,
      total
    })
  } catch (error) {
    next(error)
  }
})

// @route   GET /api/users/overview
// @desc    Get user overview cards with record stats
// @access  Public
router.get('/overview', optionalAuth, async (req, res, next) => {
  try {
    const { page = 1, pageSize = 12, keyword = '', sort = 'latest' } = req.query
    const pageNum = Math.max(1, parseInt(page))
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize)))
    const skip = (pageNum - 1) * pageSizeNum
    const normalizedKeyword = String(keyword || '').trim()
    const userMatch = { status: 'active' }

    if (normalizedKeyword) {
      userMatch.nickname = { $regex: escapeRegex(normalizedKeyword), $options: 'i' }
    }

    const sortMode = ['latest', 'mostRecords', 'mostEvents'].includes(sort) ? sort : 'latest'

    if (sortMode === 'latest') {
      const [users, total] = await Promise.all([
        User.find(userMatch)
          .select('userNo nickname createdAt')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(pageSizeNum)
          .lean(),
        User.countDocuments(userMatch)
      ])

      const userObjectIds = users.map(user => user._id).filter(Boolean)
      const recordStats = userObjectIds.length
        ? await Record.aggregate([
            {
              $match: {
                userId: { $in: userObjectIds }
              }
            },
            {
              $group: {
                _id: '$userId',
                recordCount: { $sum: 1 },
                events: { $addToSet: '$event' }
              }
            }
          ])
        : []

      const statsMap = new Map(recordStats.map(stat => [String(stat._id), stat]))

      return res.json({
        code: 200,
        message: 'Success',
        data: users.map(user => {
          const stats = statsMap.get(String(user._id))
          return {
            profileUserNo: user.userNo,
            nickname: user.nickname,
            createdAt: user.createdAt,
            recordCount: stats?.recordCount || 0,
            events: Array.isArray(stats?.events) ? stats.events : []
          }
        }),
        page: pageNum,
        pageSize: pageSizeNum,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSizeNum))
      })
    }

    const overviewRows = await User.aggregate([
      { $match: userMatch },
      {
        $lookup: {
          from: 'records',
          localField: '_id',
          foreignField: 'userId',
          as: 'records'
        }
      },
      {
        $addFields: {
          recordCount: { $size: '$records' },
          events: { $setUnion: ['$records.event', []] }
        }
      },
      {
        $addFields: {
          eventCount: { $size: '$events' }
        }
      },
      {
        $facet: {
          data: [
            { $sort: sortMode === 'mostEvents' ? { eventCount: -1, recordCount: -1, createdAt: -1 } : { recordCount: -1, eventCount: -1, createdAt: -1 } },
            { $skip: skip },
            { $limit: pageSizeNum },
            {
              $project: {
                profileUserNo: '$userNo',
                nickname: 1,
                createdAt: 1,
                recordCount: 1,
                events: 1
              }
            }
          ],
          total: [
            { $count: 'count' }
          ]
        }
      }
    ])

    const result = overviewRows[0] || { data: [], total: [] }
    const total = result.total[0]?.count || 0

    res.json({
      code: 200,
      message: 'Success',
      data: result.data || [],
      page: pageNum,
      pageSize: pageSizeNum,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSizeNum))
    })
  } catch (error) {
    next(error)
  }
})

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Public
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const user = await findUserByIdentifier(req.params.id)

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
        id: user.userNo,
        userNo: user.userNo,
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

export default router
