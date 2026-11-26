import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, ApiError, type EventInfo, type Session } from './api'

const SiteContext = createContext<{
  session: Session | null; sessionReady: boolean; setSession: (session: Session | null) => void
  events: EventInfo[]; eventsLoading: boolean; refreshEvents: () => Promise<void>; initializationError: string
} | null>(null)

export function SiteProvider({ children }: { children: ReactNode }) {
  const [session, setCurrentSession] = useState<Session | null>(null)
  const [sessionReady, setSessionReady] = useState(false)
  const [events, setEvents] = useState<EventInfo[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [initializationError, setInitializationError] = useState('')
  const setSession = (value: Session | null) => { setCurrentSession(value); setSessionReady(true) }
  const refreshEvents = async () => setEvents(await api<EventInfo[]>('/events'))
  useEffect(() => {
    const controller = new AbortController()
    const options = { signal: controller.signal }
    api<Session>('/auth/me', options).then(value => {
      if (!controller.signal.aborted) setSession(value)
    }).catch(error => {
      if (controller.signal.aborted) return
      setSessionReady(true)
      if (!(error instanceof ApiError) || error.status !== 401) setInitializationError('暂时无法读取登录状态')
    })
    api<EventInfo[]>('/events', options).then(value => {
      if (!controller.signal.aborted) setEvents(value)
    }).catch(() => {
      if (!controller.signal.aborted) setInitializationError('暂时无法加载项目')
    }).finally(() => {
      if (!controller.signal.aborted) setEventsLoading(false)
    })
    return () => controller.abort()
  }, [])
  return <SiteContext.Provider value={{ session, sessionReady, setSession, events, eventsLoading, refreshEvents, initializationError }}>{children}</SiteContext.Provider>
}

export function useSite() {
  const site = useContext(SiteContext)
  if (!site) throw new Error('SiteProvider is missing')
  return site
}

export function useResource<T>(path: string | null, revision = 0) {
  const [result, setResult] = useState<{ path: string; revision: number; data?: T; error: string }>()
  useEffect(() => {
    if (!path) return
    const controller = new AbortController()
    api<T>(path, { signal: controller.signal }).then(data => {
      if (!controller.signal.aborted) setResult({ path, revision, data, error: '' })
    }).catch(error => {
      if (!controller.signal.aborted) setResult({ path, revision, error: error instanceof Error ? error.message : '加载失败' })
    })
    return () => controller.abort()
  }, [path, revision])
  const current = result?.path === path && result.revision === revision ? result : undefined
  return { data: current?.data, error: current?.error ?? '', loading: Boolean(path && !current) }
}
