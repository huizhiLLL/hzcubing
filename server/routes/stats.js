import express from 'express'
import Record from '../models/Record.js'
import User from '../models/User.js'

const router = express.Router()

// @route   GET /api/stats/summary
// @desc    Get lightweight site summary stats
// @access  Public
router.get('/summary', async (req, res, next) => {
  try {
    const [totalRecords, totalUsers] = await Promise.all([
      Record.countDocuments(),
      User.countDocuments({ status: 'active' })
    ])

    res.json({
      code: 200,
      message: 'Success',
      data: {
        totalRecords,
        totalUsers
      }
    })
  } catch (error) {
    next(error)
  }
})

export default router
