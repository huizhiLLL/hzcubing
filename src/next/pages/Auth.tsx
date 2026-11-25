import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { message, send, type Session } from '../api'
import { ResourceNotice } from '../components/Actions'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useSite } from '../site'

export default function Auth() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { setSession } = useSite()
  const [registering, setRegistering] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    const fields = { email: String(values.get('email') ?? '').trim(), password: values.get('password'), nickname: String(values.get('nickname') ?? '').trim() }
    setBusy(true)
    setError('')
    try {
      const session = await send<Session>(registering ? '/auth/register' : '/auth/login', 'POST', fields)
      setSession(session)
      const next = params.get('next')
      navigate(next?.startsWith('/') && !next.startsWith('//') && !next.includes('\\') ? next : `/user/${session.userNo}`)
    } catch (cause) { setError(message(cause)) }
    finally { setBusy(false) }
  }
  return <section className="form-panel narrow">
    <h1>{registering ? '注册' : '登录'}</h1>
    <form className="fields" onSubmit={submit}>
      <label>邮箱<Input name="email" type="email" maxLength={254} autoComplete="email" required /></label>
      {registering && <label>昵称<Input name="nickname" maxLength={50} autoComplete="nickname" required /></label>}
      <label>密码<Input name="password" type="password" autoComplete={registering ? 'new-password' : 'current-password'} required /></label>
      <ResourceNotice error={error} />
      <Button type="submit" loading={busy}>{registering ? '创建账号' : '登录'}</Button>
    </form>
    <Button variant="ghost" className="switch-auth" disabled={busy} onClick={() => { setRegistering(!registering); setError('') }}>{registering ? '登录' : '注册'}</Button>
  </section>
}
