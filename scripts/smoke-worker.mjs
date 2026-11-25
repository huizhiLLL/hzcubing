import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'

const origin = process.env.HZ_TEST_ORIGIN ?? 'http://127.0.0.1:8795'
if (!['127.0.0.1', 'localhost'].includes(new URL(origin).hostname)) throw new Error('Use an isolated local Wrangler database')
const email = `smoke-${randomUUID()}@example.test`
const password = 'synthetic-test-password'
let cookie

async function call(path, { method = 'GET', data, body, status = 200, headers = {}, signedIn = true } = {}) {
  const response = await fetch(origin + path, { method, body: body ?? (data === undefined ? undefined : JSON.stringify(data)),
    headers: { Origin: origin, ...(cookie && signedIn ? { Cookie: cookie } : null), ...(data === undefined ? null : { 'Content-Type': 'application/json' }), ...headers },
  })
  const received = response.headers.get('set-cookie')
  if (received) cookie = received.split(';')[0]
  const content = await response.text()
  assert.equal(response.status, status, `${method} ${path}: ${content.slice(0, 400)}`)
  return content && response.headers.get('content-type')?.includes('application/json') ? JSON.parse(content) : content
}

await call('/api/health')
await call('/api/anything-missing', { status: 404 })
assert.match(await call('/user/1', { headers: { 'Sec-Fetch-Mode': 'navigate' } }), /<div id="app">/)
await call('/api/auth/me', { status: 401 })
const user = await call('/api/auth/register', { method: 'POST', status: 201, data: { email, password, nickname: '迁移烟测' } })
assert.equal((await call('/api/auth/me')).userNo, user.userNo)
await call('/api/auth/logout', { method: 'POST', status: 204 })
await call('/api/auth/me', { status: 401 })
await call('/api/auth/login', { method: 'POST', status: 401, data: { email, password: 'incorrect' } })
await call('/api/auth/login', { method: 'POST', data: { email, password } })
await call('/api/profile', { method: 'PATCH', data: { bio: '烟测简介' } })
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aA14AAAAASUVORK5CYII=', 'base64')
const { avatar } = await call('/api/profile/avatar', { method: 'PUT', body: png })
assert.ok(avatar.startsWith('/media/avatars/'))
const image = await fetch(origin + avatar)
assert.equal(image.headers.get('content-type'), 'image/png')
assert.deepEqual(Buffer.from(await image.arrayBuffer()), png)
await call('/api/events', { method: 'POST', status: 403, data: { code: 'smoke', name: '烟测' } })
await call('/api/bot/player?qqId=10000', { status: 401, signedIn: false })
const botToken = process.env.HZ_TEST_BOT_SECRET
if (botToken) {
  const qqId = String(100_000_000 + Math.floor(Math.random() * 8e8))
  await call('/api/profile/qq', { method: 'POST', data: { qqId } })
  const bot = { Authorization: `Bearer ${botToken}` }
  assert.equal((await call(`/api/bot/player?qqId=${qqId}`, { headers: bot, signedIn: false })).userNo, user.userNo)
  await call('/api/bot/records', { method: 'POST', status: 201, data: { qqId, event: '333', singleSeconds: 58.42 }, headers: bot, signedIn: false })
}
const record = await call('/api/records', { method: 'POST', status: 201, data: { event: '333', singleSeconds: '12.349', averageSeconds: '14.26' } })
assert.equal(record.singleSeconds, 12.34)
assert.equal((await call(`/api/players/${user.userNo}`)).best[0].singleSeconds, 12.34)
assert.ok((await call('/api/records/leaderboard?event=333')).some(row => row.id === record.id))
assert.ok(Array.isArray((await call('/api/records/gr?event=333')).single))
const current = await call('/api/records/best?event=333')
assert.equal(current[0].event, '333')
assert.ok(current[0].single.seconds <= 12.34)
await call(`/api/records/${record.id}`, { method: 'PATCH', status: 403, headers: { Origin: 'https://foreign.example' }, data: { cube: 'x' } })
assert.equal((await call(`/api/records/${record.id}`, { method: 'PATCH', data: { cube: '新版配重' } })).singleSeconds, 12.34)
await call(`/api/records/${record.id}`, { method: 'DELETE', status: 204 })
await call(`/api/records/${record.id}`, { status: 404 })
console.log('Worker SPA, sessions, permissions, D1 records, GR, R2 avatar and bot checks passed.')
