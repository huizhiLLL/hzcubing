import { Hono } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import type { App, AppContext, User } from './types'
import { digest, fail, json, publicUser, signedIn, text, uniqueError } from './http'
import { qqId } from './users'

const days30 = 30 * 86400
const dummyHash = '$2a$10$T8W3d6s9bFmELCXEnbkO7uKZs9muUCcFzA2l0JgOaeFeNVF7CCIKq'
const name = (c: AppContext) => new URL(c.req.url).protocol === 'https:' ? '__Host-hz_session' : 'hz_dev_session'
const passwordBytes = (password: string) => new TextEncoder().encode(password).length
const cookieOptions = (c: AppContext) => ({ path: '/', sameSite: 'Lax' as const, secure: name(c).startsWith('__Host-'), httpOnly: true })

export async function loadSession(c: AppContext, next: () => Promise<void>) {
  c.set('user', null)
  c.set('session', null)
  const value = getCookie(c, name(c))
  if (value && /^[0-9a-f]{64}$/.test(value)) {
    const session = await digest(value)
    const user = await c.env.DB.prepare(`SELECT users.* FROM users JOIN sessions ON sessions.user_id=users.id
      WHERE sessions.digest=? AND sessions.expires_at>? AND users.status='active'`).bind(session, Date.now()).first<User>()
    c.set('session', session)
    c.set('user', user)
  }
  await next()
}

async function issueSession(c: AppContext, id: string) {
  const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, '0')).join('')
  const now = Date.now()
  await c.env.DB.batch([
    c.env.DB.prepare('DELETE FROM sessions WHERE expires_at<=? OR digest=?').bind(now, c.get('session')),
    c.env.DB.prepare('INSERT INTO sessions (digest,user_id,expires_at) VALUES (?,?,?)').bind(await digest(token), id, now + 1000 * days30),
  ])
  setCookie(c, name(c), token, { ...cookieOptions(c), maxAge: days30 })
}

async function passwordService(c: AppContext, route: 'hash' | 'verify', password: string, hash?: string) {
  let response: Response
  try {
    const base = new URL(c.env.PASSWORD_SERVICE_URL)
    if (base.protocol !== 'https:' && !(c.env.DEV_PASSWORD_HTTP === '1' && base.hostname === '127.0.0.1')) throw new Error('HTTPS required')
    response = await fetch(new URL(`${base.pathname.replace(/\/$/, '')}/${route}`, base), {
      method: 'POST', redirect: 'manual', signal: AbortSignal.timeout(3500),
      headers: { Authorization: `Bearer ${c.env.PASSWORD_SERVICE_SECRET}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, hash }),
    })
  } catch {
    fail(503, '密码服务暂不可用，请稍后再试')
  }
  if (!response.ok) fail(503, '密码服务暂不可用，请稍后再试')
  return response.json<{ hash?: string; matches?: boolean }>().catch(() => fail(503, '密码服务响应异常'))
}

async function rateLimit(c: AppContext, category: string, email: string) {
  const ip = c.req.header('CF-Connecting-IP') ?? 'local'
  const period = Math.floor(Date.now() / 60_000)
  const keys = await Promise.all([ip, email].map(digest))
  const [, perIp, perAccount] = await c.env.DB.batch<{ hits: number }>([
    c.env.DB.prepare('DELETE FROM auth_limits WHERE period<?').bind(period - 1),
    ...keys.map((key, index) => c.env.DB.prepare(`INSERT INTO auth_limits (category,key,period,hits) VALUES (?,?,?,1)
      ON CONFLICT(category,key) DO UPDATE SET hits=CASE WHEN auth_limits.period=excluded.period THEN MIN(auth_limits.hits+1,100) ELSE 1 END,
      period=excluded.period RETURNING hits`).bind(`${category}:${index}`, key, period)),
  ])
  if (perIp.results[0].hits > (category === 'register' ? 5 : 12) || perAccount.results[0].hits > 5) fail(429, '操作频繁，请稍后再试')
}

function credentials(data: Record<string, unknown>) {
  const email = text(data.email, 254, true).toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail(400, '请输入有效邮箱')
  if (typeof data.password !== 'string' || !data.password || passwordBytes(data.password) > 512) fail(400, '请输入有效密码')
  return { email, password: data.password }
}

export const auth = new Hono<App>()

auth.post('/register', async c => {
  const data = await json(c)
  const { email, password } = credentials(data)
  const nickname = text(data.nickname, 50, true)
  const qq = data.qqId == null || data.qqId === '' ? null : qqId(data.qqId)
  if (password.length < 6 || passwordBytes(password) > 72) fail(400, '密码至少 6 个字符，最多 72 字节')
  await rateLimit(c, 'register', email)
  const { hash } = await passwordService(c, 'hash', password)
  if (!hash || !/^\$2[aby]\$10\$[./A-Za-z0-9]{53}$/.test(hash)) fail(503, '密码服务响应异常')
  const id = crypto.randomUUID()
  const now = Date.now()
  let user: User | null
  try {
    user = await c.env.DB.prepare(`INSERT INTO users (id,email,password_hash,nickname,qq_id,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?) RETURNING *`).bind(id, email, hash, nickname, qq, now, now).first<User>()
  } catch (error) {
    if (uniqueError(error)) fail(409, qq ? '邮箱已注册或 QQ 号码已绑定' : '邮箱已注册')
    throw error
  }
  if (!user) throw new Error('User insert returned no row')
  await issueSession(c, id)
  return c.json(account(user), 201)
})

auth.post('/login', async c => {
  const { email, password } = credentials(await json(c))
  await rateLimit(c, 'login', email)
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE email=?').bind(email).first<User & { password_hash: string }>()
  const { matches } = await passwordService(c, 'verify', password, user?.password_hash ?? dummyHash)
  if (!user || matches !== true || user.status !== 'active') fail(401, '邮箱或密码不正确，或账号不可用')
  await issueSession(c, user.id)
  return c.json(account(user))
})

function account(user: User) {
  return { ...publicUser(user), email: user.email, role: user.role, qqBound: Boolean(user.qq_id) }
}

auth.get('/me', c => c.json(account(signedIn(c))))

auth.post('/logout', async c => {
  const session = c.get('session')
  if (session) await c.env.DB.prepare('DELETE FROM sessions WHERE digest=?').bind(session).run()
  deleteCookie(c, name(c), cookieOptions(c))
  return c.body(null, 204)
})
