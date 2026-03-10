import express from 'express'
import { body, validationResult } from 'express-validator'
import MemeEvent from '../models/MemeEvent.js'
import { optionalAuth, protect } from '../middleware/auth.js'

const router = express.Router()

const memeEventValidation = [
  body('eventCode')
    .optional()
    .trim()
    .isLength({ min: 2, max: 32 }).withMessage('Event code must be 2-32 characters')
    .matches(/^[a-zA-Z0-9_-]+$/).withMessage('Event code can only contain letters, numbers, underscore, and hyphen'),
  body('eventName')
    .trim()
    .notEmpty().withMessage('Event name is required')
    .isLength({ max: 50 }).withMessage('Event name must be less than 50 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 300 }).withMessage('Description must be less than 300 characters')
]

function serializeEvent(event) {
  return {
    id: event.eventCode,
    name: event.eventName,
    category: 'meme',
    description: event.description || '',
    createdBy: event.createdBy,
    createdByName: event.createdByName,
    isActive: event.isActive,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt
  }
}

function normalizeEventCode(input = '') {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]/g, '')
}

// @route   GET /api/meme-events
// @desc    Get active meme events
// @access  Public
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const query = req.user ? {} : { isActive: true }
    const events = await MemeEvent.find(query)
      .sort({ isActive: -1, createdAt: 1, eventCode: 1 })
      .lean()

    res.json({
      code: 200,
      message: 'Success',
      data: events
        .filter(event => event.isActive || req.user)
        .map(serializeEvent)
    })
  } catch (error) {
    next(error)
  }
})

// @route   GET /api/meme-events/mine
// @desc    Get current user's meme events
// @access  Private
router.get('/mine', protect, async (req, res, next) => {
  try {
    const events = await MemeEvent.find({ createdBy: req.user._id.toString() })
      .sort({ createdAt: -1, eventCode: 1 })
      .lean()

    res.json({
      code: 200,
      message: 'Success',
      data: events.map(serializeEvent)
    })
  } catch (error) {
    next(error)
  }
})

// @route   POST /api/meme-events
// @desc    Create a meme event
// @access  Private
router.post('/', protect, memeEventValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        code: 400,
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const rawCode = req.body.eventCode || req.body.eventName || ''
    const eventCode = normalizeEventCode(rawCode)

    if (!eventCode) {
      return res.status(400).json({
        code: 400,
        message: 'Event code is invalid'
      })
    }

    const existing = await MemeEvent.findOne({ eventCode })
    if (existing) {
      return res.status(400).json({
        code: 400,
        message: 'Event code already exists'
      })
    }

    const event = await MemeEvent.create({
      eventCode,
      eventName: req.body.eventName.trim(),
      description: req.body.description?.trim() || '',
      type: 'meme',
      createdBy: req.user._id.toString(),
      createdByName: req.user.nickname || req.user.email,
      isActive: true
    })

    res.status(201).json({
      code: 200,
      message: 'Meme event created successfully',
      data: serializeEvent(event)
    })
  } catch (error) {
    next(error)
  }
})

// @route   PUT /api/meme-events/:eventCode
// @desc    Update a meme event
// @access  Private (owner or admin)
router.put('/:eventCode', protect, memeEventValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        code: 400,
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const event = await MemeEvent.findOne({ eventCode: req.params.eventCode })

    if (!event) {
      return res.status(404).json({
        code: 404,
        message: 'Meme event not found'
      })
    }

    const isOwner = event.createdBy === req.user._id.toString()
    const isAdmin = ['admin', 'super_admin'].includes(req.user.role)

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        code: 403,
        message: 'You can only update your own meme events'
      })
    }

    if (req.body.eventName !== undefined) event.eventName = req.body.eventName.trim()
    if (req.body.description !== undefined) event.description = req.body.description.trim()
    if (req.body.isActive !== undefined) event.isActive = Boolean(req.body.isActive)

    await event.save()

    res.json({
      code: 200,
      message: 'Meme event updated successfully',
      data: serializeEvent(event)
    })
  } catch (error) {
    next(error)
  }
})

export default router
