import { resolve } from 'node:path'
import { convert, readBson, writeConversion } from './data.mjs'

const [source, target] = process.argv.slice(2)
if (!source || !target) throw new Error('Usage: node scripts/migration/convert.mjs <BSON database directory> <new private output directory>')
const output = resolve(target)
const data = convert({
  users: readBson(source, 'users'),
  events: readBson(source, 'meme_events'),
  records: readBson(source, 'records'),
  counter: readBson(source, 'counters').find(counter => counter._id === 'userNo'),
})
const summary = writeConversion(output, data)
console.log(JSON.stringify({ tables: Object.fromEntries(Object.entries(summary.tables).map(([name, { count }]) => [name, count])), avatars: summary.avatars.length, historicalPrecision: summary.historicalPrecision }))
