import { Hono } from 'hono'
import { admin, fail, json, text, uniqueError } from './http'
import type { App, AppContext, User } from './types'

interface Event {
  code: string; name: string; category: string; description: string; icon_id: string | null; active: number
}

function eventDto(row: Event) {
  return { code: row.code, name: row.name, category: row.category, description: row.description, iconId: row.icon_id, active: Boolean(row.active) }
}

export async function saveEvent(c: AppContext, user: User, input: Record<string, unknown>, previous?: string) {
  const code = previous ?? text(input.code, 60, true)
  const name = text(input.name, 80, true)
  const description = text(input.description, 500)
  const active = input.active !== false ? 1 : 0
  const existing = previous ? await c.env.DB.prepare("SELECT category FROM events WHERE code=? AND category IN ('meme','score')").bind(code).first<{ category: string }>() : null
  if (previous && !existing) fail(404, '找不到该项目')
  const category = input.category ?? existing?.category ?? 'meme'
  if ((category !== 'meme' && category !== 'score') || (existing && category !== existing.category)) fail(400, '项目分类不正确')
  const now = Date.now()
  const query = previous ? c.env.DB.prepare(`UPDATE events SET name=?,description=?,active=?,updated_at=?
    WHERE code=? AND category IN ('meme','score') RETURNING *`).bind(name, description, active, now, code)
    : c.env.DB.prepare(`INSERT INTO events (code,id,name,category,description,active,created_by,created_by_name,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?) RETURNING *`).bind(code, crypto.randomUUID(), name, category, description, active, user.id, user.nickname, now, now)
  try {
    const event = await query.first<Event>()
    if (!event) fail(404, '找不到该整活项目')
    return eventDto(event)
  } catch (error) {
    if (uniqueError(error)) fail(409, '项目编码已存在')
    throw error
  }
}

export const events = new Hono<App>()
events.get('/', async c => {
  const { results } = await c.env.DB.prepare("SELECT * FROM events ORDER BY CASE category WHEN 'official' THEN 0 WHEN 'fun' THEN 1 WHEN 'meme' THEN 2 WHEN 'score' THEN 3 ELSE 4 END, rowid").all<Event>()
  return c.json(results.map(eventDto))
})
events.post('/', async c => c.json(await saveEvent(c, admin(c), await json(c)), 201))
events.patch('/:code', async c => c.json(await saveEvent(c, admin(c), await json(c), c.req.param('code'))))
