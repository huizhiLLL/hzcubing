import { useEffect } from 'react'
import { Plus } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { day, prefetchResource, time, type RecordInfo } from '../api'
import { ActionLink, ResourceNotice } from '../components/Actions'
import { ProjectSelect } from '../components/ProjectSelect'
import { SegmentedControl } from '../components/SegmentedControl'
import { Button } from '../components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { usePageTitle, useResource, useSite } from '../site'

const metrics = [{ value: 'single', label: '单次' }, { value: 'average', label: '平均' }] as const

function leaderboardPath(event: string, type: string) {
  return `/records/leaderboard?${new URLSearchParams({ event, type })}`
}

export default function Board({ historyMode = false }: { historyMode?: boolean }) {
  const { events, session } = useSite()
  const pageTitle = historyMode ? '破纪录历史' : '榜单'
  usePageTitle(pageTitle)
  const [params, setParams] = useSearchParams()
  const event = params.get('event') || '333'
  const metric = params.get('type') === 'average' ? 'average' : 'single'
  const { data, loading, error } = useResource<RecordInfo[] | Record<'single' | 'average', RecordInfo[]>>(
    historyMode ? `/records/gr?${new URLSearchParams({ event })}` : leaderboardPath(event, metric), 0, true,
  )
  useEffect(() => {
    if (!historyMode && !loading && !error) prefetchResource(leaderboardPath(event, metric === 'single' ? 'average' : 'single'))
  }, [event, metric, historyMode, loading, error])
  const rows = Array.isArray(data) ? data : data?.[metric] ?? []
  function update(key: string, value: string) {
    const next = new URLSearchParams(params)
    next.set(key, value)
    setParams(next, { replace: true })
  }
  return <>
    <header className="page-heading"><h1>{pageTitle}</h1>{historyMode
      ? <Button variant="outline" render={<Link to="/gr" />}>返回群纪录</Button>
      : <ActionLink to="/submit" label="提交成绩"><Plus /></ActionLink>}</header>
    <div className="toolbar board-toolbar board-filters">
      <ProjectSelect compact events={events} value={event} onValueChange={next => update('event', next)} />
      <SegmentedControl label="成绩类型" options={metrics} value={metric} onValueChange={next => update('type', next)} />
    </div>
    <div key={`${event}:${metric}:${loading}`} className="resource-enter">
      {loading || error || !rows.length ? <ResourceNotice skeleton="table" loading={loading} error={error} empty="暂无成绩。" /> :
        <Table><TableHeader><TableRow>
          {!historyMode && <TableHead scope="col" column="rank">排名</TableHead>}
          <TableHead scope="col">选手</TableHead><TableHead scope="col" column="time">成绩</TableHead>
          <TableHead scope="col" column="date">日期</TableHead>
        </TableRow></TableHeader><TableBody>{rows.map(row => <TableRow key={row.id}
          className={!historyMode && row.userNo === session?.userNo ? 'own-rank' : undefined}>
          {!historyMode && <TableCell column="rank" className={row.rank && row.rank <= 3 ? 'podium' : undefined}>{row.rank}</TableCell>}
          <TableCell column="player"><Link to={`/user/${row.userNo}`}>{row.nickname}</Link></TableCell>
          <TableCell column="time">{time(metric === 'average' ? row.averageSeconds : row.singleSeconds)}</TableCell>
          <TableCell column="date">{day(row.timestamp)}</TableCell>
        </TableRow>)}</TableBody></Table>}
    </div>
  </>
}
