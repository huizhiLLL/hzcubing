/**
 * Migration script to transfer data from old Laf-style database to new Express + MongoDB schema
 * 
 * Usage: npm run migrate
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

// Old database connection
const OLD_MONGODB_URI = process.env.OLD_MONGODB_URI || 'mongodb://root:dm6fnb84@dbconn.sealosbja.site:40879/?directConnection=true'

// New database connection
const NEW_MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hzcubing'

// Old schemas (Laf style - no strict schema)
// New schemas
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6, select: false },
  nickname: { type: String, required: true, trim: true, maxlength: 50 },
  bio: { type: String, trim: true, maxlength: 500, default: '' },
  wcaId: { type: String, trim: true, uppercase: true, default: '' },
  avatar: { type: String, default: null },
  role: { type: String, enum: ['user', 'admin', 'super_admin'], default: 'user' },
  status: { type: String, enum: ['active', 'inactive', 'banned'], default: 'active' }
}, { timestamps: true })

const recordSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  nickname: { type: String, required: true, trim: true },
  event: { type: String, required: true, index: true },
  singleSeconds: { type: Number, default: null, min: 0 },
  averageSeconds: { type: Number, default: null, min: 0 },
  cube: { type: String, default: null },
  method: { type: String, default: null },
  scramble: { type: String, default: null },
  timestamp: { type: Date, default: Date.now, index: true }
}, { timestamps: true })

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

async function migrate() {
  console.log('🚀 Starting migration...\n')

  let oldDb, newDb

  try {
    // Connect to old database
    console.log('📡 Connecting to old database...')
    await mongoose.connect(OLD_MONGODB_URI)
    oldDb = mongoose.connection
    console.log('✅ Connected to old database\n')

    // Get collections from old database
    const oldUsers = oldDb.collection('users')
    const oldRecords = oldDb.collection('records')

    // Count old records
    const oldUserCount = await oldUsers.countDocuments()
    const oldRecordCount = await oldRecords.countDocuments()
    console.log(`📊 Old database stats:`)
    console.log(`   Users: ${oldUserCount}`)
    console.log(`   Records: ${oldRecordCount}\n`)

    // Disconnect from old database
    await mongoose.disconnect()
    console.log('📴 Disconnected from old database\n')

    // Connect to new database
    console.log('📡 Connecting to new database...')
    await mongoose.connect(NEW_MONGODB_URI)
    newDb = mongoose.connection
    console.log('✅ Connected to new database\n')

    // Create new models
    const User = mongoose.model('User', userSchema)
    const Record = mongoose.model('Record', recordSchema)

    // Clear new collections (optional - comment out if you want to keep existing data)
    console.log('🧹 Clearing new collections...')
    await User.deleteMany({})
    await Record.deleteMany({})
    console.log('✅ Collections cleared\n')

    // Migrate users
    console.log('👥 Migrating users...')
    const oldUsersData = await oldUsers.find({}).toArray()
    
    // Reconnect to old DB to fetch users
    await mongoose.disconnect()
    await mongoose.connect(OLD_MONGODB_URI)
    oldDb = mongoose.connection
    const usersCursor = oldDb.collection('users').find({})
    
    const userMap = new Map() // old _id -> new _id
    let migratedUsers = 0
    let skippedUsers = 0

    for await (const oldUser of usersCursor) {
      try {
        // Skip if email already exists (in case of re-runs)
        const existingUser = await User.findOne({ email: oldUser.email })
        if (existingUser) {
          console.log(`   ⏭️  Skipped (exists): ${oldUser.email}`)
          skippedUsers++
          continue
        }

        // Create new user
        const newUser = new User({
          email: oldUser.email,
          password: oldUser.password || 'defaultpassword123', // Old passwords are plain text
          nickname: oldUser.nickname || 'Anonymous',
          bio: oldUser.bio || '',
          wcaId: oldUser.wcaId || '',
          avatar: oldUser.avatar || null,
          role: oldUser.role || 'user',
          status: oldUser.status || 'active'
        })

        await newUser.save()
        
        // Map old ID to new ID
        userMap.set(oldUser._id.toString(), newUser._id.toString())
        migratedUsers++
        
        console.log(`   ✅ Migrated: ${oldUser.email} -> ${newUser._id}`)
      } catch (error) {
        console.error(`   ❌ Error migrating user ${oldUser.email}:`, error.message)
      }
    }

    console.log(`\n✅ Users migrated: ${migratedUsers}`)
    console.log(`⏭️  Users skipped: ${skippedUsers}\n`)

    // Migrate records
    console.log('📝 Migrating records...')
    await mongoose.disconnect()
    await mongoose.connect(OLD_MONGODB_URI)
    oldDb = mongoose.connection
    const recordsCursor = oldDb.collection('records').find({})
    
    let migratedRecords = 0
    let skippedRecords = 0
    let orphanedRecords = 0

    for await (const oldRecord of recordsCursor) {
      try {
        // Check if user exists in new database
        const newUserId = userMap.get(oldRecord.userId?.toString())
        
        if (!newUserId) {
          // Try to find user by email or other means
          console.log(`   ⚠️  Orphaned record (user not found): ${oldRecord._id}`)
          orphanedRecords++
          continue
        }

        // Convert times to seconds
        const singleSeconds = oldRecord.singleSeconds ?? convertToSeconds(oldRecord.single?.time)
        const averageSeconds = oldRecord.averageSeconds ?? convertToSeconds(oldRecord.average?.time)

        // Create new record
        const newRecord = new Record({
          userId: newUserId,
          nickname: oldRecord.nickname || 'Anonymous',
          event: oldRecord.event,
          singleSeconds: singleSeconds,
          averageSeconds: averageSeconds,
          cube: oldRecord.cube || null,
          method: oldRecord.method || null,
          timestamp: oldRecord.timestamp ? new Date(oldRecord.timestamp) : new Date()
        })

        await newRecord.save()
        migratedRecords++
        
        if (migratedRecords % 100 === 0) {
          console.log(`   ... ${migratedRecords} records migrated`)
        }
      } catch (error) {
        console.error(`   ❌ Error migrating record ${oldRecord._id}:`, error.message)
        skippedRecords++
      }
    }

    console.log(`\n✅ Records migrated: ${migratedRecords}`)
    console.log(`⏭️  Records skipped: ${skippedRecords}`)
    console.log(`⚠️  Orphaned records: ${orphanedRecords}\n`)

    // Summary
    console.log('📊 Migration Summary:')
    console.log('=====================')
    console.log(`Users: ${migratedUsers} migrated, ${skippedUsers} skipped`)
    console.log(`Records: ${migratedRecords} migrated, ${skippedRecords} skipped, ${orphanedRecords} orphaned`)
    console.log('\n✅ Migration completed successfully!')

  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect()
      console.log('\n📴 Database connection closed')
    }
  }
}

// Run migration
migrate()
