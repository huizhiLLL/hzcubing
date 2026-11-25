import assert from 'node:assert/strict'
import { once } from 'node:events'
import test from 'node:test'
import { createPasswordServer } from './service.mjs'

const secret = 'a'.repeat(64)
const password = 'synthetic-test-password'

test('hash and verify require credentials and support legacy bcrypt hashes', async (t) => {
  const server = createPasswordServer(secret)
  t.after(() => server.close())
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const url = `http://127.0.0.1:${server.address().port}`
  const call = (path, body, key = secret) => fetch(`${url}${path}`, {
    method: 'POST', headers: { Authorization: `Bearer ${key}` }, body: JSON.stringify(body),
  })
  assert.equal((await call('/hash', { password }, 'wrong')).status, 401)
  const result = await call('/hash', { password })
  assert.equal(result.status, 200)
  const { hash } = await result.json()
  assert.match(hash, /^\$2a\$10\$/)
  assert.deepEqual(await (await call('/verify', { password, hash })).json(), { matches: true })
  assert.deepEqual(await (await call('/verify', { password: 'wrong', hash })).json(), { matches: false })
  assert.equal((await call('/verify', { password, hash: hash.replace('$10$', '$31$') })).status, 400)
  assert.equal((await call('/hash', { password: '😀'.repeat(19) })).status, 400)
})
