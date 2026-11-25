import { readFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import assert from 'node:assert/strict'
import test from 'node:test'
import { convert, importSql, manifest, verify } from './data.mjs'

const date = new Date('2026-06-11T05:06:07.890Z')
const pwd = '$2a$10$' + 'e'.repeat(53)
const stamps = { createdAt: date, updatedAt: date }

test('retains account identifiers, raw decimals, historical events and the source counter', () => {
  const data = convert({
    users: [{ _id: 'user-a', userNo: 5, email: 'test@example.com', nickname: "U'昵称", password: pwd, qqId: '12345', ...stamps }],
    records: [{ _id: 'record-a', userId: 'user-a', event: '历史编码A', nickname: '旧昵称', singleSeconds: 3.1415, timestamp: date, ...stamps }],
    events: [], counter: { seq: 8 },
  })
  const db = new DatabaseSync(':memory:')
  db.exec(readFileSync('migrations/0001_initial.sql', 'utf8').replace(/^\uFEFF/, ''))
  db.exec(readFileSync('migrations/0002_events.sql', 'utf8'))
  db.exec(importSql(data))
  verify(db, '.', manifest(data))
  assert.equal(data.historicalPrecision, 1)
  assert.equal(db.prepare('SELECT single_seconds FROM records').get().single_seconds, 3.1415)
  assert.equal(db.prepare('SELECT nickname FROM users').get().nickname, "U'昵称")
  const next = db.prepare('INSERT INTO users (id, email, nickname, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, 0, 0)').run('b', 'b@test.example', 'B', pwd)
  assert.equal(next.lastInsertRowid, 9)
})

test('separates an embedded avatar and assigns a deterministic content key', () => {
  const avatar = 'data:image/png;base64,YQ=='
  const source = { users: [{ _id: 'u', userNo: 1, email: 'a@test.example', nickname: 'A', avatar, password: pwd, ...stamps }], records: [], events: [] }
  const a = manifest(convert(source))
  assert.equal(a.avatars.length, 1)
  assert.match(a.avatars[0].key, /^avatars\/u\/[a-f0-9]{64}\.png$/)
  assert.deepEqual(a, manifest(convert(source)))
})

