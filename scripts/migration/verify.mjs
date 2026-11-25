import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { verify } from './data.mjs'

const [output, sqlExport, downloads] = process.argv.slice(2)
if (!output) throw new Error('Usage: node scripts/migration/verify.mjs <converted directory> [D1 SQL export] [downloaded avatar root]')
const read = path => readFileSync(path, 'utf8').replace(/^\uFEFF/, '')
const db = new DatabaseSync(':memory:')
if (sqlExport) db.exec(read(sqlExport))
else {
  db.exec(read('migrations/0001_initial.sql'))
  db.exec(read('migrations/0002_events.sql'))
  db.exec(read(join(output, 'data.sql')))
}
verify(db, downloads ?? output, JSON.parse(read(join(output, 'manifest.json'))))
console.log('D1 rows, user sequence, record references and avatar checksums verified.')
