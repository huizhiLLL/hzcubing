import { Hono } from 'hono'
import type { App } from './types'
import { digest, fail, json, publicUser, signedIn, text, uniqueError } from './http'
import { recordDto, recordSelect, type RecordRow } from './records'
import type { User } from './types'

export const players = new Hono<App>()
players.get('/', async c => {
  const search = text(c.req.query('q'), 50)
  const page = Math.max(1, Math.min(1000, Number(c.req.query('page')) || 1)) | 0
  const { results } = await c.env.DB.prepare(`SELECT * FROM users WHERE status='active'
    AND (instr(lower(nickname),lower(?))>0 OR instr(lower(wca_id),lower(?))>0)
    ORDER BY user_no LIMIT 31 OFFSET ?`).bind(search, search, (page - 1) * 30).all<User>()
  return c.json({ users: results.slice(0, 30).map(publicUser), more: results.length > 30 })
})
players.get('/:userNo', async c => {
  const userNo = Number(c.req.param('userNo'))
  if (!Number.isSafeInteger(userNo) || userNo < 1) fail(404, '找不到该选手')
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE user_no=?').bind(userNo).first<User>()
  if (!user) fail(404, '找不到该选手')
  const page = Math.max(1, Math.min(1000, Number(c.req.query('page')) || 1)) | 0
  const [history, best] = await c.env.DB.batch<RecordRow>([
    c.env.DB.prepare(`${recordSelect} WHERE r.user_id=? ORDER BY r.timestamp DESC,r.id LIMIT 31 OFFSET ?`).bind(user.id, (page - 1) * 30),
    c.env.DB.prepare(`SELECT event, MIN(single_seconds) AS single_seconds, MIN(average_seconds) AS average_seconds
      FROM records WHERE user_id=? GROUP BY event ORDER BY event`).bind(user.id),
  ])
  return c.json({ user: publicUser(user), records: history.results.slice(0, 30).map(recordDto), more: history.results.length > 30,
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
