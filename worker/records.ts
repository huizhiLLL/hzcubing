import { Hono } from 'hono'
import type { App, AppContext, User } from './types'
import { fail, json, signedIn, text } from './http'

export interface RecordRow {
  id: string; user_id: string; nickname: string; event: string
  single_seconds: number | null; average_seconds: number | null; score: number | null
  cube: string | null; method: string | null; competition: string | null; solves: string | null
  timestamp: number; created_at: number; updated_at: number
  user_no?: number; avatar_key?: string | null; current_nickname?: string
}
export function recordDto(row: RecordRow) {
  return {
    id: row.id, userNo: row.user_no, nickname: row.current_nickname ?? row.nickname, event: row.event,
    singleSeconds: row.single_seconds, averageSeconds: row.average_seconds, score: row.score, cube: row.cube, method: row.method,
    competition: row.competition, solves: row.solves == null ? null : JSON.parse(row.solves), timestamp: row.timestamp,
    avatar: row.avatar_key ? `/media/${row.avatar_key}` : null,
  }
}

function seconds(value: unknown) {
  if (value == null || value === '' || ['DNF', 'DNS'].includes(String(value).toUpperCase())) return null
  if (typeof value !== 'number' && typeof value !== 'string') fail(400, '成绩格式不正确')
  const source = String(value).trim()
  const parts = source.split(':')
  if (parts.length > 3 || parts.some((part, index) => !(index === parts.length - 1 ? /^\d+(?:\.\d+)?$/ : /^\d+$/).test(part))) fail(400, '请输入秒数或分:秒')
  if (parts.length > 1 && parts.slice(1).some(part => Number(part) >= 60)) fail(400, '分和秒需要小于 60')
  const time = parts.reduce((total, part) => total * 60 + Number(part), 0)
  if (!Number.isFinite(time) || time > 3599999) fail(400, '成绩超出范围')
  return Math.trunc(time * 100 + 1e-9) / 100
}

async function validate(c: AppContext, data: Record<string, unknown>, previous?: RecordRow) {
  const event = text(data.event ?? previous?.event, 100, true)
  const selected = await c.env.DB.prepare('SELECT category,active FROM events WHERE code=?').bind(event).first<{ category: string; active: number }>()
  if (!selected || (event !== previous?.event && !selected.active)) fail(400, '请选择启用的项目')
  const isScore = selected.category === 'score'
  if (previous && event !== previous.event) {
    const old = await c.env.DB.prepare('SELECT category FROM events WHERE code=?').bind(previous.event).first<{ category: string }>()
    if ((old?.category === 'score') !== isScore) fail(400, '不能跨成绩类型更换项目')
  }
  if (isScore ? ['singleSeconds', 'averageSeconds', 'solves'].some(key => key in data) : 'score' in data) fail(400, '不能混用成绩类型')
  let score: number | null = previous?.score ?? null
  if (isScore && ('score' in data || !previous)) {
    const value = data.score
    if (typeof value !== 'number' && (typeof value !== 'string' || !/^[+-]?\d+(\.\d+)?$/.test(value.trim()))) fail(400, '请输入有效成绩')
    score = Number(typeof value === 'string' ? value.trim() : value)
    if (!Number.isFinite(score) || Math.abs(score) > Number.MAX_SAFE_INTEGER) fail(400, '成绩超出范围')
  }
  const single = isScore ? null : 'singleSeconds' in data ? seconds(data.singleSeconds) : previous?.single_seconds ?? null
  const average = isScore ? null : 'averageSeconds' in data ? seconds(data.averageSeconds) : previous?.average_seconds ?? null
  if (!isScore && single == null && average == null) fail(400, '至少填写一项有效成绩')
  const time = data.timestamp == null ? previous?.timestamp ?? Date.now() : Number(data.timestamp)
  if (!Number.isSafeInteger(time) || time < 0 || time > Date.now() + 60_000) fail(400, '录入日期不正确')
  const solves = data.solves
  if (solves != null && (!Array.isArray(solves) || solves.length > 12)) fail(400, '原始成绩列表不正确')
  return {
    event, single, average, score: isScore ? score : null, timestamp: time,
    cube: 'cube' in data ? text(data.cube, 100) || null : previous?.cube ?? null,
    method: 'method' in data ? text(data.method, 100) || null : previous?.method ?? null,
    competition: 'competition' in data ? text(data.competition, 100) || null : previous?.competition ?? null,
    solves: isScore ? null : Array.isArray(solves) ? JSON.stringify(solves.map(seconds)) : previous?.solves ?? null,
  }
}

export const recordSelect = `SELECT r.*, u.user_no, u.nickname AS current_nickname, u.avatar_key
  FROM records r JOIN users u ON u.id=r.user_id`

export async function addRecord(c: AppContext, user: User, data: Record<string, unknown>) {
  const item = await validate(c, data)
  const db = c.env.DB
  const id = crypto.randomUUID()
  const now = Date.now()
  const best = (field: 'single_seconds' | 'average_seconds' | 'score') => db.prepare(`${recordSelect}
    WHERE r.event=? AND r.${field} IS NOT NULL ORDER BY r.${field} ${field === 'score' ? 'DESC' : 'ASC'}, r.timestamp, r.id LIMIT 1`).bind(item.event)
  const [single, average, score, inserted] = await db.batch<RecordRow>([
    best('single_seconds'), best('average_seconds'), best('score'),
    db.prepare(`INSERT INTO records (id,user_id,nickname,event,single_seconds,average_seconds,score,cube,method,competition,solves,timestamp,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?) RETURNING *`).bind(id, user.id, user.nickname, item.event, item.single, item.average, item.score, item.cube, item.method, item.competition, item.solves, item.timestamp, now, now),
  ])
  const previousSingle = single.results[0]
  const previousAverage = average.results[0]
  return {
    ...recordDto({ ...inserted.results[0], user_no: user.user_no, avatar_key: user.avatar_key }),
    isScoreGR: item.score !== null && (!score.results[0] || item.score > score.results[0].score!),
    previousScoreBest: score.results[0] ? recordDto(score.results[0]) : null,
    isSingleGR: item.single !== null && (!previousSingle || item.single < previousSingle.single_seconds!),
    isAverageGR: item.average !== null && (!previousAverage || item.average < previousAverage.average_seconds!),
    previousSingleBest: previousSingle ? recordDto(previousSingle) : null,
    previousAverageBest: previousAverage ? recordDto(previousAverage) : null,
  }
}

export const records = new Hono<App>()
records.get('/leaderboard', async c => {
  const event = text(c.req.query('event'), 100, true)
  const search = text(c.req.query('q'), 50)
  const isScore = (await c.env.DB.prepare('SELECT category FROM events WHERE code=?').bind(event).first<{ category: string }>())?.category === 'score'
  const metric = isScore ? 'score' : c.req.query('type') === 'average' ? 'average_seconds' : 'single_seconds'
  const direction = isScore ? 'DESC' : 'ASC'
  const limit = Math.trunc(Math.max(1, Math.min(200, Number(c.req.query('limit')) || 100)))
  const { results } = await c.env.DB.prepare(`WITH chosen AS (
    SELECT r.*, ROW_NUMBER() OVER (PARTITION BY r.user_id ORDER BY r.${metric} ${direction}, r.timestamp DESC, r.id) AS position
    FROM records r WHERE event=? AND r.${metric} IS NOT NULL
  ), ranked AS (
    SELECT chosen.*, u.user_no, u.nickname AS current_nickname, u.avatar_key,
      ${isScore ? 'RANK() OVER (ORDER BY chosen.score DESC)' : 'ROW_NUMBER() OVER (ORDER BY chosen.' + metric + ', chosen.timestamp DESC, chosen.id)'} AS rank
    FROM chosen JOIN users u ON u.id=chosen.user_id WHERE position=1
  ) SELECT * FROM ranked WHERE instr(lower(current_nickname), lower(?))>0 ORDER BY rank, timestamp DESC, id LIMIT ?`).bind(event, search, limit).all<RecordRow & { rank: number }>()
  return c.json(results.map(row => ({ ...recordDto(row), rank: row.rank })))
})

records.get('/best', async c => {
  const event = text(c.req.query('event'), 100)
  const { results } = await c.env.DB.prepare(`WITH metrics AS (
    SELECT event, user_id, timestamp, id, 'score' AS metric, score AS seconds FROM records WHERE score IS NOT NULL AND (?='' OR event=?)
    UNION ALL
    SELECT event, user_id, timestamp, id, 'single' AS metric, single_seconds AS seconds
      FROM records WHERE single_seconds IS NOT NULL AND (?='' OR event=?)
    UNION ALL
    SELECT event, user_id, timestamp, id, 'average', average_seconds
      FROM records WHERE average_seconds IS NOT NULL AND (?='' OR event=?)
  ), ranked AS (
    SELECT *, ROW_NUMBER() OVER (PARTITION BY event,metric ORDER BY CASE WHEN metric='score' THEN -seconds ELSE seconds END,timestamp,id) AS position FROM metrics
  ) SELECT ranked.event, ranked.timestamp, ranked.metric, ranked.seconds, u.nickname, u.user_no
    FROM ranked JOIN users u ON u.id=ranked.user_id WHERE position=1 ORDER BY ranked.event`).bind(event, event, event, event, event, event)
    .all<{ event: string; timestamp: number; metric: 'single' | 'average' | 'score'; seconds: number; nickname: string; user_no: number }>()
  type Holder = { seconds: number; nickname: string; userNo: number; timestamp: number }
  const best = new Map<string, { event: string; single: Holder | null; average: Holder | null; score: { value: number; nickname: string; userNo: number; timestamp: number } | null }>()
  for (const row of results) {
    const result = best.get(row.event) ?? { event: row.event, single: null, average: null, score: null }
    if (row.metric === 'score') result.score = { value: row.seconds, nickname: row.nickname, userNo: row.user_no, timestamp: row.timestamp }
    else result[row.metric] = { seconds: row.seconds, nickname: row.nickname, userNo: row.user_no, timestamp: row.timestamp }
    best.set(row.event, result)
  }
  return c.json([...best.values()])
})

records.get('/gr', async c => {
  const event = text(c.req.query('event'), 100, true)
  // Analytic windows keep record-history scanning inside D1 rather than in the Worker.
  const { results } = await c.env.DB.prepare(`WITH history AS (
    SELECT r.*, MAX(r.score) OVER preceding AS prior_score, MIN(r.single_seconds) OVER preceding AS prior_single, MIN(r.average_seconds) OVER preceding AS prior_average,
      u.user_no, u.nickname AS current_nickname, u.avatar_key
    FROM records r JOIN users u ON u.id=r.user_id WHERE r.event=?
    WINDOW preceding AS (ORDER BY r.timestamp, r.id ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING)
  ) SELECT *, score IS NOT NULL AND (prior_score IS NULL OR score>prior_score) AS score_gr, single_seconds IS NOT NULL AND (prior_single IS NULL OR single_seconds<prior_single) AS single_gr,
    average_seconds IS NOT NULL AND (prior_average IS NULL OR average_seconds<prior_average) AS average_gr
    FROM history WHERE single_gr OR average_gr OR score_gr ORDER BY timestamp DESC, id DESC`).bind(event).all<RecordRow & { single_gr: number; average_gr: number; score_gr: number }>()
  return c.json({ score: results.filter(row => row.score_gr).map(recordDto), single: results.filter(row => row.single_gr).map(recordDto), average: results.filter(row => row.average_gr).map(recordDto) })
})

records.post('/', async c => {
  const result = await addRecord(c, signedIn(c), await json(c))
  const { ASTRBOT_MESSAGE_URL: endpoint, ASTRBOT_API_KEY: token, ASTRBOT_MESSAGE_UMO: umo } = c.env
  if (endpoint && token && umo && (result.isSingleGR || result.isAverageGR || result.isScoreGR)) {
    const detail = [result.isScoreGR ? `成绩 ${result.score}` : '', result.isSingleGR ? `单次 ${result.singleSeconds}` : '', result.isAverageGR ? `平均 ${result.averageSeconds}` : ''].filter(Boolean).join('，')
    const message = `${result.nickname} 刷新 ${result.event} 群纪录：${detail}`
    c.executionCtx.waitUntil(fetch(endpoint, { method: 'POST', redirect: 'manual', signal: AbortSignal.timeout(3000),
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ umo, message }),
    }).then(response => { if (!response.ok) console.warn('AstrBot notification rejected') }).catch(() => console.warn('AstrBot notification unavailable')))
  }
  return c.json(result, 201)
})

records.get('/:id', async c => {
  const record = await c.env.DB.prepare(`${recordSelect} WHERE r.id=?`).bind(c.req.param('id')).first<RecordRow>()
  if (!record) fail(404, '找不到该成绩')
  return c.json(recordDto(record))
})
async function ownedRecord(c: AppContext, id: string) {
  const user = signedIn(c)
  const previous = await c.env.DB.prepare('SELECT * FROM records WHERE id=? AND user_id=?').bind(id, user.id).first<RecordRow>()
  if (!previous) fail(404, '找不到该成绩')
  return previous
}
records.patch('/:id', async c => {
  const previous = await ownedRecord(c, c.req.param('id'))
  const item = await validate(c, await json(c), previous)
  const row = await c.env.DB.prepare(`UPDATE records SET event=?,single_seconds=?,average_seconds=?,score=?,cube=?,method=?,
    competition=?,solves=?,timestamp=?,updated_at=? WHERE id=? AND user_id=? RETURNING *`).bind(item.event, item.single, item.average, item.score, item.cube, item.method, item.competition, item.solves, item.timestamp, Date.now(), previous.id, previous.user_id).first<RecordRow>()
  if (!row) fail(404, '找不到该成绩')
  return c.json(recordDto(row))
})
records.delete('/:id', async c => {
  const previous = await ownedRecord(c, c.req.param('id'))
  await c.env.DB.prepare('DELETE FROM records WHERE id=? AND user_id=?').bind(previous.id, previous.user_id).run()
  return c.body(null, 204)
})
