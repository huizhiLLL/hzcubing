import express from 'express'
import { body, validationResult } from 'express-validator'
import MemeEvent from '../models/MemeEvent.js'
import { adminOnly, optionalAuth, protect } from '../middleware/auth.js'

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

// @route   POST /api/meme-events
// @desc    Create a meme event
// @access  Private (admin)
router.post('/', protect, adminOnly, memeEventValidation, async (req, res, next) => {
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
// @access  Private (admin)
router.put('/:eventCode', protect, adminOnly, memeEventValidation, async (req, res, next) => {
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

    const nextEventCode = req.body.eventCode ? normalizeEventCode(req.body.eventCode) : event.eventCode

    if (!nextEventCode) {
      return res.status(400).json({
        code: 400,
        message: 'Event code is invalid'
      })
    }

    if (nextEventCode !== event.eventCode) {
      const existing = await MemeEvent.findOne({ eventCode: nextEventCode })
      if (existing) {
        return res.status(400).json({
          code: 400,
          message: 'Event code already exists'
        })
      }
      event.eventCode = nextEventCode
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

// @route   DELETE /api/meme-events/:eventCode
// @desc    Delete a meme event
// @access  Private (admin)
router.delete('/:eventCode', protect, adminOnly, async (req, res, next) => {
  try {
    const event = await MemeEvent.findOne({ eventCode: req.params.eventCode })

    if (!event) {
      return res.status(404).json({
        code: 404,
        message: 'Meme event not found'
      })
    }

    await MemeEvent.deleteOne({ _id: event._id })

    res.json({
      code: 200,
      message: 'Meme event deleted successfully'
    })
  } catch (error) {
    next(error)
  }
})

export default router
