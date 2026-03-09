import express from 'express'
import { body, validationResult } from 'express-validator'
import Record from '../models/Record.js'
import User from '../models/User.js'
import { protect, optionalAuth } from '../middleware/auth.js'

const router = express.Router()

// Helper: Convert time string to seconds
function convertToSeconds(time) {
  if (time === null || time === undefined) return null
  if (typeof time === 'number') return isNaN(time) ? null : time
  
  const raw = time.toString().trim()
  if (!raw) return null
  const s = raw.toUpperCase()
  
  if (s === 'DNF' || s === 'DNS') return null
  
  const parts = s.split(':')
  let seconds = null
  
  try {
    if (parts.length === 3) {
      const h = parseInt(parts[0], 10)
      const m = parseInt(parts[1], 10)
      const sec = parseFloat(parts[2])
      seconds = h * 3600 + m * 60 + sec
    } else if (parts.length === 2) {
      const m = parseInt(parts[0], 10)
      const sec = parseFloat(parts[1])
      seconds = m * 60 + sec
    } else {
      seconds = parseFloat(s)
    }
  } catch {
    seconds = null
  }
  
  return (seconds === null || isNaN(seconds)) ? null : seconds
}

// Validation rules
const recordValidation = [
  body('event')
    .trim()
    .notEmpty().withMessage('Event is required'),
  body('singleSeconds')
    .optional()
    .isFloat({ min: 0 }).withMessage('Single time must be a positive number'),
  body('averageSeconds')
    .optional()
    .isFloat({ min: 0 }).withMessage('Average time must be a positive number')
]

// @route   GET /api/records
// @desc    Get all records (paginated)
// @access  Public
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { event, page = 1, pageSize = 50 } = req.query
    const pageNum = Math.max(1, parseInt(page))
    const pageSizeNum = Math.min(200, Math.max(1, parseInt(pageSize)))
    const skip = (pageNum - 1) * pageSizeNum

    const query = event ? { event } : {}

    const [records, total] = await Promise.all([
      Record.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(pageSizeNum)
        .lean(),
      Record.countDocuments(query)
    ])

    // Enrich with user nicknames
    const userIds = [...new Set(records.map(r => r.userId).filter(Boolean))]
    const users = await User.find({ _id: { $in: userIds } }).select('nickname').lean()
    const userMap = new Map(users.map(u => [u._id.toString(), u.nickname]))

    const enrichedRecords = records.map(record => ({
      _id: record._id,
      userId: record.userId,
      nickname: userMap.get(record.userId.toString()) || record.nickname || 'Anonymous',
      event: record.event,
      singleSeconds: record.singleSeconds,
      averageSeconds: record.averageSeconds,
      cube: record.cube,
      method: record.method,
      timestamp: record.timestamp
    }))

    res.json({
      code: 200,
      message: 'Success',
      data: enrichedRecords,
      page: pageNum,
      pageSize: pageSizeNum,
      total
    })
  } catch (error) {
    next(error)
  }
})

// @route   GET /api/records/user/:userId
// @desc    Get user's records
// @access  Public
router.get('/user/:userId', optionalAuth, async (req, res, next) => {
  try {
    const { event, page = 1, pageSize = 50 } = req.query
    const pageNum = Math.max(1, parseInt(page))
    const pageSizeNum = Math.min(200, Math.max(1, parseInt(pageSize)))
    const skip = (pageNum - 1) * pageSizeNum

    const query = { userId: req.params.userId }
    if (event) query.event = event

    const [records, total] = await Promise.all([
      Record.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(pageSizeNum)
        .lean(),
      Record.countDocuments(query)
    ])

    // Get user's nickname
    const user = await User.findById(req.params.userId).select('nickname').lean()
    const nickname = user?.nickname || 'Anonymous'

    const enrichedRecords = records.map(record => ({
      _id: record._id,
      userId: record.userId,
      nickname,
      event: record.event,
      singleSeconds: record.singleSeconds,
      averageSeconds: record.averageSeconds,
      cube: record.cube,
      method: record.method,
      timestamp: record.timestamp
    }))

    res.json({
      code: 200,
      message: 'Success',
      data: enrichedRecords,
      page: pageNum,
      pageSize: pageSizeNum,
      total
    })
  } catch (error) {
    next(error)
  }
})

// @route   GET /api/records/best
// @desc    Get best records per event (leaderboard)
// @access  Public
router.get('/best', optionalAuth, async (req, res, next) => {
  try {
    const { event } = req.query

    const query = event ? { event } : {}

    // Get all records for the event(s)
    const records = await Record.find(query).lean()

    // Calculate best times per event
    const bestMap = new Map()

    for (const record of records) {
      const e = record.event
      const s = record.singleSeconds
      const a = record.averageSeconds

      if (!bestMap.has(e)) {
        bestMap.set(e, {
          event: e,
          bestSingleSeconds: null,
          bestSingleUserId: null,
          bestSingleNickname: null,
          bestSingleTimestamp: null,
          bestAverageSeconds: null,
          bestAverageUserId: null,
          bestAverageNickname: null,
          bestAverageTimestamp: null
        })
      }

      const best = bestMap.get(e)

      // Check single best
      if (s !== null && s !== undefined && (best.bestSingleSeconds === null || s < best.bestSingleSeconds)) {
        best.bestSingleSeconds = s
        best.bestSingleUserId = record.userId
        best.bestSingleNickname = record.nickname
        best.bestSingleTimestamp = record.timestamp
      }

      // Check average best
      if (a !== null && a !== undefined && (best.bestAverageSeconds === null || a < best.bestAverageSeconds)) {
        best.bestAverageSeconds = a
        best.bestAverageUserId = record.userId
        best.bestAverageNickname = record.nickname
        best.bestAverageTimestamp = record.timestamp
      }
    }

    // Enrich with current nicknames
    const userIds = [...new Set(
      Array.from(bestMap.values())
        .flatMap(b => [b.bestSingleUserId, b.bestAverageUserId])
        .filter(Boolean)
    )]
    
    const users = await User.find({ _id: { $in: userIds } }).select('nickname').lean()
    const userMap = new Map(users.map(u => [u._id.toString(), u.nickname]))

    const data = Array.from(bestMap.values()).map(best => ({
      event: best.event,
      bestSingleSeconds: best.bestSingleSeconds,
      bestSingleUserId: best.bestSingleUserId,
      bestSingleNickname: userMap.get(best.bestSingleUserId?.toString()) || best.bestSingleNickname || 'Anonymous',
      bestSingleTimestamp: best.bestSingleTimestamp,
      bestAverageSeconds: best.bestAverageSeconds,
      bestAverageUserId: best.bestAverageUserId,
      bestAverageNickname: userMap.get(best.bestAverageUserId?.toString()) || best.bestAverageNickname || 'Anonymous',
      bestAverageTimestamp: best.bestAverageTimestamp
    }))

    res.json({
      code: 200,
      message: 'Success',
      data
    })
  } catch (error) {
    next(error)
  }
})

// @route   GET /api/records/user/:userId/best
// @desc    Get user's best records per event
// @access  Public
router.get('/user/:userId/best', optionalAuth, async (req, res, next) => {
  try {
    const { event } = req.query

    const query = { userId: req.params.userId }
    if (event) query.event = event

    const records = await Record.find(query).lean()

    const bestMap = new Map()

    for (const record of records) {
      const e = record.event
      const s = record.singleSeconds
      const a = record.averageSeconds

      if (!bestMap.has(e)) {
        bestMap.set(e, {
          event: e,
          bestSingleSeconds: null,
          bestAverageSeconds: null
        })
      }

      const best = bestMap.get(e)

      if (s !== null && s !== undefined && (best.bestSingleSeconds === null || s < best.bestSingleSeconds)) {
        best.bestSingleSeconds = s
      }

      if (a !== null && a !== undefined && (best.bestAverageSeconds === null || a < best.bestAverageSeconds)) {
        best.bestAverageSeconds = a
      }
    }

    res.json({
      code: 200,
      message: 'Success',
      data: Array.from(bestMap.values())
    })
  } catch (error) {
    next(error)
  }
})

// @route   GET /api/records/user/:userId/history
// @desc    Get user's record history
// @access  Public
router.get('/user/:userId/history', optionalAuth, async (req, res, next) => {
  try {
    const { event, page = 1, pageSize = 50 } = req.query
    const pageNum = Math.max(1, parseInt(page))
    const pageSizeNum = Math.min(200, Math.max(1, parseInt(pageSize)))
    const skip = (pageNum - 1) * pageSizeNum

    const query = { userId: req.params.userId }
    if (event) query.event = event

    const [records, total] = await Promise.all([
      Record.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(pageSizeNum)
        .lean(),
      Record.countDocuments(query)
    ])

    // Get user's nickname
    const user = await User.findById(req.params.userId).select('nickname').lean()
    const nickname = user?.nickname || 'Anonymous'

    const enrichedRecords = records.map(record => ({
      _id: record._id,
      userId: record.userId,
      nickname,
      event: record.event,
      singleSeconds: record.singleSeconds,
      averageSeconds: record.averageSeconds,
      cube: record.cube,
      method: record.method,
      timestamp: record.timestamp
    }))

    res.json({
      code: 200,
      message: 'Success',
      data: enrichedRecords,
      page: pageNum,
      pageSize: pageSizeNum,
      total
    })
  } catch (error) {
    next(error)
  }
})

// @route   POST /api/records
// @desc    Create a new record
// @access  Private
router.post('/', protect, recordValidation, async (req, res, next) => {
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

    const { event, singleSeconds, averageSeconds, cube, method, scramble, timestamp } = req.body

    // Validate that at least one time is provided
    if (singleSeconds == null && averageSeconds == null) {
      return res.status(400).json({
        code: 400,
        message: 'At least one of singleSeconds or averageSeconds is required'
      })
    }

    const record = new Record({
      userId: req.user._id,
      nickname: req.user.nickname,
      event,
      singleSeconds: singleSeconds ?? null,
      averageSeconds: averageSeconds ?? null,
      cube: cube || null,
      method: method || null,
      scramble: scramble || null,
      timestamp: timestamp ? new Date(timestamp) : new Date()
    })

    await record.save()

    res.status(201).json({
      code: 200,
      message: 'Record created successfully',
      data: {
        _id: record._id
      }
    })
  } catch (error) {
    next(error)
  }
})

// @route   PUT /api/records/:id
// @desc    Update a record
// @access  Private (owner only)
router.put('/:id', protect, async (req, res, next) => {
  try {
    const record = await Record.findById(req.params.id)

    if (!record) {
      return res.status(404).json({
        code: 404,
        message: 'Record not found'
      })
    }

    // Check ownership
    if (record.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        code: 403,
        message: 'You can only update your own records'
      })
    }

    const { event, singleSeconds, averageSeconds, cube, method, scramble } = req.body

    if (event) record.event = event
    if (singleSeconds !== undefined) record.singleSeconds = singleSeconds
    if (averageSeconds !== undefined) record.averageSeconds = averageSeconds
    if (cube !== undefined) record.cube = cube
    if (method !== undefined) record.method = method
    if (scramble !== undefined) record.scramble = scramble

    await record.save()

    res.json({
      code: 200,
      message: 'Record updated successfully'
    })
  } catch (error) {
    next(error)
  }
})

// @route   DELETE /api/records/:id
// @desc    Delete a record
// @access  Private (owner only)
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const record = await Record.findById(req.params.id)

    if (!record) {
      return res.status(404).json({
        code: 404,
        message: 'Record not found'
      })
    }

    // Check ownership
    if (record.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        code: 403,
        message: 'You can only delete your own records'
      })
    }

    await Record.findByIdAndDelete(req.params.id)

    res.json({
      code: 200,
      message: 'Record deleted successfully'
    })
  } catch (error) {
    next(error)
  }
})

// @route   GET /api/records/recent-breaks
// @desc    Get recent record breaks
// @access  Public
router.get('/recent-breaks', optionalAuth, async (req, res, next) => {
  try {
    const { limit = 10 } = req.query
    const limitNum = Math.min(Math.max(1, parseInt(limit)), 100)

    // Get all records sorted by timestamp
    const records = await Record.find().sort({ timestamp: 1 }).lean()

    // Group by event
    const eventRecordsMap = new Map()
    for (const record of records) {
      if (!eventRecordsMap.has(record.event)) {
        eventRecordsMap.set(record.event, [])
      }
      eventRecordsMap.get(record.event).push(record)
    }

    // Find record breaks
    const recordBreaks = []

    for (const [event, eventRecords] of eventRecordsMap.entries()) {
      let bestSingle = Infinity
      let bestAverage = Infinity

      for (const record of eventRecords) {
        const s = record.singleSeconds
        const a = record.averageSeconds
        let isBreakingRecord = false

        if (s !== null && s !== undefined && s < bestSingle) {
          bestSingle = s
          isBreakingRecord = true
        }

        if (a !== null && a !== undefined && a < bestAverage) {
          bestAverage = a
          isBreakingRecord = true
        }

        if (isBreakingRecord) {
          recordBreaks.push({
            _id: record._id,
            userId: record.userId,
            nickname: record.nickname,
            event: record.event,
            singleSeconds: record.singleSeconds,
            averageSeconds: record.averageSeconds,
            timestamp: record.timestamp,
            isSingleRecord: s !== null && s !== undefined && s === bestSingle,
            isAverageRecord: a !== null && a !== undefined && a === bestAverage
          })
        }
      }
    }

    // Sort by timestamp descending and limit
    recordBreaks.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    const data = recordBreaks.slice(0, limitNum)

    // Enrich with current nicknames
    const userIds = [...new Set(data.map(r => r.userId).filter(Boolean))]
    const users = await User.find({ _id: { $in: userIds } }).select('nickname').lean()
    const userMap = new Map(users.map(u => [u._id.toString(), u.nickname]))

    const enrichedData = data.map(record => ({
      ...record,
      nickname: userMap.get(record.userId.toString()) || record.nickname || 'Anonymous'
    }))

    res.json({
      code: 200,
      message: 'Success',
      data: enrichedData
    })
  } catch (error) {
    next(error)
  }
})

export default router
