/**
 * 迁移旧数据库的 QQ 号数据到新数据库
 * 用法：npm run migrate-qq-ids
 */

import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'

dotenv.config()

const OLD_MONGODB_URI = process.env.OLD_MONGODB_URI
const NEW_MONGODB_URI = process.env.MONGODB_URI

async function migrateQQIds() {
  console.log('🔗 开始迁移 QQ 号数据...\n')

  let oldClient, newClient

  try {
    // 连接旧数据库
    console.log('📡 连接旧数据库...')
    oldClient = new MongoClient(OLD_MONGODB_URI)
    await oldClient.connect()
    console.log('✅ 已连接旧数据库')

    const oldDb = oldClient.db()
    const oldUsers = oldDb.collection('users')
    
    // 检查是否有 qqId 或 qq 字段
    const sampleUser = await oldUsers.findOne({ qqId: { $exists: true } })
    const hasQQId = sampleUser !== null
    
    const sampleUser2 = await oldUsers.findOne({ qq: { $exists: true } })
    const hasQQ = sampleUser2 !== null
    
    console.log(`📊 旧数据库字段检查:`)
    console.log(`   qqId 字段：${hasQQId ? '✓ 存在' : '✗ 不存在'}`)
    console.log(`   qq 字段：${hasQQ ? '✓ 存在' : '✗ 不存在'}`)
    
    if (!hasQQId && !hasQQ) {
      console.log('\n⚠️  旧数据库没有 QQ 号数据，跳过迁移')
      return
    }

    // 连接新数据库
    console.log('\n📡 连接新数据库...')
    newClient = new MongoClient(NEW_MONGODB_URI)
    await newClient.connect()
    console.log('✅ 已连接新数据库')

    const newDb = newClient.db()
    const newUsers = newDb.collection('users')

    // 查询有 QQ 号的用户
    const qqField = hasQQId ? 'qqId' : 'qq'
    const usersWithQQ = await oldUsers.find({ [qqField]: { $exists: true, $ne: null } }).toArray()
    
    console.log(`\n📊 找到 ${usersWithQQ.length} 个有 QQ 号的用户\n`)

    let migratedCount = 0
    let skippedCount = 0
    let errorCount = 0

    for (const oldUser of usersWithQQ) {
      try {
        const oldQQ = oldUser[qqField]
        if (!oldQQ) continue

        // 在新数据库中查找对应的用户（通过 email）
        const newUser = await newUsers.findOne({ email: oldUser.email })
        
        if (!newUser) {
          console.log(`⏭️  跳过（新用户不存在）: ${oldUser.email}`)
          skippedCount++
          continue
        }

        // 检查 QQ 号是否已被其他用户绑定
        const existingQQUser = await newUsers.findOne({ 
          qqId: oldQQ, 
          _id: { $ne: newUser._id } 
        })
        
        if (existingQQUser) {
          console.log(`⏭️  跳过（QQ 已绑定）: ${oldUser.email} -> ${oldQQ}`)
          skippedCount++
          continue
        }

        // 更新 QQ 号
        await newUsers.updateOne(
          { _id: newUser._id },
          { $set: { qqId: oldQQ, updatedAt: new Date() } }
        )

        console.log(`✅ 已迁移：${oldUser.email} -> ${oldQQ}`)
        migratedCount++

      } catch (error) {
        console.error(`❌ 迁移失败 ${oldUser.email}: ${error.message}`)
        errorCount++
      }
    }

    console.log('\n📊 迁移总结:')
    console.log('=====================')
    console.log(`✅ 成功迁移：${migratedCount} 个用户`)
    console.log(`⏭️  跳过：${skippedCount} 个用户`)
    console.log(`❌ 失败：${errorCount} 个用户`)
    console.log('\n✅ QQ 号迁移完成！')

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

migrateQQIds()
