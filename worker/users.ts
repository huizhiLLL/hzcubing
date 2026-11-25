import { Hono } from 'hono'
import type { App } from './types'
import { digest, fail, json, publicUser, signedIn, text, uniqueError } from './http'
import { recordDto, recordSelect, type RecordRow } from './records'
import type { User } from './types'

export const players = new Hono<App>()
players.get('/', async c => {
  const search = text(c.req.query('q'), 50)
  const page = Math.max(1, Math.min(1000, Number(c.req.query('page')) || 1)) | 0
  const sort = c.req.query('sort')
  const order = sort === 'mostRecords' ? 'record_count DESC,' : sort === 'mostEvents' ? 'event_count DESC,' : ''
  const { results } = await c.env.DB.prepare(`SELECT u.*, COUNT(r.id) AS record_count, COUNT(DISTINCT r.event) AS event_count,
      json_group_array(DISTINCT r.event) FILTER (WHERE r.event IS NOT NULL) AS event_codes
    FROM users u LEFT JOIN records r ON r.user_id=u.id WHERE u.status='active'
    AND (instr(lower(u.nickname),lower(?))>0 OR instr(lower(u.wca_id),lower(?))>0)
    GROUP BY u.id ORDER BY ${order} u.created_at DESC,u.user_no DESC LIMIT 31 OFFSET ?`)
    .bind(search, search, (page - 1) * 30).all<User & { created_at: number; record_count: number; event_count: number; event_codes: string }>()
  return c.json({ users: results.slice(0, 30).map(user => ({
    ...publicUser(user), createdAt: user.created_at, recordCount: user.record_count, eventCount: user.event_count, events: JSON.parse(user.event_codes) as string[],
  })), more: results.length > 30 })
})
players.get('/:userNo', async c => {
  const userNo = Number(c.req.param('userNo'))
  if (!Number.isSafeInteger(userNo) || userNo < 1) fail(404, '找不到该选手')
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE user_no=?').bind(userNo).first<User & { created_at: number }>()
  if (!user) fail(404, '找不到该选手')
  const page = Math.max(1, Math.min(1000, Number(c.req.query('page')) || 1)) | 0
  const category = text(c.req.query('category'), 20)
  const projects = c.env.DB.prepare(`SELECT code,name,active FROM events WHERE category='meme' AND created_by=? ORDER BY created_at DESC,code`)
  const [createdProjects, [history, best]] = await Promise.all([
    projects.bind(user.id).all<{ code: string; name: string; active: number }>(),
    c.env.DB.batch<RecordRow>([
      c.env.DB.prepare(`${recordSelect} WHERE r.user_id=? AND (?='' OR r.event IN (SELECT code FROM events WHERE category=?))
        ORDER BY r.timestamp DESC,r.id LIMIT 31 OFFSET ?`).bind(user.id, category, category, (page - 1) * 30),
      c.env.DB.prepare(`SELECT event, MIN(single_seconds) AS single_seconds, MIN(average_seconds) AS average_seconds
        FROM records WHERE user_id=? GROUP BY event ORDER BY event`).bind(user.id),
    ]),
  ])
  return c.json({ user: { ...publicUser(user), createdAt: user.created_at },
    createdProjects: createdProjects.results.map(row => ({ code: row.code, name: row.name, active: Boolean(row.active) })),
    records: history.results.slice(0, 30).map(recordDto), more: history.results.length > 30,
    best: best.results.map(row => ({ event: row.event, singleSeconds: row.single_seconds, averageSeconds: row.average_seconds })) })
})

export const profile = new Hono<App>()
profile.patch('/', async c => {
  const user = signedIn(c)
  const data = await json(c)
  const nickname = text(data.nickname ?? user.nickname, 50, true)
  const bio = text(data.bio ?? user.bio, 500)
  const wcaId = text(data.wcaId ?? user.wca_id, 20).toUpperCase()
  if (wcaId && !/^\d{4}[A-Z]{4}\d{2}$/.test(wcaId)) fail(400, 'WCA ID 格式不正确')
  const updated = await c.env.DB.prepare('UPDATE users SET nickname=?,bio=?,wca_id=?,updated_at=? WHERE id=? RETURNING *')
    .bind(nickname, bio, wcaId, Date.now(), user.id).first<User>()
  return c.json(publicUser(updated!))
})

export function qqId(value: unknown) {
  const id = text(value, 15, true)
  if (!/^\d{5,15}$/.test(id)) fail(400, 'QQ 号码格式不正确')
  return id
}
export async function bindQQ(db: D1Database, user: User, value: string) {
  try {
    const result = await db.prepare('UPDATE users SET qq_id=?,updated_at=? WHERE id=? AND (qq_id IS NULL OR qq_id=?)')
      .bind(value, Date.now(), user.id, value).run()
    if (!result.meta.changes) fail(409, '此账号已绑定 QQ')
  } catch (error) {
    if (uniqueError(error)) fail(409, '该 QQ 已绑定其他账号')
    throw error
  }
}
profile.post('/qq', async c => {
  const user = signedIn(c)
  const id = qqId((await json(c)).qqId)
  await bindQQ(c.env.DB, user, id)
  return c.json({ qqBound: true })
})

profile.delete('/avatar', async c => {
  const user = signedIn(c)
  await c.env.DB.prepare('UPDATE users SET avatar_key=NULL,updated_at=? WHERE id=?').bind(Date.now(), user.id).run()
  return c.body(null, 204)
})

const signatures = [
  { ext: 'png', type: 'image/png', match: (b: Uint8Array) => [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => b[i] === v) },
  { ext: 'jpg', type: 'image/jpeg', match: (b: Uint8Array) => b[0] === 255 && b[1] === 216 && b[2] === 255 },
  { ext: 'gif', type: 'image/gif', match: (b: Uint8Array) => ['GIF87a', 'GIF89a'].includes(new TextDecoder().decode(b.slice(0, 6))) },
  { ext: 'webp', type: 'image/webp', match: (b: Uint8Array) => new TextDecoder().decode(b.slice(0, 4)) === 'RIFF' && new TextDecoder().decode(b.slice(8, 12)) === 'WEBP' },
  { ext: 'avif', type: 'image/avif', match: (b: Uint8Array) => new TextDecoder().decode(b.slice(4, 12)) === 'ftypavif' },
]
profile.put('/avatar', async c => {
  const user = signedIn(c)
  const max = 2_000_000
  if (Number(c.req.header('Content-Length')) > max || !c.req.raw.body) fail(413, '头像大小上限为 2 MB')
  const reader = c.req.raw.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > max) { await reader.cancel(); fail(413, '头像大小上限为 2 MB') }
    chunks.push(value)
  }
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength }
  const image = signatures.find(candidate => candidate.match(bytes))
  if (!image) fail(400, '请选择 PNG、JPEG、GIF、WebP 或 AVIF 图片')
  const key = `avatars/${user.id}/${await digest(bytes)}.${image.ext}`
  await c.env.AVATARS.put(key, bytes, { httpMetadata: { contentType: image.type } })
  await c.env.DB.prepare('UPDATE users SET avatar_key=?,updated_at=? WHERE id=?').bind(key, Date.now(), user.id).run()
  return c.json({ avatar: `/media/${key}` })
})
