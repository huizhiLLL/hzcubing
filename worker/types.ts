import type { Context } from 'hono'

export type User = {
  id: string; user_no: number; nickname: string; bio: string; wca_id: string; avatar_key: string | null
  email: string; qq_id: string | null; role: 'user' | 'admin' | 'super_admin'; status: 'active' | 'inactive' | 'banned'
}
export type App = {
  Bindings: {
    DB: D1Database; AVATARS: R2Bucket; PASSWORD_SERVICE_URL: string; PASSWORD_SERVICE_SECRET: string
    BOT_SECRET?: string; SITE_READ_ONLY?: string; DEV_PASSWORD_HTTP?: string
    ASTRBOT_MESSAGE_URL?: string; ASTRBOT_API_KEY?: string; ASTRBOT_MESSAGE_UMO?: string
  }
  Variables: { user: User | null; session: string | null }
}
export type AppContext = Context<App>
