import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hzcubing'

async function main() {
  await mongoose.connect(mongoURI)
  try {
    const collection = mongoose.connection.collection('records')
    const result = await collection.updateMany(
      { scramble: { $exists: true } },
      { $unset: { scramble: '' } }
    )

    console.log(JSON.stringify({
      matched: result.matchedCount,
      modified: result.modifiedCount
    }, null, 2))
  } finally {
    await mongoose.disconnect()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
