import express from 'express'
import MemeEvent from '../models/MemeEvent.js'

const router = express.Router()

// @route   GET /api/meme-events
// @desc    Get active meme events
// @access  Public
router.get('/', async (req, res, next) => {
  try {
    const events = await MemeEvent.find({ isActive: true })
      .sort({ createdAt: 1, eventCode: 1 })
      .lean()

    res.json({
      code: 200,
      message: 'Success',
      data: events.map(event => ({
        id: event.eventCode,
        name: event.eventName,
        category: 'meme',
        description: event.description || ''
      }))
    })
  } catch (error) {
    next(error)
  }
})

export default router
