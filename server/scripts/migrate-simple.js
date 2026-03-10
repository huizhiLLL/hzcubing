/**
 * 简化的迁移脚本 v2 - 修复连接问题
 * 用法：npm run migrate-simple
 */

import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'

dotenv.config()

const OLD_MONGODB_URI = process.env.OLD_MONGODB_URI
const NEW_MONGODB_URI = process.env.MONGODB_URI

async function migrate() {
  console.log('🚀 开始简化迁移...\n')

  let oldClient, newClient

  try {
    // 连接旧数据库
    console.log('📡 连接旧数据库...')
    oldClient = new MongoClient(OLD_MONGODB_URI)
    await oldClient.connect()
    console.log('✅ 已连接旧数据库')

    const oldDb = oldClient.db()
    const oldUsers = oldDb.collection('users')
    const oldRecords = oldDb.collection('records')
    
    const oldUserCount = await oldUsers.countDocuments()
    const oldRecordCount = await oldRecords.countDocuments()
    console.log(`📊 旧数据库：${oldUserCount} 用户，${oldRecordCount} 记录\n`)

    // 连接新数据库
    console.log('📡 连接新数据库...')
    newClient = new MongoClient(NEW_MONGODB_URI)
    await newClient.connect()
    console.log('✅ 已连接新数据库')

    const newDb = newClient.db()
    const newUsers = newDb.collection('users')
    const newRecords = newDb.collection('records')
    
    // 清空新数据库
    console.log('\n🧹 清空新数据库...')
    await newUsers.deleteMany({})
    await newRecords.deleteMany({})
    console.log('✅ 已清空\n')

    // 迁移用户
    console.log('👥 迁移用户...')
    const usersCursor = oldUsers.find({})
    const userMap = new Map()
    let userCount = 0
    
    for await (const oldUser of usersCursor) {
      const newUser = {
        email: oldUser.email,
        password: oldUser.password || 'defaultpassword123',
        nickname: oldUser.nickname || 'Anonymous',
        bio: oldUser.bio || '',
        wcaId: oldUser.wcaId || '',
        avatar: oldUser.avatar || null,
        role: oldUser.role || 'user',
        status: oldUser.status || 'active',
        createdAt: oldUser.createTime || oldUser.createdAt || new Date(),
        updatedAt: new Date()
      }
      
      const result = await newUsers.insertOne(newUser)
      userMap.set(oldUser._id.toString(), result.insertedId.toString())
      userCount++
      
      if (userCount % 10 === 0) {
        console.log(`   已迁移 ${userCount} 个用户...`)
      }
    }
    console.log(`✅ 用户迁移完成：${userCount} 个\n`)

    // 迁移记录
    console.log('📝 迁移记录...')
    const recordsCursor = oldRecords.find({})
    let migratedRecords = 0
    let orphanedRecords = 0
    let skippedRecords = 0

    // 时间转换函数
    const convertToSeconds = (time) => {
      if (time === null || time === undefined) return null
      if (typeof time === 'number') return time < 0 ? null : time
      
      const raw = time.toString().trim()
      if (!raw || raw === 'DNF' || raw === 'DNS') return null
      
      try {
        const parts = raw.split(':')
        if (parts.length === 3) {
          return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2])
        } else if (parts.length === 2) {
          return parseInt(parts[0]) * 60 + parseFloat(parts[1])
        } else {
          return parseFloat(raw)
        }
      } catch {
        return null
      }
    }

    for await (const oldRecord of recordsCursor) {
      const newUserId = userMap.get(oldRecord.userId?.toString())
      
      if (!newUserId) {
        orphanedRecords++
        continue
      }

      const singleSeconds = oldRecord.singleSeconds ?? convertToSeconds(oldRecord.single?.time)
      const averageSeconds = oldRecord.averageSeconds ?? convertToSeconds(oldRecord.average?.time)

      // 跳过无效数据
      if ((singleSeconds !== null && singleSeconds < 0) || (averageSeconds !== null && averageSeconds < 0)) {
        skippedRecords++
        continue
      }

      const newRecord = {
        userId: newUserId,
        nickname: oldRecord.nickname || 'Anonymous',
        event: oldRecord.event,
        singleSeconds: singleSeconds,
        averageSeconds: averageSeconds,
        cube: oldRecord.cube || null,
        method: oldRecord.method || null,
        scramble: oldRecord.scramble || null,
        timestamp: oldRecord.timestamp ? new Date(oldRecord.timestamp) : new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await newRecords.insertOne(newRecord)
      migratedRecords++
      
      if (migratedRecords % 100 === 0) {
        console.log(`   已迁移 ${migratedRecords} 条记录...`)
      }
    }

    console.log(`✅ 记录迁移完成\n`)

    // 验证
    const newUserCount = await newUsers.countDocuments()
    const newRecordCount = await newRecords.countDocuments()
    console.log('📊 验证结果:')
    console.log(`   新用户数：${newUserCount}`)
    console.log(`   新记录数：${newRecordCount}\n`)

    // 统计
    console.log('📊 迁移总结:')
    console.log('=====================')
    console.log(`✅ 用户：${userCount} → ${newUserCount}`)
    console.log(`✅ 记录：${migratedRecords} → ${newRecordCount}`)
    console.log(`⚠️  孤儿记录：${orphanedRecords}`)
    console.log(`⚠️  跳过（无效数据）：${skippedRecords}`)
    console.log('\n✅ 迁移成功完成！')

  } catch (error) {
    console.error('\n❌ 迁移失败:', error.message)
    console.error(error.stack)
    process.exit(1)
  } finally {
    await oldClient?.close()
    await newClient?.close()
    console.log('\n📴 数据库连接已关闭')
  }
}

migrate()
