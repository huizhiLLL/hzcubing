export interface Player {
  userNo: number; nickname: string; bio: string; wcaId: string; avatar: string | null
}
export interface Session extends Player { email: string; role: string; qqBound: boolean }
export interface EventInfo { code: string; name: string; category: string; description: string; iconId: string | null; active: boolean }
export interface Best { event: string; singleSeconds: number | null; averageSeconds: number | null }
export interface RecordInfo extends Best {
  id: string; timestamp: number; userNo: number; nickname: string; avatar: string | null
  rank?: number; cube: string | null; method: string | null; competition: string | null; solves: (number | null)[] | null
}
export const categories = { official: '官方', fun: '趣味', meme: '整活', historical: '历史' }

export class ApiError extends Error {
  constructor(readonly status: number, message: string) { super(message) }
}
export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, { credentials: 'same-origin', ...options })
  if (!response.ok) {
    const result = await response.json().catch(() => null) as { message?: string } | null
    throw new ApiError(response.status, result?.message ?? '请求失败，请稍后再试')
  }
  return response.status === 204 ? undefined as T : response.json()
}
export function send<T>(path: string, method: string, data?: unknown) {
  return api<T>(path, { method, headers: data == null ? undefined : { 'Content-Type': 'application/json' }, body: data == null ? undefined : JSON.stringify(data) })
}
export const message = (error: unknown) => error instanceof Error ? error.message : '暂时无法完成操作'
export function time(seconds: number | null) {
  if (seconds == null) return '—'
  const centis = Math.trunc(seconds * 100 + 1e-9)
  const fraction = String(centis % 100).padStart(2, '0')
  const whole = Math.floor(centis / 100)
  const h = Math.floor(whole / 3600)
  const m = Math.floor(whole % 3600 / 60)
  const s = whole % 60
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${fraction}` : m ? `${m}:${String(s).padStart(2, '0')}.${fraction}` : `${s}.${fraction}`
}
export const day = (value: number) => new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(value)
