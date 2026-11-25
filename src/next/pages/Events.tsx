import { useState, type FormEvent } from 'react'
import { Pencil, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { categories, message, send, type EventInfo } from '../api'
import { IconButton, ResourceNotice } from '../components/Actions'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { useSite } from '../site'

export default function Events() {
  const { session, events, refreshEvents } = useSite()
  const [editing, setEditing] = useState<EventInfo>()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const canManage = Boolean(session && session.role !== 'user')
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const values = new FormData(form)
    setBusy(true)
    setError('')
    try {
      await send(editing ? `/events/${encodeURIComponent(editing.code)}` : '/events', editing ? 'PATCH' : 'POST', {
        code: editing?.code ?? String(values.get('code') ?? '').trim(), name: String(values.get('name') ?? '').trim(),
        description: String(values.get('description') ?? '').trim(), active: values.has('active'),
      })
      await refreshEvents()
      setEditing(undefined)
      form.reset()
    } catch (cause) { setError(message(cause)) }
    finally { setBusy(false) }
  }
  return <>
    <header className="page-heading"><h1>项目</h1></header>
    {canManage && <section className="form-panel">
      <h2>{editing ? '编辑整活项目' : '新增整活项目'}</h2>
      <form key={editing?.code ?? ''} className="fields" onSubmit={save}>
        <div className="field-pair">
          <label>编码<Input name="code" maxLength={60} defaultValue={editing?.code} disabled={Boolean(editing)} required /></label>
          <label>名称<Input name="name" maxLength={80} defaultValue={editing?.name} required /></label>
        </div>
        <label>描述<Textarea name="description" maxLength={500} rows={2} defaultValue={editing?.description} /></label>
        <label className="check"><input type="checkbox" name="active" defaultChecked={editing?.active ?? true} />启用</label>
        <ResourceNotice error={error} />
        <div className="actions">
          <Button type="submit" loading={busy}>保存</Button>
          {editing && <IconButton label="取消编辑" disabled={busy} onClick={() => { setEditing(undefined); setError('') }}><X /></IconButton>}
        </div>
      </form>
    </section>}
    {Object.entries(categories).map(([category, name]) => {
      const items = events.filter(event => event.category === category)
      return items.length > 0 && <section key={category} className="section">
        <h2>{name}项目</h2>
        <ul className="directory-list">{items.map(event => <li key={event.code}>
          <Link className="directory-link" to={`/leaderboard?${new URLSearchParams({ event: event.code })}`}>
            <strong>{event.name}</strong>
            {(!event.active || event.code !== event.name) && <small>{event.active ? event.code : '已停用'}</small>}
          </Link>
          {canManage && category === 'meme' && <IconButton label={`编辑${event.name}`} disabled={busy} onClick={() => { setEditing(event); setError('') }}><Pencil /></IconButton>}
        </li>)}</ul>
      </section>
    })}
  </>
}
