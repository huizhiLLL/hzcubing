/**
 * 简化迁移脚本 v3
 * - 从旧 Laf 数据库迁移 users / records
 * - 自动迁移 qqId / qq 字段
 * - 自动将旧库明文密码 bcrypt hash
 * - 显式指定旧数据库名，避免连到 admin/default 库
 *
 * 用法：npm run migrate-simple
 */

import { MongoClient, ObjectId } from 'mongodb'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

dotenv.config()

const OLD_MONGODB_URI = process.env.OLD_MONGODB_URI
const OLD_MONGODB_DB = process.env.OLD_MONGODB_DB || 'sealaf-w3mavh11ex'
const NEW_MONGODB_URI = process.env.MONGODB_URI
const NEW_MONGODB_DB = process.env.NEW_MONGODB_DB || 'hzcubing'

function convertToSeconds(time) {
  if (time === null || time === undefined) return null
  if (typeof time === 'number') return Number.isFinite(time) && time >= 0 ? time : null

  const raw = String(time).trim()
  if (!raw) return null
  const upper = raw.toUpperCase()
  if (upper === 'DNF' || upper === 'DNS') return null

  try {
    const parts = raw.split(':')
    if (parts.length === 3) {
      return parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseFloat(parts[2])
    }
    if (parts.length === 2) {
      return parseInt(parts[0], 10) * 60 + parseFloat(parts[1])
    }
    const seconds = parseFloat(raw)
    return Number.isFinite(seconds) && seconds >= 0 ? seconds : null
  } catch {
    return null
  }
}

function normalizeQQ(oldUser) {
  const qq = oldUser.qqId ?? oldUser.qq ?? null
  if (qq === null || qq === undefined) return null
  const s = String(qq).trim()
  return s || null
}

function isBcryptHash(value) {
  return typeof value === 'string' && value.startsWith('$2')
}

async function hashPasswordIfNeeded(password) {
  const raw = typeof password === 'string' ? password : ''
  if (!raw) {
    return bcrypt.hash('defaultpassword123', 10)
  }
  if (isBcryptHash(raw)) return raw
  return bcrypt.hash(raw, 10)
}

async function migrate() {
  console.log('🚀 开始迁移...\n')

  let oldClient, newClient

  try {
    console.log('📡 连接旧数据库...')
    oldClient = new MongoClient(OLD_MONGODB_URI)
    await oldClient.connect()
    console.log('✅ 已连接旧数据库')

    const oldDb = oldClient.db(OLD_MONGODB_DB)
    const oldUsers = oldDb.collection('users')
    const oldRecords = oldDb.collection('records')

    const oldUserCount = await oldUsers.countDocuments()
    const oldRecordCount = await oldRecords.countDocuments()
    console.log(`📊 旧数据库 ${OLD_MONGODB_DB}：${oldUserCount} 用户，${oldRecordCount} 记录\n`)

    console.log('📡 连接新数据库...')
    newClient = new MongoClient(NEW_MONGODB_URI)
    await newClient.connect()
    console.log('✅ 已连接新数据库')

    const newDb = newClient.db(NEW_MONGODB_DB)
    const newUsers = newDb.collection('users')
    const newRecords = newDb.collection('records')

    console.log('\n🧹 清空新数据库 users / records ...')
    await newUsers.deleteMany({})
    await newRecords.deleteMany({})

    console.log('🧱 整理用户索引...')
    const userIndexes = await newUsers.indexes()
    for (const index of userIndexes) {
      if (index.name === 'qqId_1' || index.name === 'email_1') {
        await newUsers.dropIndex(index.name).catch(() => {})
      }
    }
    console.log('✅ 已清空并整理索引\n')

    console.log('👥 迁移用户...')
    const usersCursor = oldUsers.find({})
    const userMap = new Map()
    let userCount = 0
    let qqMigrated = 0
    let hashedPasswords = 0

    for await (const oldUser of usersCursor) {
      const qqId = normalizeQQ(oldUser)
      const hashedPassword = await hashPasswordIfNeeded(oldUser.password)
      if (!isBcryptHash(oldUser.password)) hashedPasswords++
      if (qqId) qqMigrated++

      const newUser = {
        email: oldUser.email,
        password: hashedPassword,
        nickname: oldUser.nickname || 'Anonymous',
        bio: oldUser.bio || '',
        wcaId: oldUser.wcaId || '',
        avatar: oldUser.avatar || null,
        role: oldUser.role || 'user',
        status: oldUser.status || 'active',
        createdAt: oldUser.createTime || oldUser.createdAt || new Date(),
        updatedAt: new Date()
      }

      if (qqId) {
        newUser.qqId = qqId
      }

      const result = await newUsers.insertOne(newUser)
      userMap.set(String(oldUser._id), result.insertedId)
      userCount++

      if (userCount % 20 === 0) {
        console.log(`   已迁移 ${userCount} 个用户...`)
      }
    }
    console.log(`✅ 用户迁移完成：${userCount} 个`)
    console.log(`🔐 已处理密码 hash：${hashedPasswords} 个`)
    console.log(`🔗 已迁移 QQ 号：${qqMigrated} 个\n`)

    console.log('📝 迁移记录...')
    const recordsCursor = oldRecords.find({})
    let migratedRecords = 0
    let orphanedRecords = 0
    let skippedRecords = 0
    let remappedNickname = 0

    for await (const oldRecord of recordsCursor) {
      const oldUserId = oldRecord.userId ? String(oldRecord.userId) : null
      const newUserId = oldUserId ? userMap.get(oldUserId) : null

      if (!newUserId) {
        orphanedRecords++
        continue
      }

      const singleSeconds = oldRecord.singleSeconds ?? convertToSeconds(oldRecord.single?.time)
      const averageSeconds = oldRecord.averageSeconds ?? convertToSeconds(oldRecord.average?.time)

      if ((singleSeconds !== null && singleSeconds < 0) || (averageSeconds !== null && averageSeconds < 0)) {
        skippedRecords++
        continue
      }

      let nickname = oldRecord.nickname || 'Anonymous'
      const mappedUser = await newUsers.findOne(
        { _id: new ObjectId(newUserId) },
        { projection: { nickname: 1 } }
      )
      if (mappedUser?.nickname) {
        nickname = mappedUser.nickname
        remappedNickname++
      }

      const newRecord = {
        userId: new ObjectId(newUserId),
        nickname,
        event: oldRecord.event,
        singleSeconds,
        averageSeconds,
        cube: oldRecord.cube || null,
        method: oldRecord.method || null,
        scramble: oldRecord.scramble || null,
        timestamp: oldRecord.timestamp ? new Date(oldRecord.timestamp) : (oldRecord.createTime ? new Date(oldRecord.createTime) : new Date()),
        createdAt: oldRecord.createTime || oldRecord.createdAt || new Date(),
        updatedAt: new Date()
      }

      await newRecords.insertOne(newRecord)
      migratedRecords++

      if (migratedRecords % 200 === 0) {
        console.log(`   已迁移 ${migratedRecords} 条记录...`)
      }
    }

    console.log('✅ 记录迁移完成\n')

    console.log('🧱 创建索引...')
    await Promise.allSettled([
      newUsers.createIndex({ email: 1 }, { unique: true }),
      newUsers.createIndex({ qqId: 1 }, { unique: true, sparse: true }),
      newRecords.createIndex({ userId: 1, event: 1, timestamp: -1 }),
      newRecords.createIndex({ event: 1, singleSeconds: 1 }),
      newRecords.createIndex({ event: 1, averageSeconds: 1 }),
      newRecords.createIndex({ timestamp: -1 })
    ])
    console.log('✅ 索引创建完成\n')

    const [newUserCount, newRecordCount] = await Promise.all([
      newUsers.countDocuments(),
      newRecords.countDocuments()
    ])

    console.log('📊 验证结果:')
    console.log(`   新用户数：${newUserCount}`)
    console.log(`   新记录数：${newRecordCount}\n`)

    console.log('📊 迁移总结:')
    console.log('=====================')
    console.log(`✅ 用户：${userCount} → ${newUserCount}`)
    console.log(`✅ 记录：${migratedRecords} → ${newRecordCount}`)
    console.log(`🔐 密码 hash 处理：${hashedPasswords}`)
    console.log(`🔗 QQ 号迁移：${qqMigrated}`)
    console.log(`🏷️  记录昵称重映射：${remappedNickname}`)
    console.log(`⚠️  孤儿记录：${orphanedRecords}`)
    console.log(`⚠️  跳过（无效数据）：${skippedRecords}`)
    console.log('\n✅ 迁移成功完成！')
  } catch (error) {
    console.error('\n❌ 迁移失败:', error.message)
    console.error(error.stack)
    process.exit(1)
  } finally {
    await oldClient?.close().catch(() => {})
    await newClient?.close().catch(() => {})
    console.log('\n📴 数据库连接已关闭')
  }
}

migrate()
