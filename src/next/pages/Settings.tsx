import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { api, message, send, type Player, type Session } from '../api'
import { ResourceNotice } from '../components/Actions'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { usePageTitle, useSite } from '../site'

const avatarTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/avif']
const maxAvatarSize = 2_000_000

type AvatarEdit = { file: File; preview: string } | null | undefined

export default function Settings() {
  const { session, sessionReady, setSession } = useSite()
  const { pathname } = useLocation()
  usePageTitle('编辑资料')
  if (!sessionReady) return <ResourceNotice loading skeleton="form" />
  if (!session) return <Link to={`/auth?${new URLSearchParams({ next: pathname })}`}>请先登录</Link>
  return <SettingsForm key={session.userNo} session={session} onUpdate={setSession} />
}

function SettingsForm({ session, onUpdate }: { session: Session; onUpdate: (session: Session) => void }) {
  const imageInput = useRef<HTMLInputElement>(null)
  const [nickname, setNickname] = useState(session.nickname)
  const [avatarEdit, setAvatarEdit] = useState<AvatarEdit>(undefined)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const temporaryImage = avatarEdit?.preview
  const avatar = avatarEdit === undefined ? session.avatar : temporaryImage

  useEffect(() => {
    if (temporaryImage) return () => URL.revokeObjectURL(temporaryImage)
  }, [temporaryImage])

  async function update(action: () => Promise<void>, success: string) {
    if (pending) return
    setPending(true)
    setError('')
    setNotice('')
    try { await action(); setNotice(success) }
    catch (cause) { setError(message(cause)) }
    finally { setPending(false) }
  }

  function selectAvatar(file?: File) {
    if (!file) return
    setNotice('')
    if (!avatarTypes.includes(file.type)) { setError('请选择 JPG、PNG、WebP、GIF 或 AVIF 图片'); return }
    if (file.size > maxAvatarSize) { setError('头像大小上限为 2 MB'); return }
    setError('')
    setAvatarEdit({ file, preview: URL.createObjectURL(file) })
  }

  function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    const profile = Object.fromEntries(['nickname', 'wcaId', 'bio'].map(key => [key, String(fields.get(key) ?? '').trim()]))
    void update(async () => {
      let user: Player
      if (avatarEdit === undefined) {
        user = await send<Player>('/profile', 'PATCH', profile)
      } else {
        const body = new FormData()
        for (const [key, value] of Object.entries(profile)) body.set(key, value)
        if (avatarEdit) body.set('avatar', avatarEdit.file)
        else body.set('removeAvatar', '1')
        user = await api<Player>('/profile', { method: 'PATCH', body })
      }
      onUpdate({ ...session, ...user })
      setNickname(user.nickname)
      setAvatarEdit(undefined)
    }, '资料已保存')
  }

  return <section className="settings-panel" aria-labelledby="settings-heading">
    <header className="page-heading">
      <h1 id="settings-heading">编辑资料</h1>
      <Button variant="ghost" render={<Link to="/profile" />}>返回个人主页</Button>
    </header>
    <form className="fields" onSubmit={saveProfile}>
      <fieldset className="settings-fields" disabled={pending}>
        <div className="settings-avatar">
          {avatar ? <img className="avatar" src={avatar} alt="头像预览" width={72} height={72} /> :
            <span className="avatar fallback" aria-hidden="true">{[...(nickname.trim() || session.nickname)][0]}</span>}
          <div className="settings-avatar-actions">
            <input ref={imageInput} type="file" accept={avatarTypes.join(',')} hidden onChange={event => {
              selectAvatar(event.currentTarget.files?.[0])
              event.currentTarget.value = ''
            }} />
            <div className="actions">
              <Button type="button" variant="outline" onClick={() => imageInput.current?.click()}>选择头像</Button>
              {avatar && <Button type="button" variant="ghost" onClick={() => { setAvatarEdit(null); setError(''); setNotice('') }}>移除头像</Button>}
              {avatarEdit !== undefined && <Button type="button" variant="ghost" onClick={() => { setAvatarEdit(undefined); setError(''); setNotice('') }}>撤销</Button>}
            </div>
            <small>{avatarEdit ? avatarEdit.file.name : avatarEdit === null ? '保存后移除头像' : '支持 JPG、PNG、WebP、GIF、AVIF，最大 2 MB'}</small>
          </div>
        </div>
        <label>邮箱<Input type="email" value={session.email} readOnly /></label>
        <label>昵称<Input name="nickname" value={nickname} onChange={event => setNickname(event.currentTarget.value)} maxLength={50} autoComplete="nickname" required /></label>
        <label>WCA ID（选填）<Input name="wcaId" defaultValue={session.wcaId} placeholder="如 2024ZHAN01" maxLength={20} /></label>
        <label>个人简介（选填）<Textarea name="bio" defaultValue={session.bio} maxLength={500} rows={4} /></label>
      </fieldset>
      <Button type="submit" loading={pending}>保存修改</Button>
    </form>
    <section className="settings-qq" aria-labelledby="settings-qq-heading">
      <h2 id="settings-qq-heading">QQ 绑定</h2>
      {session.qqBound ? <p>已绑定 QQ</p> : <form className="fields" onSubmit={event => {
        event.preventDefault()
        const qqId = String(new FormData(event.currentTarget).get('qq') ?? '').trim()
        void update(async () => {
          await send('/profile/qq', 'POST', { qqId })
          onUpdate({ ...session, qqBound: true })
        }, 'QQ 已绑定')
      }}>
        <label>QQ 号码<Input name="qq" inputMode="numeric" pattern="[0-9]{5,15}" maxLength={15} disabled={pending} required /></label>
        <Button type="submit" variant="outline" disabled={pending}>绑定 QQ</Button>
      </form>}
    </section>
    <ResourceNotice error={error} />
    {notice && <p className="notice success" role="status">{notice}</p>}
  </section>
}
