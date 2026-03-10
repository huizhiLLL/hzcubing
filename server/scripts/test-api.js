/**
 * HZCubing API 批量测试脚本
 * 
 * 测试所有主要 API 端点的功能
 * 用法：npm run test-api
 */

import fetch from 'node-fetch'
import dotenv from 'dotenv'

dotenv.config()

const BASE_URL = `http://localhost:${process.env.PORT || 3002}/api`

// 测试统计
const stats = {
  passed: 0,
  failed: 0,
  total: 0
}

// 测试用户数据
const testUsers = [
  { email: 'testuser@hzcubing.com', password: 'TestPassword123' },  // 专用测试用户
  { email: '3169164181@qq.com', password: 'huzeliang0822' }  // 会枝的账号（如果密码已正确 hash）
]

let authToken = null
let testUserId = null

// 辅助函数
function log(message, type = 'info') {
  const icons = {
    info: '📝',
    success: '✅',
    error: '❌',
    warn: '⚠️',
    test: '🧪'
  }
  console.log(`${icons[type] || '📝'} ${message}`)
}

function assert(condition, message) {
  stats.total++
  if (condition) {
    stats.passed++
    log(`✓ ${message}`, 'success')
    return true
  } else {
    stats.failed++
    log(`✗ ${message}`, 'error')
    return false
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 测试用例
const tests = {
  // 1. 健康检查
  async healthCheck() {
    log('测试：健康检查', 'test')
    try {
      // Health check is at root level, not under /api
      const res = await fetch(`${BASE_URL.replace('/api', '')}/health`)
      const data = await res.json()
      
      if (res.status !== 200) {
        assert(false, `健康检查：HTTP ${res.status}`)
        return
      }
      if (data.status !== 'ok') {
        assert(false, `健康检查：status=${data.status}`)
        return
      }
      
      assert(true, '健康检查通过')
    } catch (error) {
      assert(false, `健康检查异常：${error.message}`)
    }
  },

  // 2. 测试登录
  async testLogin() {
    log('测试：用户登录', 'test')
    for (const user of testUsers) {
      try {
        const res = await fetch(`${BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(user)
        })
        const data = await res.json()
        
        if (res.status === 200 && data.code === 200) {
          authToken = data.data.token
          testUserId = data.data.user.id
          log(`登录成功：${user.email}`, 'success')
          assert(true, `用户 ${user.email} 登录成功`)
          return true
        } else {
          log(`登录失败：${user.email} - ${data.message}`, 'warn')
        }
      } catch (error) {
        log(`登录错误 ${user.email}: ${error.message}`, 'error')
      }
    }
    assert(false, '至少一个用户登录成功')
    return false
  },

  // 3. 测试获取当前用户信息
  async testGetCurrentUser() {
    log('测试：获取当前用户信息', 'test')
    if (!authToken) {
      log('跳过：未登录', 'warn')
      return
    }
    try {
      const res = await fetch(`${BASE_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      const data = await res.json()
      assert(res.status === 200, '获取用户信息返回 200')
      assert(data.code === 200, '响应码正确')
      assert(data.data.email !== undefined, '返回用户数据')
      log(`当前用户：${data.data.nickname} (${data.data.email})`, 'success')
    } catch (error) {
      log(`获取用户信息失败：${error.message}`, 'error')
      assert(false, '获取用户信息成功')
    }
  },

  // 4. 测试获取记录列表
  async testGetRecords() {
    log('测试：获取记录列表', 'test')
    try {
      const res = await fetch(`${BASE_URL}/records?page=1&pageSize=10`)
      const data = await res.json()
      assert(res.status === 200, '获取记录返回 200')
      assert(data.code === 200, '响应码正确')
      assert(Array.isArray(data.data), '返回数据是数组')
      log(`获取到 ${data.data.length} 条记录 (总数：${data.total})`, 'success')
    } catch (error) {
      log(`获取记录失败：${error.message}`, 'error')
      assert(false, '获取记录成功')
    }
  },

  // 5. 测试按事件筛选记录
  async testGetRecordsByEvent() {
    log('测试：按事件筛选记录', 'test')
    try {
      const res = await fetch(`${BASE_URL}/records?event=333&page=1&pageSize=5`)
      const data = await res.json()
      assert(res.status === 200, '按事件筛选返回 200')
      if (data.data.length > 0) {
        assert(data.data.every(r => r.event === '333'), '所有记录都是 333 事件')
        log(`获取到 ${data.data.length} 条 333 记录`, 'success')
      } else {
        log('没有 333 事件记录', 'warn')
      }
    } catch (error) {
      log(`按事件筛选失败：${error.message}`, 'error')
      assert(false, '按事件筛选成功')
    }
  },

  // 6. 测试获取用户列表
  async testGetUsers() {
    log('测试：获取用户列表', 'test')
    try {
      const res = await fetch(`${BASE_URL}/users?page=1&pageSize=10`)
      const data = await res.json()
      assert(res.status === 200, '获取用户列表返回 200')
      assert(data.code === 200, '响应码正确')
      assert(Array.isArray(data.data), '返回数据是数组')
      log(`获取到 ${data.data.length} 个用户 (总数：${data.total})`, 'success')
    } catch (error) {
      log(`获取用户列表失败：${error.message}`, 'error')
      assert(false, '获取用户列表成功')
    }
  },

  // 7. 测试获取单个用户
  async testGetUserById() {
    log('测试：获取单个用户', 'test')
    if (!testUserId) {
      log('跳过：没有测试用户 ID', 'warn')
      return
    }
    try {
      const res = await fetch(`${BASE_URL}/users/${testUserId}`)
      const data = await res.json()
      assert(res.status === 200, '获取用户返回 200')
      assert(data.code === 200, '响应码正确')
      assert(data.data.id === testUserId, '返回正确的用户 ID')
      log(`获取用户：${data.data.nickname}`, 'success')
    } catch (error) {
      log(`获取用户失败：${error.message}`, 'error')
      assert(false, '获取用户成功')
    }
  },

  // 8. 测试无效 token
  async testInvalidToken() {
    log('测试：无效 Token 处理', 'test')
    try {
      const res = await fetch(`${BASE_URL}/auth/me`, {
        headers: { 'Authorization': 'Bearer invalid_token_here' }
      })
      assert(res.status === 401, '无效 token 返回 401')
      log('无效 token 正确处理', 'success')
    } catch (error) {
      log(`无效 token 测试失败：${error.message}`, 'error')
      assert(false, '无效 token 处理正确')
    }
  },

  // 9. 测试 404 路由
  async testNotFound() {
    log('测试：404 路由处理', 'test')
    try {
      const res = await fetch(`${BASE_URL}/nonexistent`)
      assert(res.status === 404, '不存在的路由返回 404')
      log('404 路由正确处理', 'success')
    } catch (error) {
      log(`404 测试失败：${error.message}`, 'error')
      assert(false, '404 处理正确')
    }
  },

  // 10. 测试 CORS（可选）
  async testCORS() {
    log('测试：CORS 配置', 'test')
    try {
      const res = await fetch(`${BASE_URL}/health`, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:5174',
          'Access-Control-Request-Method': 'GET'
        }
      })
      const corsHeader = res.headers.get('access-control-allow-origin')
      log(`CORS 允许来源：${corsHeader || '未设置'}`, corsHeader ? 'success' : 'warn')
    } catch (error) {
      log(`CORS 测试失败：${error.message}`, 'error')
    }
  }
}

// 主测试流程
async function runTests() {
  log('========================================', 'info')
  log('🚀 HZCubing API 批量测试开始', 'info')
  log(`📍 API 地址：${BASE_URL}`, 'info')
  log('========================================\n', 'info')

  await sleep(500)

  // 基础测试（不需要登录）
  await tests.healthCheck()
  await sleep(300)

  await tests.testNotFound()
  await sleep(300)

  await tests.testInvalidToken()
  await sleep(300)

  await tests.testCORS()
  await sleep(300)

  // 需要登录的测试
  const loggedIn = await tests.testLogin()
  await sleep(300)

  if (loggedIn) {
    await tests.testGetCurrentUser()
    await sleep(300)

    await tests.testGetRecords()
    await sleep(300)

    await tests.testGetRecordsByEvent()
    await sleep(300)

    await tests.testGetUsers()
    await sleep(300)

    await tests.testGetUserById()
    await sleep(300)
  } else {
    log('跳过需要登录的测试', 'warn')
  }

  // 输出统计
  console.log('\n========================================')
  log('📊 测试统计', 'info')
  log('========================================', 'info')
  log(`总测试数：${stats.total}`, 'info')
  log(`✅ 通过：${stats.passed}`, 'success')
  log(`❌ 失败：${stats.failed}`, stats.failed === 0 ? 'success' : 'error')
  log(`成功率：${((stats.passed / stats.total) * 100).toFixed(1)}%`, 'info')
  console.log('========================================\n')

  if (stats.failed > 0) {
    log('⚠️  部分测试失败，请检查日志', 'warn')
    process.exit(1)
  } else {
    log('🎉 所有测试通过！', 'success')
    process.exit(0)
  }
}

// 运行测试
runTests().catch(error => {
  log(`测试执行错误：${error.message}`, 'error')
  console.error(error)
  process.exit(1)
})
