import { useState, type FormEvent } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { message, send, type Session } from '../api'
import { IconButton, ResourceNotice } from '../components/Actions'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useSite } from '../site'

export default function Auth() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { setSession } = useSite()
  const [registering, setRegistering] = useState(false)
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    const password = values.get('password')
    if (registering && password !== values.get('confirmation')) {
      setError('两次输入的密码不一致')
      return
    }
    const fields = { email: String(values.get('email') ?? '').trim(), password }
    const payload = registering ? {
      ...fields, nickname: String(values.get('nickname') ?? '').trim(), qqId: String(values.get('qqId') ?? '').trim(),
    } : fields
    setBusy(true)
    setError('')
    try {
      const session = await send<Session>(registering ? '/auth/register' : '/auth/login', 'POST', payload)
      setSession(session)
      const next = params.get('next') ?? params.get('redirect')
      navigate(next?.startsWith('/') && !next.startsWith('//') && !next.includes('\\') ? next : `/user/${session.userNo}`)
    } catch (cause) { setError(message(cause)) }
    finally { setBusy(false) }
  }
  return <section className="form-panel auth-panel" aria-labelledby="auth-heading">
    <h1 id="auth-heading">{registering ? '注册' : '登录'}</h1>
    <form className="fields" onSubmit={submit}>
      <label>邮箱<Input name="email" type="email" maxLength={254} autoComplete="email" placeholder="输入邮箱" required /></label>
      <div className="auth-field">
        <label htmlFor="auth-password">密码</label>
        <div className="auth-password">
          <Input id="auth-password" name="password" placeholder="输入密码" type={passwordVisible ? 'text' : 'password'} autoComplete={registering ? 'new-password' : 'current-password'} required />
          <IconButton className="auth-password-toggle" type="button" label={passwordVisible ? '隐藏密码' : '显示密码'} onClick={() => setPasswordVisible(visible => !visible)}>
            {passwordVisible ? <EyeOff /> : <Eye />}
          </IconButton>
        </div>
      </div>
      <div className="auth-extra" data-expanded={registering || undefined} inert={!registering}>
        <fieldset disabled={!registering}>
          <label>昵称<Input name="nickname" maxLength={50} autoComplete="nickname" placeholder="输入昵称" required /></label>
          <label>QQ 号（选填）<Input name="qqId" inputMode="numeric" pattern="[0-9]{5,15}" maxLength={15} placeholder="输入 QQ 号" /></label>
          <label>确认密码<Input name="confirmation" type="password" autoComplete="new-password" placeholder="再次输入密码" required /></label>
        </fieldset>
      </div>
      <ResourceNotice error={error} />
      <Button className="auth-submit" type="submit" loading={busy}>{registering ? '创建账号' : '登录'}</Button>
    </form>
    <div className="auth-switch">
      <span>{registering ? '已有账号？' : '还没有账号？'}</span>
      <Button variant="link" disabled={busy} onClick={() => { setRegistering(!registering); setPasswordVisible(false); setError('') }}>
        {registering ? '去登录' : '去注册'}
      </Button>
    </div>
  </section>
}
