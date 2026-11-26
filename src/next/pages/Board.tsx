import { Plus } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { day, time, type RecordInfo } from '../api'
import { ActionLink, ResourceNotice } from '../components/Actions'
import { ProjectSelect } from '../components/ProjectSelect'
import { SegmentedControl } from '../components/SegmentedControl'
import { Button } from '../components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { useResource, useSite } from '../site'

const metrics = [{ value: 'single', label: '单次' }, { value: 'average', label: '平均' }] as const

export default function Board({ historyMode = false }: { historyMode?: boolean }) {
  const { events, session } = useSite()
  const [params, setParams] = useSearchParams()
  const event = params.get('event') || '333'
  const metric = params.get('type') === 'average' ? 'average' : 'single'
  const filters = new URLSearchParams({ event, type: metric })
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
    <header className="page-heading"><h1>{historyMode ? '破纪录历史' : '排行榜'}</h1>{historyMode
      ? <Button variant="outline" render={<Link to="/gr" />}>返回 GR 纪录</Button>
      : <ActionLink to="/submit" label="提交成绩"><Plus /></ActionLink>}</header>
    <div className="toolbar board-toolbar board-filters">
      <ProjectSelect compact events={events} value={event} onValueChange={next => update('event', next)} />
      <SegmentedControl label="成绩类型" size="compact" options={metrics} value={metric} onValueChange={next => update('type', next)} />
    </div>
    {loading || error || !rows.length ? <ResourceNotice loading={loading} error={error} empty="暂无成绩。" /> :
      <Table><TableHeader><TableRow>
        {!historyMode && <TableHead scope="col" className="rank">排名</TableHead>}
        <TableHead scope="col">选手</TableHead><TableHead scope="col" className="numeric">成绩</TableHead>
        <TableHead scope="col" className="date-col">日期</TableHead>
      </TableRow></TableHeader><TableBody>{rows.map(row => <TableRow key={row.id}
        className={!historyMode && row.userNo === session?.userNo ? 'own-rank' : undefined}>
        {!historyMode && <TableCell className={`rank ${row.rank && row.rank <= 3 ? 'podium' : ''}`}>{row.rank}</TableCell>}
        <TableCell><Link to={`/user/${row.userNo}`}>{row.nickname}</Link></TableCell>
        <TableCell className="numeric result-time">{time(metric === 'average' ? row.averageSeconds : row.singleSeconds)}</TableCell>
        <TableCell className="date-col">{day(row.timestamp)}</TableCell>
      </TableRow>)}</TableBody></Table>}
  </>
}
