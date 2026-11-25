import { spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { sha256, verify } from './data.mjs'

const [action, configFile, sourceDirectory] = process.argv.slice(2)
if (!['import', 'verify'].includes(action) || !configFile || !sourceDirectory) {
  throw new Error('Usage: node scripts/migration/cloud-copy.mjs <import|verify> <explicit Wrangler JSON config> <converted directory>')
}
const config = JSON.parse(readFileSync(configFile, 'utf8').replace(/^\uFEFF/, ''))
const database = config.d1_databases?.find(item => item.binding === 'DB')
const bucket = config.r2_buckets?.find(item => item.binding === 'AVATARS')?.bucket_name
if (!database?.database_id || /^0{8}-/.test(database.database_id) || !bucket) {
  throw new Error('Explicit remote DB and AVATARS bindings required')
}

const source = realpathSync(resolve(sourceDirectory))
const expected = JSON.parse(readFileSync(join(source, 'manifest.json'), 'utf8'))
for (const { key, sha256: digest, bytes } of expected.avatars) {
  if (!/^avatars\/[a-f0-9-]{24,36}\/[a-f0-9]{64}\.(png|jpg|gif|webp|avif)$/.test(key)) throw new Error('Invalid avatar path in manifest')
  const content = readFileSync(join(source, key))
  if (content.length !== bytes || sha256(content) !== digest) throw new Error('Invalid source avatar checksum')
}

const wrangler = resolve('node_modules/wrangler/bin/wrangler.js')
function remote(...args) {
  const result = spawnSync(process.execPath, [wrangler, ...args, '--remote', '-c', resolve(configFile)], {
    windowsHide: true, encoding: 'utf8', timeout: 180_000, maxBuffer: 4 * 1024 * 1024,
    env: { ...process.env, CI: '1', WRANGLER_SEND_METRICS: 'false' },
  })
  // Wrangler can print signed export URLs. Keep its raw output out of the console.
  if (result.status !== 0) throw new Error(`Wrangler ${args.slice(0, 3).join(' ')} failed (${result.status ?? result.error?.code})`)
  return result.stdout
}

if (action === 'import') {
  remote('d1', 'migrations', 'apply', 'DB')
  const counts = remote('d1', 'execute', 'DB', '--command', `SELECT
    (SELECT COUNT(*) FROM users) AS users,
    (SELECT COUNT(*) FROM records) AS records,
    (SELECT COUNT(*) FROM events WHERE id IS NOT NULL) AS dynamic_events`, '--json')
  const [result] = JSON.parse(counts)
  const [row] = result.results
  if (!row || row.users || row.records || row.dynamic_events) throw new Error('Target DB already contains business data')
  for (const { key, mime } of expected.avatars) {
    remote('r2', 'object', 'put', `${bucket}/${key}`, '--file', join(source, key), '--content-type', mime)
  }
  remote('d1', 'execute', 'DB', '--file', join(source, 'data.sql'))
  console.log('Remote import completed; run verify before cutover.')
} else {
  // Exports contain password hashes and contact data. Keep them beside the private input and promptly remove them.
  const downloads = mkdtempSync(join(source, '.verification-'))
  try {
    const sql = join(downloads, 'd1-export.sql')
    remote('d1', 'export', 'DB', '--output', sql)
    for (const { key } of expected.avatars) {
      const target = join(downloads, key)
      mkdirSync(dirname(target), { recursive: true, mode: 0o700 })
      remote('r2', 'object', 'get', `${bucket}/${key}`, '--file', target)
    }
    const db = new DatabaseSync(':memory:')
    try {
      db.exec(readFileSync(sql, 'utf8').replace(/^\uFEFF/, ''))
      verify(db, downloads, expected)
    } finally { db.close() }
    console.log('Remote D1 rows, sequence, references and R2 avatar checksums verified.')
  } finally {
    const target = realpathSync(downloads)
    if (dirname(target) !== source || target !== downloads) throw new Error('Unexpected export scratch location')
    rmSync(target, { recursive: true, force: true })
  }
}
