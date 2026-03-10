/**
 * 修复迁移用户的密码 - 将明文密码 hash
 * 用法：npm run fix-passwords
 */

import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

dotenv.config()

async function fixPasswords() {
  console.log('🔐 开始修复用户密码...\n')

  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ 已连接数据库\n')

    const db = mongoose.connection
    const users = db.collection('users')

    // 获取所有用户
    const allUsers = await users.find({}).toArray()
    console.log(`📊 找到 ${allUsers.length} 个用户\n`)

    let fixedCount = 0
    let skipCount = 0

    for (const user of allUsers) {
      const password = user.password

      // 检查密码是否已经是 hash 格式（bcrypt hash 以 $2 开头）
      if (password.startsWith('$2')) {
        console.log(`⏭️  跳过（已 hash）: ${user.email}`)
        skipCount++
        continue
      }

      // Hash 密码
      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash(password, salt)

      // 更新用户密码
      await users.updateOne(
        { _id: user._id },
        { $set: { password: hashedPassword, updatedAt: new Date() } }
      )

      console.log(`✅ 已修复：${user.email}`)
      fixedCount++
    }

    console.log('\n📊 修复完成:')
    console.log(`   修复：${fixedCount} 个用户`)
    console.log(`   跳过：${skipCount} 个用户`)
    console.log('\n📴 数据库连接已关闭')

  } catch (error) {
    console.error('❌ 错误:', error.message)
    console.error(error.stack)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
  }
}

fixPasswords()
