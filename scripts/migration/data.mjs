import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { deserialize } from 'bson'
import { STATIC_EVENTS } from '../../src/config/events.js'

export const sha256 = content => createHash('sha256').update(content).digest('hex')
export const imageTypes = {
  png: 'image/png', jpg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', avif: 'image/avif',
}

export function readBson(directory, collection) {
  return decodeBson(readFileSync(join(directory, `${collection}.bson`)), collection)
}

export function decodeBson(file, collection) {
  const documents = []
  for (let offset = 0; offset < file.length;) {
    const size = file.readInt32LE(offset)
    if (size < 5 || offset + size > file.length) throw new Error(`Malformed ${collection}.bson`)
    documents.push(deserialize(file.subarray(offset, offset + size)))
    offset += size
  }
  return documents
}

const tableColumns = {
  users: ['user_no', 'id', 'email', 'password_hash', 'nickname', 'bio', 'wca_id', 'avatar_key', 'qq_id', 'role', 'status', 'created_at', 'updated_at'],
  events: ['code', 'id', 'name', 'category', 'description', 'icon_id', 'active', 'created_by', 'created_by_name', 'created_at', 'updated_at'],
  records: ['id', 'user_id', 'nickname', 'event', 'single_seconds', 'average_seconds', 'cube', 'method', 'competition', 'solves', 'timestamp', 'created_at', 'updated_at'],
}
export const columns = table => tableColumns[table]
const stringId = value => {
  if (typeof value === 'string' && value.length) return value
  if (value?.toHexString) return value.toHexString()
  throw new Error('Missing or invalid source ID')
}
const millis = value => {
  const isoUtc = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
  const isCanonical = typeof value === 'string' && isoUtc.test(value)
  const date = isCanonical ? new Date(value) : value
  if (!(date instanceof Date) || !Number.isFinite(date.getTime()) || (isCanonical && date.toISOString() !== value)) {
    throw new Error('Invalid source date')
  }
  return date.getTime()
}
const number = value => {
  if (value == null) return null
  if (!Number.isFinite(value)) throw new Error('Invalid source number')
  return value
}

function avatarObject(value) {
  const match = /^data:(image\/(?:png|jpeg|gif|webp|avif));base64,([A-Za-z0-9+/]+={0,2})$/.exec(value)
  if (!match) throw new Error('Unsupported source avatar format')
  const [, contentType, encoded] = match
  const bytes = Buffer.from(encoded, 'base64')
  if (bytes.toString('base64').replace(/=+$/, '') !== encoded.replace(/=+$/, '')) {
    throw new Error('Malformed source avatar')
  }
  const extension = Object.keys(imageTypes).find(key => imageTypes[key] === contentType)
  return { bytes, digest: sha256(bytes), extension, contentType }
}

export function convert({ users, events, records, counter }) {
  const avatars = new Map()
  const tables = { users: [], events: [], records: [] }
  const eventMap = new Map(STATIC_EVENTS.map(e => [e.id, [e.id, null, e.name, e.category, '', e.iconId ?? null, 1, null, null, null, null]]))
  for (const event of events) {
    if (eventMap.has(event.eventCode)) throw new Error('Duplicate event code in source catalog')
    eventMap.set(event.eventCode, [event.eventCode, stringId(event._id), event.eventName, 'meme', event.description ?? '', null, Number(event.isActive !== false), event.createdBy ?? null, event.createdByName ?? null, millis(event.createdAt), millis(event.updatedAt)])
  }
  for (const user of users) {
    const id = stringId(user._id)
    if (!/^\$2[aby]\$10\$[./A-Za-z0-9]{53}$/.test(user.password)) throw new Error('Unsupported source password hash')
    if (!Number.isSafeInteger(user.userNo) || user.userNo < 1) throw new Error('Invalid source user number')
    let key = null
    if (user.avatar) {
      const avatar = avatarObject(user.avatar)
      key = `avatars/${id}/${avatar.digest}.${avatar.extension}`
      avatars.set(key, avatar)
    }
    tables.users.push([user.userNo, id, user.email, user.password, user.nickname, user.bio ?? '', user.wcaId ?? '', key, user.qqId || null, user.role ?? 'user', user.status ?? 'active', millis(user.createdAt), millis(user.updatedAt)])
  }
  let historicalPrecision = 0
  for (const record of records) {
    if (!eventMap.has(record.event)) {
      eventMap.set(record.event, [record.event, null, record.event, 'historical', '', null, 0, null, null, null, null])
    }
    const single = number(record.singleSeconds)
    const average = number(record.averageSeconds)
    if ([single, average].some(value => value !== null && Math.abs(value * 100 - Math.round(value * 100)) > 1e-7)) historicalPrecision++
    tables.records.push([stringId(record._id), stringId(record.userId), record.nickname, record.event, single, average, record.cube ?? null, record.method ?? null, record.competition ?? null, record.solves == null ? null : JSON.stringify(record.solves), millis(record.timestamp), millis(record.createdAt), millis(record.updatedAt)])
  }
  tables.events = [...eventMap.values()]
  return {
    tables, avatars, historicalPrecision,
    sequence: tables.users.reduce((max, [userNo]) => Math.max(max, userNo), counter?.seq ?? 0),
  }
}

function sqlValue(value) {
  if (value === null) return 'NULL'
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  if (typeof value === 'string') return `CAST(X'${Buffer.from(value).toString('hex')}' AS TEXT)`
  throw new Error('Invalid SQL import value')
}

export function importSql({ tables, sequence }) {
  if (!Number.isSafeInteger(sequence) || sequence < 0) throw new Error('Invalid user sequence')
  const statements = []
  for (const [table, rows] of Object.entries(tables)) {
    for (const row of rows) {
      const update = table === 'events'
        ? ` ON CONFLICT(code) DO UPDATE SET ${columns(table).slice(1).map(col => `${col}=excluded.${col}`).join(', ')}`
        : ''
      statements.push(`INSERT INTO ${table} (${columns(table).join(', ')}) VALUES (${row.map(sqlValue).join(', ')})${update};`)
    }
  }
  statements.push(`UPDATE sqlite_sequence SET seq = MAX(seq, ${sequence}) WHERE name = 'users';`)
  return statements.join('\n') + '\n'
}

export const digestRows = rows => sha256(JSON.stringify(rows.map(row => JSON.stringify(row)).sort()))

export function manifest({ tables, avatars, historicalPrecision, sequence }) {
  return {
    tables: Object.fromEntries(Object.entries(tables).map(([name, rows]) => [name, { count: rows.length, digest: digestRows(rows) }])),
    avatars: [...avatars].map(([key, image]) => ({ key, sha256: image.digest, bytes: image.bytes.length, mime: image.contentType })),
    historicalPrecision,
    sequence,
  }
}

export function verify(database, output, expected, loadAvatar = key => readFileSync(join(output, key))) {
  for (const [table, { count, digest }] of Object.entries(expected.tables)) {
    const rows = database.prepare(`SELECT ${columns(table).join(', ')} FROM ${table}`).all()
    if (rows.length !== count || digestRows(rows.map(row => Object.values(row))) !== digest) throw new Error(`Data mismatch: ${table}`)
  }
  if (database.prepare('PRAGMA foreign_key_check').all().length) throw new Error('Broken record reference')
  const sequence = database.prepare("SELECT seq FROM sqlite_sequence WHERE name = 'users'").get()?.seq ?? 0
  if (sequence !== expected.sequence) throw new Error('User sequence mismatch')
  for (const image of expected.avatars) {
    const bytes = loadAvatar(image.key)
    if (bytes.length !== image.bytes || sha256(bytes) !== image.sha256) throw new Error('Avatar checksum mismatch')
  }
}
