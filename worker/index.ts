import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { bodyLimit } from 'hono/body-limit'
import { auth, loadSession } from './auth'
import { events, saveEvent } from './events'
import { digest, fail, json, publicUser } from './http'
import { addRecord, records } from './records'
import { isProfileForm, maxAvatarSize, players, profile, qqId } from './users'
import type { App, User } from './types'

const app = new Hono<App>({ strict: false })
app.onError((error, c) => {
  c.header('Cache-Control', 'no-store')
  if (error instanceof HTTPException) return c.json({ message: error.message }, error.status)
  console.error('Worker request failed', c.req.method, c.req.header('CF-Ray') ?? 'local')
  return c.json({ message: '服务暂不可用，请稍后再试' }, 500)
})
app.notFound(c => c.json({ message: '找不到请求的资源' }, 404))
app.use('/api/*', async (c, next) => {
  c.header('Cache-Control', 'no-store')
  if (!['GET', 'HEAD', 'OPTIONS'].includes(c.req.method)) {
    if (c.env.SITE_READ_ONLY === '1') fail(503, '站点迁移中，暂时暂停写入')
    if (!c.req.path.startsWith('/api/bot/') && c.req.header('Origin') !== new URL(c.req.url).origin) fail(403, '请求来源不匹配')
    if (c.req.path !== '/api/profile/avatar') {
      const profileForm = c.req.method === 'PATCH' && /^\/api\/profile\/?$/.test(c.req.path) && isProfileForm(c.req.header('Content-Type'))
      return bodyLimit({ maxSize: profileForm ? maxAvatarSize + 32_000 : 32_000, onError: () => fail(413, '请求内容过大') })(c, next)
    }
  }
  await next()
})
app.use('/api/auth/*', loadSession)
app.use('/api/profile/*', loadSession)
app.use('/api/records/*', async (c, next) => c.req.method === 'GET' ? next() : loadSession(c, next))
app.use('/api/events/*', async (c, next) => c.req.method === 'GET' ? next() : loadSession(c, next))
app.get('/api/health', c => c.json({ ok: true }))
app.get('/api/summary', async c => {
  const row = await c.env.DB.prepare(`SELECT (SELECT COUNT(*) FROM users) AS users,
    (SELECT COUNT(*) FROM records) AS records, (SELECT COUNT(*) FROM events WHERE active=1) AS events`).first()
  return c.json(row)
})
app.route('/api/auth', auth)
app.route('/api/profile', profile)
app.route('/api/players', players)
app.route('/api/records', records)
app.route('/api/events', events)

app.use('/api/bot/*', async (c, next) => {
  const expected = c.env.BOT_SECRET
  const provided = c.req.header('Authorization')?.match(/^Bearer ([a-zA-Z0-9_-]{32,128})$/)?.[1]
  if (!expected || !provided) fail(401, '需要机器人凭据')
  const [a, b] = await Promise.all([digest(expected), digest(provided)])
  let difference = 0
  for (let i = 0; i < a.length; i++) difference |= a.charCodeAt(i) ^ b.charCodeAt(i)
  if (difference) fail(401, '机器人凭据错误')
  await next()
})
async function linkedUser(db: D1Database, value: unknown) {
  const user = await db.prepare("SELECT * FROM users WHERE qq_id=? AND status='active'").bind(qqId(value)).first<User>()
  if (!user) fail(404, '此 QQ 尚未绑定可用账号，请在网站个人资料中绑定')
  return user
}
app.get('/api/bot/player', async c => c.json(publicUser(await linkedUser(c.env.DB, c.req.query('qqId')))))
app.post('/api/bot/records', async c => {
  const input = await json(c)
  return c.json(await addRecord(c, await linkedUser(c.env.DB, input.qqId), input), 201)
})
app.post('/api/bot/events', async c => {
  const input = await json(c)
  const user = await linkedUser(c.env.DB, input.qqId)
  if (user.role === 'user') fail(403, '需要管理员权限')
  return c.json(await saveEvent(c, user, input), 201)
})

app.get('/media/avatars/:user/:file', async c => {
  const { user, file } = c.req.param()
  if (!/^[a-f0-9-]{24,36}$/.test(user) || !/^[a-f0-9]{64}\.(png|jpg|gif|webp|avif)$/.test(file)) fail(404, '找不到该头像')
  const object = await c.env.AVATARS.get(`avatars/${user}/${file}`)
  if (!object) fail(404, '找不到该头像')
  const headers = new Headers({ 'Cache-Control': 'public, max-age=86400, immutable', 'ETag': object.httpEtag, 'X-Content-Type-Options': 'nosniff' })
  object.writeHttpMetadata(headers)
  return new Response(object.body, { headers })
})
export default app
