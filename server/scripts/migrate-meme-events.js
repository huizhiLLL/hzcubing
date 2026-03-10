import mongoose from 'mongoose'
import dotenv from 'dotenv'
import MemeEvent from '../models/MemeEvent.js'

dotenv.config()

const OLD_URI = process.env.OLD_MONGODB_URI || 'mongodb://root:dm6fnb84@dbconn.sealosbja.site:49989/?directConnection=true&authSource=admin'
const OLD_DB = process.env.OLD_MONGODB_DB || 'sealaf-w3mavh11ex'
const NEW_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hzcubing'

async function main() {
  const oldConn = await mongoose.createConnection(OLD_URI, { dbName: OLD_DB }).asPromise()
  const newConn = await mongoose.createConnection(NEW_URI).asPromise()

  try {
    const oldDocs = await oldConn.db.collection('meme_events').find({}).toArray()

    if (!oldDocs.length) {
      console.log('No meme events found in old database.')
      return
    }

    const ops = oldDocs.map((doc) => ({
      updateOne: {
        filter: { eventCode: doc.eventCode },
        update: {
          $set: {
            eventCode: doc.eventCode,
            eventName: doc.eventName || doc.eventCode,
            description: doc.description || '',
            type: 'meme',
            createdBy: doc.createdBy || 'system',
            createdByName: doc.createdByName || '系统迁移',
            isActive: doc.isActive !== false,
            createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
            updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : new Date()
          }
        },
        upsert: true
      }
    }))

    const result = await newConn.collection('meme_events').bulkWrite(ops, { ordered: false })
    console.log(JSON.stringify({
      sourceCount: oldDocs.length,
      upserted: result.upsertedCount,
      modified: result.modifiedCount,
      matched: result.matchedCount
    }, null, 2))
  } finally {
    await oldConn.close()
    await newConn.close()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
