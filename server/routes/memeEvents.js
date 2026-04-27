import express from 'express'
import { validationResult } from 'express-validator'
import MemeEvent from '../models/MemeEvent.js'
import Record from '../models/Record.js'
import { adminOnly, optionalAuth, protect } from '../middleware/auth.js'
import {
  createMemeEvent,
  memeEventValidation,
  normalizeEventCode,
  serializeEvent
} from '../utils/memeEvents.js'

const router = express.Router()
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

    const result = await createMemeEvent({
      eventCode: req.body.eventCode,
      eventName: req.body.eventName,
      description: req.body.description,
      createdBy: req.user._id.toString(),
      createdByName: req.user.nickname || req.user.email
    })

    if (!result.ok) {
      return res.status(result.status).json(result.body)
    }

    res.status(201).json({
      code: 200,
      message: 'Meme event created successfully',
      data: serializeEvent(result.event)
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
    const previousEventCode = event.eventCode

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

    let migratedRecordCount = 0
    if (nextEventCode !== previousEventCode) {
      const migratedRecordsResult = await Record.updateMany(
        { event: previousEventCode },
        { $set: { event: nextEventCode } }
      )
      migratedRecordCount = migratedRecordsResult.modifiedCount
    }

    res.json({
      code: 200,
      message: 'Meme event updated successfully',
      data: {
        ...serializeEvent(event),
        migratedRecordCount
      }
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

    const deletedRecordsResult = await Record.deleteMany({ event: event.eventCode })
    await MemeEvent.deleteOne({ _id: event._id })

    res.json({
      code: 200,
      message: 'Meme event deleted successfully',
      data: {
        deletedRecordCount: deletedRecordsResult.deletedCount
      }
    })
  } catch (error) {
    next(error)
  }
})

export default router
