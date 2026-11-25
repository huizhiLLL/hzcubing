import http from 'node:http'
import { timingSafeEqual } from 'node:crypto'
import bcrypt from 'bcryptjs'

const maxBodyBytes = 2048
const maxConcurrent = 2
const maxPerMinute = 60
const supportedHash = /^\$2[aby]\$10\$[./A-Za-z0-9]{53}$/

export function createPasswordServer(secret) {
  if (!/^[0-9a-f]{64}$/i.test(secret ?? '')) throw new Error('PASSWORD_SERVICE_SECRET must be 32 bytes in hex')
  const expected = Buffer.from(`Bearer ${secret}`)
  let active = 0
  let windowStart = Date.now()
  let attempted = 0

  return http.createServer({ requestTimeout: 5000, headersTimeout: 5000 }, async (request, response) => {
    const reply = (status, body) => {
      response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
      response.end(JSON.stringify(body))
    }
    const provided = Buffer.from(request.headers.authorization ?? '')
    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
      return reply(401, { error: 'unauthorized' })
    }
    if (request.method !== 'POST' || !['/verify', '/hash'].includes(request.url)) {
      return reply(404, { error: 'not_found' })
    }
    const now = Date.now()
    if (now - windowStart >= 60_000) {
      windowStart = now
      attempted = 0
    }
    if (active >= maxConcurrent || attempted >= maxPerMinute) return reply(429, { error: 'busy' })
    active++
    attempted++
    try {
      const chunks = []
      let bodyBytes = 0
      for await (const chunk of request) {
        bodyBytes += chunk.length
        if (bodyBytes > maxBodyBytes) {
          reply(413, { error: 'too_large' })
          return
        }
        chunks.push(chunk)
      }
      let input
      try {
        input = JSON.parse(Buffer.concat(chunks).toString('utf8'))
      } catch {
        return reply(400, { error: 'invalid_json' })
      }
      const password = input?.password
      if (typeof password !== 'string' || !password.length || Buffer.byteLength(password) > 512) {
        return reply(400, { error: 'invalid_password' })
      }
      if (request.url === '/verify') {
        if (typeof input.hash !== 'string' || !supportedHash.test(input.hash)) {
          return reply(400, { error: 'invalid_hash' })
        }
        return reply(200, { matches: await bcrypt.compare(password, input.hash) })
      }
      if (Buffer.byteLength(password) > 72) return reply(400, { error: 'invalid_password' })
      return reply(200, { hash: await bcrypt.hash(password, 10) })
    } catch {
      if (!response.headersSent) reply(500, { error: 'internal_error' })
    } finally {
      active--
    }
  })
}
