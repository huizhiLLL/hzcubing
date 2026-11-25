import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { message, send, type EventInfo, type RecordInfo } from '../api'
import { ResourceNotice } from '../components/Actions'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useResource, useSite } from '../site'

export default function Submit() {
  const [params] = useSearchParams()
  const location = useLocation()
  const { session, sessionReady, events } = useSite()
  const id = params.get('edit') || ''
  const { data, loading, error } = useResource<RecordInfo>(id && session ? `/records/${encodeURIComponent(id)}` : null)
  const denied = Boolean(data && data.userNo !== session?.userNo)
  const next = new URLSearchParams({ next: location.pathname + location.search })
  return <section className="form-panel">
    <h1>{id ? '编辑成绩' : '录入成绩'}</h1>
    {sessionReady && !session && <Link to={`/auth?${next}`}>登录后录入成绩</Link>}
    <ResourceNotice loading={loading || !sessionReady} error={denied ? '只能编辑自己的成绩' : error} />
    {session && (!id || (data && !denied)) && <RecordForm key={id} record={data} events={events} userNo={session.userNo} />}
  </section>
}

function RecordForm({ record, events, userNo }: { record?: RecordInfo; events: EventInfo[]; userNo: number }) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const initialTimes = { singleSeconds: String(record?.singleSeconds ?? ''), averageSeconds: String(record?.averageSeconds ?? '') }
  const initialSolves = record?.solves?.map(value => value ?? 'DNF').join(' ') ?? ''
  const initialEvent = record?.event ?? '333'
  const options = events.filter(event => event.active || event.code === initialEvent)
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    const value = (key: string) => String(values.get(key) ?? '').trim()
    const payload: Record<string, unknown> = { event: value('event'), cube: value('cube'), method: value('method'), competition: value('competition') }
    for (const [metric, initial] of Object.entries(initialTimes)) {
      if (!record || value(metric) !== initial) payload[metric] = value(metric)
    }
    if (value('solves') !== initialSolves) payload.solves = value('solves').split(/[\s,]+/).filter(Boolean)
    setBusy(true)
    setError('')
    try {
      await send(record ? `/records/${encodeURIComponent(record.id)}` : '/records', record ? 'PATCH' : 'POST', payload)
      navigate(`/user/${userNo}`)
    } catch (cause) { setError(message(cause)) }
    finally { setBusy(false) }
  }
  return <form className="fields" onSubmit={save}>
    <ResourceNotice error={error} />
    <label>项目<select name="event" required defaultValue={initialEvent}>
      {!options.some(event => event.code === initialEvent) && <option value={initialEvent}>{initialEvent}</option>}
      {options.map(event => <option key={event.code} value={event.code}>{event.name}</option>)}
    </select></label>
    <div className="field-pair">
      <label>单次<Input name="singleSeconds" defaultValue={initialTimes.singleSeconds} placeholder="12.34" inputMode="decimal" /></label>
      <label>平均<Input name="averageSeconds" defaultValue={initialTimes.averageSeconds} placeholder="13.45" inputMode="decimal" /></label>
    </div>
    <label>原始成绩<Input name="solves" defaultValue={initialSolves} placeholder="12.34 13.45 DNF" /></label>
    <div className="field-pair">
      <label>器材<Input name="cube" defaultValue={record?.cube ?? ''} maxLength={100} /></label>
      <label>方法<Input name="method" defaultValue={record?.method ?? ''} maxLength={100} /></label>
    </div>
    <label>比赛<Input name="competition" defaultValue={record?.competition ?? ''} maxLength={100} /></label>
    <Button type="submit" loading={busy}>保存成绩</Button>
  </form>
}
