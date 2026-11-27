import { Dialog } from '@base-ui/react/dialog'
import { Pencil, Plus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { categories, message, send, type EventInfo } from '../api'
import { IconButton, ResourceNotice } from '../components/Actions'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from '../components/ui/select'
import { Textarea } from '../components/ui/textarea'
import { usePageTitle, useSite } from '../site'

export default function Events({ adminOnly = false }: { adminOnly?: boolean }) {
  const { session, sessionReady, events, eventsLoading, refreshEvents } = useSite()
  const pageTitle = adminOnly ? '项目管理' : '项目'
  usePageTitle(pageTitle)
  const [editing, setEditing] = useState<EventInfo>()
  const [open, setOpen] = useState(false)
  const [triggerId, setTriggerId] = useState<string | null>(null)
  const [refreshError, setRefreshError] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const canManage = Boolean(session && session.role !== 'user')
  async function remove(unused: boolean) {
    if (!unused && !editing) return
    const prompt = unused ? '确定清理所有没有成绩记录的整活和积分项目吗？' : `确定删除项目「${editing!.name}」吗？该项目下的所有成绩也会永久删除，无法恢复。`
    if (!window.confirm(prompt)) return
    setBusy(true)
    setError('')
    setRefreshError('')
    setNotice('')
    try {
      const result = await send<{ deleted: number } | undefined>(unused ? '/events' : `/events/${encodeURIComponent(editing!.code)}`, 'DELETE')
      setOpen(false)
      setNotice(unused ? `已清理 ${result!.deleted} 个项目` : '项目已删除')
      await refreshEvents().catch(() => setRefreshError('操作已完成，刷新页面查看最新列表。'))
    } catch (cause) { unused ? setRefreshError(message(cause)) : setError(message(cause)) }
    finally { setBusy(false) }
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    setBusy(true)
    setError('')
    setRefreshError('')
    try {
      await send(editing ? `/events/${encodeURIComponent(editing.code)}` : '/events', editing ? 'PATCH' : 'POST', {
        code: editing?.code ?? String(values.get('code') ?? '').trim(), name: String(values.get('name') ?? '').trim(),
        category: editing?.category ?? String(values.get('category') ?? 'meme'), description: String(values.get('description') ?? '').trim(), active: values.has('active'),
      })
      setOpen(false)
      await refreshEvents().catch(() => setRefreshError('项目已保存，刷新页面查看最新列表。'))
    } catch (cause) { setError(message(cause)) }
    finally { setBusy(false) }
  }
  if (adminOnly && !sessionReady) return <ResourceNotice loading />
  if (adminOnly && !canManage) return <Navigate to={session ? '/' : '/auth?next=%2Fadmin%2Fmeme-events'} replace />
  return <Dialog.Root open={open} triggerId={triggerId} onOpenChange={(next, details) => {
    if (busy) { details.cancel(); return }
    if (next) {
      const trigger = details.trigger?.id
      setEditing(events.find(event => `edit-meme-event-${encodeURIComponent(event.code)}` === trigger))
      setTriggerId(trigger ?? null)
      setError('')
    }
    setOpen(next)
  }}>
    <header className="page-heading">
      <h1>{pageTitle}</h1>
      {adminOnly ? <div className="actions event-heading-actions"><Button variant="outline" title="清理无成绩项目" aria-label="清理无成绩项目" disabled={busy || eventsLoading} onClick={() => void remove(true)}>清理</Button><Dialog.Trigger id="add-meme-event" render={<IconButton label="新增项目"><Plus /></IconButton>} /></div> :
        canManage && <Button variant="outline" render={<Link to="/admin/meme-events" />}>管理项目</Button>}
    </header>
    <ResourceNotice error={refreshError} />
    {notice && <p className="notice success" role="status">{notice}</p>}
    {adminOnly && <Dialog.Portal>
      <Dialog.Backdrop className="event-dialog-backdrop" />
      <Dialog.Viewport className="event-dialog-viewport">
        <Dialog.Popup className="event-dialog-popup">
          <Dialog.Title>{editing ? '编辑项目' : '新增项目'}</Dialog.Title>
          <form key={editing?.code ?? ''} className="fields" onSubmit={save}>
            <fieldset className="event-dialog-fields" disabled={busy}>
              <div className="field-pair">
                <label>编码<Input name="code" maxLength={60} defaultValue={editing?.code} readOnly={Boolean(editing)} required /></label>
                <label>名称<Input name="name" maxLength={80} defaultValue={editing?.name} required /></label>
              </div>
              <div className="project-select-field"><label id="event-category-label">分类</label>
                <Select name="category" defaultValue={editing?.category ?? 'meme'} disabled={Boolean(editing)} items={[{ value: 'meme', label: '整活' }, { value: 'score', label: '积分' }]}>
                  <SelectTrigger aria-labelledby="event-category-label" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectPopup><SelectItem value="meme">整活</SelectItem><SelectItem value="score">积分</SelectItem></SelectPopup>
                </Select></div>
              <label>描述<Textarea name="description" maxLength={500} rows={3} defaultValue={editing?.description} /></label>
              <label className="check"><input type="checkbox" name="active" defaultChecked={editing?.active ?? true} />启用</label>
            </fieldset>
            <ResourceNotice error={error} />
            <div className="actions event-dialog-actions">
              {editing && <Button variant="destructive-outline" className="event-delete" disabled={busy} onClick={() => void remove(false)}>删除项目</Button>}
              <Dialog.Close render={<Button variant="ghost" disabled={busy} />}>取消</Dialog.Close>
              <Button type="submit" loading={busy}>保存</Button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Viewport>
    </Dialog.Portal>}
    {eventsLoading ? <ResourceNotice loading skeleton="directory" /> : Object.entries(categories).map(([category, name]) => {
      if (adminOnly && category !== 'meme' && category !== 'score') return null
      const items = events.filter(event => event.category === category)
      return items.length > 0 && <section key={category} className="section">
        <h2>{name}项目</h2>
        <ul className="directory-list">{items.map(event => <li key={event.code}>
          <Link className="directory-link" to={`/leaderboard?${new URLSearchParams({ event: event.code })}`}>
            <strong>{event.name}</strong>
            {(!event.active || event.code !== event.name) && <small>{event.active ? event.code : '已停用'}</small>}
          </Link>
          {adminOnly && <Dialog.Trigger id={`edit-meme-event-${encodeURIComponent(event.code)}`} disabled={busy}
            render={<IconButton className="event-edit-action" label={`编辑${event.name}`}><Pencil /></IconButton>} />}
        </li>)}</ul>
      </section>
    })}
  </Dialog.Root>
}
