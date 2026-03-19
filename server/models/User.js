import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import Counter from './Counter.js'

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false // Don't return password by default
  },
  nickname: {
    type: String,
    required: [true, 'Nickname is required'],
    trim: true,
    maxlength: 50
  },
  bio: {
    type: String,
    trim: true,
    maxlength: 500,
    default: ''
  },
  wcaId: {
    type: String,
    trim: true,
    uppercase: true,
    default: ''
  },
  avatar: {
    type: String,
    default: null
  },
  qqId: {
    type: String,
    trim: true,
    unique: true,
    sparse: true, // 允许 null 值唯一
    default: null
  },
  userNo: {
    type: Number,
    unique: true,
    sparse: true,
    min: 1
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'super_admin'],
    default: 'user'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'banned'],
    default: 'active'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Auto assign userNo before first save
userSchema.pre('save', async function(next) {
  if (!this.isNew || this.userNo) return next()

  try {
    const counter = await Counter.findByIdAndUpdate(
      'userNo',
      { $inc: { seq: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    )
    this.userNo = counter.seq
    next()
  } catch (error) {
    next(error)
  }
})

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  
  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const obj = this.toObject()
  delete obj.password
  return obj
}

const User = mongoose.model('User', userSchema)

export default User
