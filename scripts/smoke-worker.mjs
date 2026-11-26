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

// Run with an administrator provisioned in the isolated local database.
if (process.env.HZ_TEST_ADMIN_EMAIL && process.env.HZ_TEST_ADMIN_PASSWORD) {
  await call('/api/auth/login', { method: 'POST', data: { email: process.env.HZ_TEST_ADMIN_EMAIL, password: process.env.HZ_TEST_ADMIN_PASSWORD } })
  const adminCookie = cookie
  const code = `score-${randomUUID()}`
  const eventData = { code, name: '积分烟测', category: 'score', active: true }
  assert.equal((await call('/api/events', { method: 'POST', status: 201, data: eventData })).category, 'score')
  await call(`/api/events/${code}`, { method: 'PATCH', status: 400, data: { ...eventData, category: 'meme' } })
  const bot = { Authorization: `Bearer ${botToken}` }
  if (botToken) await call('/api/bot/events', { method: 'POST', status: 201, headers: bot, signedIn: false,
    data: { qqId: '123456789', code: `bot-${randomUUID()}`, name: '机器人积分', category: 'score' } })
  const users = [], records = []
  const qqBase = 300000000 + Math.floor(Math.random() * 100000000)
  for (let i = 0; i < 4; i++) {
    const player = await call('/api/auth/register', { method: 'POST', status: 201, signedIn: false, data: {
      email: `score-${randomUUID()}@example.test`, password, nickname: `积分选手${i}`, qqId: String(qqBase + i),
    } })
    users.push(player)
    const data = { event: code, score: [0, '9.567', 10, 10][i], timestamp: Date.now() - (4 - i) * 86400000 }
    const record = i === 1 && botToken
      ? await call('/api/bot/records', { method: 'POST', status: 201, headers: bot, signedIn: false, data: { ...data, qqId: String(qqBase + 1) } })
      : await call('/api/records', { method: 'POST', status: 201, data })
    assert.equal(record.isScoreGR, i < 3)
    records.push({ ...record, cookie })
  }
  const board = await call(`/api/records/leaderboard?event=${code}&type=average`)
  assert.deepEqual(board.map(row => row.rank), [1, 1, 3, 4])
  assert.deepEqual(board.map(row => row.score), [10, 10, 9.567, 0])
  assert.equal((await call(`/api/records/leaderboard?event=${code}&q=积分选手1`))[0].rank, 3)
  assert.equal((await call(`/api/records/best?event=${code}`))[0].score.userNo, users[2].userNo)
  const history = await call(`/api/records/gr?event=${code}`)
  assert.deepEqual(history.score.map(row => row.score), [10, 9.567, 0])
  assert.deepEqual(history.single, [])
  assert.equal((await call(`/api/players/${users[1].userNo}`)).best.find(row => row.event === code).score, 9.567)
  for (const score of ['', '1:20', 'DNF', '12分', null, '1e2', '9007199254740992']) {
    await call('/api/records', { method: 'POST', status: 400, data: { event: code, score } })
  }
  await call('/api/records', { method: 'POST', status: 400, data: { event: code, score: 1, singleSeconds: 1 } })
  cookie = records[3].cookie
  await call(`/api/records/${records[3].id}`, { method: 'PATCH', status: 400, data: { event: '333' } })
  assert.equal((await call(`/api/records/${records[3].id}`, { method: 'PATCH', data: { cube: '测试' } })).score, 10)
  assert.equal((await call(`/api/records/${records[3].id}`, { method: 'PATCH', data: { score: -2.5 } })).score, -2.5)
  cookie = adminCookie
  await call(`/api/events/${code}`, { method: 'PATCH', data: { ...eventData, active: false } })
  await call('/api/records', { method: 'POST', status: 400, data: { event: code, score: 12 } })
  cookie = records[3].cookie
  await call(`/api/records/${records[3].id}`, { method: 'PATCH', data: { score: 11 } })
  await call(`/api/records/${records[3].id}`, { method: 'DELETE', status: 204 })
  assert.equal((await call(`/api/records/best?event=${code}`))[0].score.userNo, users[2].userNo)
  console.log('Score event validation, ranking, GR, updates, deactivation and bot checks passed.')
}
