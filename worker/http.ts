import { HTTPException } from 'hono/http-exception'
import type { AppContext, User } from './types'

export function fail(status: 400 | 401 | 403 | 404 | 409 | 413 | 429 | 503, message: string): never {
  throw new HTTPException(status, { message })
}

export async function json(c: AppContext): Promise<Record<string, unknown>> {
  if (!c.req.header('Content-Type')?.toLowerCase().startsWith('application/json')) fail(400, '需要 JSON 请求')
  const value: unknown = await c.req.json().catch(() => null)
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(400, '请求格式不正确')
  return value as Record<string, unknown>
}

export function text(value: unknown, max: number, required = false): string {
  if (value == null && !required) return ''
  if (typeof value !== 'string') fail(400, '字段格式不正确')
  const result = value.trim()
  if (result.length > max || (required && !result)) fail(400, '字段长度不正确')
  return result
}

export async function digest(value: string | Uint8Array<ArrayBuffer>) {
  const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : value
  const buffer = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(buffer), byte => byte.toString(16).padStart(2, '0')).join('')
}

export function avatarUrl(key: string | null) {
  return key ? `/media/${key}` : null
}

export function publicUser(user: Pick<User, 'user_no' | 'nickname' | 'bio' | 'wca_id' | 'avatar_key'>) {
  return { userNo: user.user_no, nickname: user.nickname, bio: user.bio, wcaId: user.wca_id, avatar: avatarUrl(user.avatar_key) }
}
export function signedIn(c: AppContext): User {
  const user = c.get('user')
  if (!user) fail(401, '请先登录')
  return user
}
export function admin(c: AppContext): User {
  const user = signedIn(c)
  if (user.role === 'user') fail(403, '需要管理员权限')
  return user
}
export function uniqueError(error: unknown) {
  return /UNIQUE constraint failed/i.test(String(error))
}
