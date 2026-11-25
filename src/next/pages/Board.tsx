import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { categories, day, time, type RecordInfo } from '../api'
import { ActionLink, IconButton, ResourceNotice } from '../components/Actions'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { useResource, useSite } from '../site'

export default function Board({ historyMode = false }: { historyMode?: boolean }) {
  const { events } = useSite()
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const event = params.get('event') || '333'
  const metric = params.get('type') === 'average' ? 'average' : 'single'
  const filters = new URLSearchParams({ event, type: metric, q: query })
  const { data, loading, error } = useResource<RecordInfo[] | Record<'single' | 'average', RecordInfo[]>>(
    historyMode ? `/records/gr?${new URLSearchParams({ event })}` : `/records/leaderboard?${filters}`,
  )
  const rows = Array.isArray(data) ? data : data?.[metric] ?? []
  function update(key: string, value: string) {
    const next = new URLSearchParams(params)
    next.set(key, value)
    setParams(next, { replace: true })
  }
  return <>
    <header className="page-heading"><h1>{historyMode ? '群纪录' : '成绩榜单'}</h1><ActionLink to="/submit" label="录入成绩"><Plus /></ActionLink></header>
    <div className="toolbar">
      <label>项目 <select value={event} onChange={change => update('event', change.target.value)}>
        {Object.entries(categories).map(([category, name]) => <optgroup key={category} label={name}>
          {events.filter(item => item.category === category).map(item => <option key={item.code} value={item.code}>{item.name}</option>)}
        </optgroup>)}
      </select></label>
      <div className="segments" role="group" aria-label="成绩类型">
        <Button variant="ghost" aria-pressed={metric === 'single'} onClick={() => update('type', 'single')}>单次</Button>
        <Button variant="ghost" aria-pressed={metric === 'average'} onClick={() => update('type', 'average')}>平均</Button>
      </div>
      {!historyMode && <form className="search" role="search" onSubmit={submit => {
        submit.preventDefault()
        setQuery(String(new FormData(submit.currentTarget).get('nickname') || '').trim())
      }}>
        <Input name="nickname" aria-label="选手昵称" type="search" maxLength={50} placeholder="选手昵称" />
        <IconButton type="submit" label="搜索"><Search /></IconButton>
      </form>}
    </div>
    {loading || error || !rows.length ? <ResourceNotice loading={loading} error={error} empty="暂无成绩。" /> :
      <Table><TableHeader><TableRow>
        {!historyMode && <TableHead scope="col" className="rank">排名</TableHead>}
        <TableHead scope="col">选手</TableHead><TableHead scope="col" className="numeric">成绩</TableHead>
        <TableHead scope="col" className="secondary-col">器材</TableHead><TableHead scope="col" className="date-col">日期</TableHead>
      </TableRow></TableHeader><TableBody>{rows.map(row => <TableRow key={row.id}>
        {!historyMode && <TableCell className={`rank ${row.rank && row.rank <= 3 ? 'podium' : ''}`}>{row.rank}</TableCell>}
        <TableCell><Link to={`/user/${row.userNo}`}>{row.nickname}</Link></TableCell>
        <TableCell className="numeric result-time">{time(metric === 'average' ? row.averageSeconds : row.singleSeconds)}</TableCell>
        <TableCell className="secondary-col">{row.cube || '—'}</TableCell><TableCell className="date-col">{day(row.timestamp)}</TableCell>
      </TableRow>)}</TableBody></Table>}
  </>
}
