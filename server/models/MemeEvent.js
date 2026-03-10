import mongoose from 'mongoose'

const memeEventSchema = new mongoose.Schema({
  eventCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  eventName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  type: {
    type: String,
    default: 'meme',
    enum: ['meme']
  },
  createdBy: {
    type: String,
    default: 'system'
  },
  createdByName: {
    type: String,
    default: 'system'
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true
})

const MemeEvent = mongoose.model('MemeEvent', memeEventSchema, 'meme_events')

export default MemeEvent
