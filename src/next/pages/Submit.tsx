import { useId, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { categories, message, send, type EventInfo, type RecordInfo } from '../api'
import { ResourceNotice } from '../components/Actions'
import { ProjectSelect } from '../components/ProjectSelect'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from '../components/ui/select'
import { usePageTitle, useResource, useSite } from '../site'

export default function Submit() {
  const [params] = useSearchParams()
  const location = useLocation()
  const { session, sessionReady, events, eventsLoading } = useSite()
  const id = params.get('edit') || ''
  const pageTitle = id ? '编辑成绩' : '提交成绩'
  usePageTitle(pageTitle)
  const { data, loading, error } = useResource<RecordInfo>(id && session ? `/records/${encodeURIComponent(id)}` : null)
  const denied = Boolean(data && data.userNo !== session?.userNo)
  const next = new URLSearchParams({ next: location.pathname + location.search })
  return <>
    <header className="page-heading"><h1>{pageTitle}</h1>
      {session && <Button variant="outline" render={<Link to="/submit/manage" />}>管理我的成绩</Button>}
    </header>
    <section className="page-form">
      {sessionReady && !session && <Link to={`/auth?${next}`}>登录后提交成绩</Link>}
      <ResourceNotice skeleton="form" loading={loading || !sessionReady || (Boolean(session) && eventsLoading)} error={denied ? '只能编辑自己的成绩' : error} />
      {session && !eventsLoading && (!id || (data && !denied)) && <RecordForm key={id} record={data} events={events} userNo={session.userNo} />}
    </section>
  </>
}

function RecordForm({ record, events, userNo }: { record?: RecordInfo; events: EventInfo[]; userNo: number }) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const initialTimes = { singleSeconds: String(record?.singleSeconds ?? ''), averageSeconds: String(record?.averageSeconds ?? '') }
  const initialEvent = record?.event ?? '333'
  const [selectedEvent, setSelectedEvent] = useState(initialEvent)
  const [category, setCategory] = useState<string>()
  const categoryId = useId()
  const options = events.filter(event => event.active || event.code === initialEvent)
  const activeCategory = category ?? options.find(event => event.code === initialEvent)?.category ?? 'official'
  const groups = Object.entries(categories).filter(([key]) => options.some(event => event.category === key))
  const projectOptions = options.filter(event => event.category === activeCategory)
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    const value = (key: string) => String(values.get(key) ?? '').trim()
    const payload: Record<string, unknown> = { event: value('event'), cube: value('cube'), method: value('method') }
    for (const [metric, initial] of Object.entries(initialTimes)) {
      if (!record || value(metric) !== initial) payload[metric] = value(metric)
    }
    setBusy(true)
    setError('')
    try {
      await send(record ? `/records/${encodeURIComponent(record.id)}` : '/records', record ? 'PATCH' : 'POST', payload)
      navigate(record ? '/submit/manage' : `/user/${userNo}`)
    } catch (cause) { setError(message(cause)) }
    finally { setBusy(false) }
  }
  return <form className="fields" onSubmit={save}>
    <ResourceNotice error={error} />
    <div className="field-pair">
      <div className="project-select-field">
        <label htmlFor={categoryId}>项目分类</label>
        <Select value={activeCategory} items={groups.map(([value, label]) => ({ value, label }))} onValueChange={value => {
          if (!value) return
          setCategory(value)
          setSelectedEvent(options.find(event => event.category === value)?.code ?? '')
        }}>
          <SelectTrigger id={categoryId} className="w-full"><SelectValue /></SelectTrigger>
          <SelectPopup alignItemWithTrigger={false}>{groups.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectPopup>
        </Select>
      </div>
      <ProjectSelect events={projectOptions} name="event" required value={selectedEvent} onValueChange={setSelectedEvent} />
    </div>
    <div className="field-pair">
      <label>单次<Input name="singleSeconds" defaultValue={initialTimes.singleSeconds} placeholder="12.34" inputMode="decimal" /></label>
      <label>平均<Input name="averageSeconds" defaultValue={initialTimes.averageSeconds} placeholder="13.45" inputMode="decimal" /></label>
    </div>
    <div className="field-pair">
      <label>魔方（选填）<Input name="cube" defaultValue={record?.cube ?? ''} maxLength={100} /></label>
      <label>解法（选填）<Input name="method" defaultValue={record?.method ?? ''} maxLength={100} /></label>
    </div>
    <Button type="submit" loading={busy}>保存成绩</Button>
  </form>
}
