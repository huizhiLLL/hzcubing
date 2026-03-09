import mongoose from 'mongoose'

const recordSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  nickname: {
    type: String,
    required: true,
    trim: true
  },
  event: {
    type: String,
    required: true,
    index: true
  },
  singleSeconds: {
    type: Number,
    default: null,
    min: 0
  },
  averageSeconds: {
    type: Number,
    default: null,
    min: 0
  },
  // Additional metadata
  cube: {
    type: String,
    default: null
  },
  method: {
    type: String,
    default: null
  },
  // Scrambles (optional, for verification)
  scramble: {
    type: String,
    default: null
  },
  // Competition info (optional)
  competition: {
    type: String,
    default: null
  },
  // Raw solve data (optional, for averages)
  solves: {
    type: [Number],
    default: []
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Index for efficient queries
recordSchema.index({ userId: 1, event: 1, timestamp: -1 })
recordSchema.index({ event: 1, singleSeconds: 1 })
recordSchema.index({ event: 1, averageSeconds: 1 })

// Virtual for formatted time
recordSchema.virtual('singleFormatted').get(function() {
  return formatTime(this.singleSeconds)
})

recordSchema.virtual('averageFormatted').get(function() {
  return formatTime(this.averageSeconds)
})

// Helper function to format seconds to time string
function formatTime(seconds) {
  if (seconds === null || seconds === undefined) return null
  if (typeof seconds !== 'number' || isNaN(seconds)) return null
  
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toFixed(2).padStart(5, '0')}`
  } else if (m > 0) {
    return `${m}:${s.toFixed(2).padStart(5, '0')}`
  } else {
    return s.toFixed(2)
  }
}

const Record = mongoose.model('Record', recordSchema)

export default Record
