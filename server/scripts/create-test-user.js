/**
 * 创建测试用户（密码正确 hash）
 * 用法：npm run create-test-user
 */

import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

dotenv.config()

async function createTestUser() {
  console.log('🚀 创建测试用户...\n')

  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ 已连接数据库\n')

    const db = mongoose.connection
    const users = db.collection('users')

    // 检查是否已存在
    const existing = await users.findOne({ email: 'testuser@hzcubing.com' })
    if (existing) {
      console.log('⚠️  测试用户已存在，更新密码...\n')
    }

    // Hash 密码
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash('TestPassword123', salt)

    const testUser = {
      email: 'testuser@hzcubing.com',
      password: hashedPassword,
      nickname: '测试用户',
      bio: '这是一个用于 API 测试的用户',
      wcaId: '',
      avatar: null,
      role: 'user',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    if (existing) {
      await users.updateOne(
        { email: 'testuser@hzcubing.com' },
        { $set: { password: hashedPassword, updatedAt: new Date() } }
      )
      console.log('✅ 测试用户密码已更新')
    } else {
      await users.insertOne(testUser)
      console.log('✅ 测试用户已创建')
    }

    console.log('\n📝 测试用户信息:')
    console.log('   邮箱：testuser@hzcubing.com')
    console.log('   密码：TestPassword123')
    console.log('   状态：active')
    console.log('\n📴 数据库连接已关闭')

  } catch (error) {
    console.error('❌ 错误:', error.message)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
  }
}

createTestUser()
