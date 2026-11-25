import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { convert, importSql, manifest, readBson } from './data.mjs'

const [source, target] = process.argv.slice(2)
if (!source || !target) throw new Error('Usage: node scripts/migration/convert.mjs <BSON database directory> <new private output directory>')
const output = resolve(target)
const data = convert({
  users: readBson(source, 'users'),
  events: readBson(source, 'meme_events'),
  records: readBson(source, 'records'),
  counter: readBson(source, 'counters').find(counter => counter._id === 'userNo'),
})
mkdirSync(output, { mode: 0o700 })
for (const [key, { bytes }] of data.avatars) {
  const file = join(output, key)
  mkdirSync(dirname(file), { recursive: true, mode: 0o700 })
  writeFileSync(file, bytes, { mode: 0o600 })
}
const summary = manifest(data)
writeFileSync(join(output, 'data.sql'), importSql(data), { mode: 0o600 })
writeFileSync(join(output, 'manifest.json'), JSON.stringify(summary, null, 2) + '\n', { mode: 0o600 })
console.log(JSON.stringify({ tables: Object.fromEntries(Object.entries(summary.tables).map(([name, { count }]) => [name, count])), avatars: summary.avatars.length, historicalPrecision: summary.historicalPrecision }))
