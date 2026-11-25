import { spawnSync } from 'node:child_process'
import { EJSON } from 'bson'
import { resolve } from 'node:path'
import { convert, writeConversion } from './data.mjs'

const [host, target] = process.argv.slice(2)
if (!/^[\w.-]+@[\w.-]+$/.test(host ?? '') || !target) {
  throw new Error('Usage: node scripts/migration/preview-snapshot.mjs <SSH user@host> <new output directory>')
}

// Read the legacy public profiles and records without retrieving private authentication fields.
const projection = `
const d = db.getSiblingDB('hzcubing');
print(EJSON.stringify({
  users: d.users.find({}, { userNo: 1, nickname: 1, bio: 1, wcaId: 1, avatar: 1, status: 1, createdAt: 1, updatedAt: 1 }).toArray(),
  events: d.meme_events.find({}, { eventCode: 1, eventName: 1, description: 1, isActive: 1, createdAt: 1, updatedAt: 1 }).toArray(),
  records: d.records.find({}, { userId: 1, nickname: 1, event: 1, singleSeconds: 1, averageSeconds: 1, cube: 1, method: 1, competition: 1, solves: 1, timestamp: 1, createdAt: 1, updatedAt: 1 }).toArray(),
  counter: d.counters.findOne({ _id: 'userNo' })
}));
`.trim()
const quote = value => `'${value.replaceAll("'", `'\\''`)}'`
const dump = spawnSync('ssh', ['-o', 'BatchMode=yes', '-o', 'ConnectTimeout=8', '-o', 'StrictHostKeyChecking=yes', host,
  `docker exec hzcubing-mongo mongosh --quiet hzcubing --eval ${quote(projection)}`],
  { maxBuffer: 20 * 1024 * 1024, timeout: 45_000, windowsHide: true, encoding: 'utf8' })
if (dump.status !== 0) throw new Error('Could not read public preview data from VPS2')
const source = EJSON.parse(dump.stdout.trim())
for (const user of source.users) {
  user.email = `preview-${user.userNo}@example.invalid`
  user.password = '$2a$10$' + 'e'.repeat(53)
}
const summary = writeConversion(resolve(target), convert(source))
console.log(JSON.stringify({ counts: Object.fromEntries(Object.entries(summary.tables).map(([table, { count }]) => [table, count])), avatars: summary.avatars.length }))
