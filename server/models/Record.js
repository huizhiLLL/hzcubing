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
    min: 0,
    set: truncateToTwoDecimals
  },
  averageSeconds: {
    type: Number,
    default: null,
    min: 0,
    set: truncateToTwoDecimals
  },
  cube: {
    type: String,
    default: null
  },
  method: {
    type: String,
    default: null
  },
  competition: {
    type: String,
    default: null
  },
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

recordSchema.index({ userId: 1, event: 1, timestamp: -1 })
recordSchema.index({ event: 1, singleSeconds: 1 })
recordSchema.index({ event: 1, averageSeconds: 1 })

recordSchema.virtual('singleFormatted').get(function() {
  return formatTime(this.singleSeconds)
})

recordSchema.virtual('averageFormatted').get(function() {
  return formatTime(this.averageSeconds)
})

function truncateToTwoDecimals(value) {
  if (value === null || value === undefined) return null
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return null
  return Math.trunc(numeric * 100) / 100
}

function formatTime(seconds) {
  const normalized = truncateToTwoDecimals(seconds)
  if (normalized === null) return null

  const totalCentiseconds = Math.trunc(normalized * 100)
  const h = Math.floor(totalCentiseconds / 360000)
  const m = Math.floor((totalCentiseconds % 360000) / 6000)
  const wholeSeconds = Math.floor((totalCentiseconds % 6000) / 100)
  const centiseconds = totalCentiseconds % 100
  const secondText = `${wholeSeconds}.${centiseconds.toString().padStart(2, '0')}`.padStart(5, '0')

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${secondText}`
  } else if (m > 0) {
    return `${m}:${secondText}`
  } else {
    return `${wholeSeconds}.${centiseconds.toString().padStart(2, '0')}`
  }
}

const Record = mongoose.model('Record', recordSchema)

export default Record
