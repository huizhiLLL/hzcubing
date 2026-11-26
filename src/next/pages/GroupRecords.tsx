import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { categories, time } from '../api'
import { ActionLink, ResourceNotice } from '../components/Actions'
import { SegmentedControl } from '../components/SegmentedControl'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { usePageTitle, useResource, useSite } from '../site'

type Holder = { userNo: number; nickname: string; seconds: number }
type GroupRecord = { event: string; single: Holder | null; average: Holder | null; score: (Omit<Holder, 'seconds'> & { value: number }) | null }
const groupCategories = ['official', 'fun', 'meme', 'score'] as const
const categoryOptions = groupCategories.map(value => ({ value, label: categories[value] }))

function HolderLink({ holder }: { holder: Holder | null }) {
  return holder ? <Link to={`/user/${holder.userNo}`}>{holder.nickname}</Link> : '—'
}

export default function GroupRecords() {
  const [params] = useSearchParams()
  if (params.get('event')) return <Navigate replace to={`/gr/history?${params}`} />
  return <Overview />
}

function Overview() {
  const { events } = useSite()
  const pageTitle = '群纪录'
  usePageTitle(pageTitle)
  const [category, setCategory] = useState<typeof groupCategories[number]>('official')
  const { data, loading, error } = useResource<GroupRecord[]>('/records/best', 0, true)
  const best = new Map(data?.map(record => [record.event, record]))
  const rows = events.flatMap(event => {
    const record = best.get(event.code)
    return event.category === category && record ? [{ ...record, name: event.name }] : []
  })

  return <>
    <header className="page-heading">
      <h1>{pageTitle}</h1>
      <ActionLink to="/submit" label="提交成绩"><Plus /></ActionLink>
    </header>
    <div className="toolbar board-toolbar">
      <SegmentedControl label="项目类型" options={categoryOptions} value={category} onValueChange={setCategory} />
    </div>
    <div key={`${category}:${loading}`} className="resource-enter">
      {loading || error || !rows.length ? <ResourceNotice skeleton="table" loading={loading} error={error} empty={`暂无${categories[category]}纪录数据`} /> : <>
        <div className="gr-table"><Table><TableHeader><TableRow>
          <TableHead scope="col">项目</TableHead><TableHead scope="col" aria-label="单次选手">选手</TableHead>
          <TableHead scope="col" column="time">{category === 'score' ? '成绩' : '单次'}</TableHead>{category !== 'score' && <TableHead scope="col" aria-label="平均选手">选手</TableHead>}
          {category !== 'score' && <TableHead scope="col" column="time">平均</TableHead>}
        </TableRow></TableHeader><TableBody>{rows.map(row => <TableRow key={row.event}>
          <TableCell><Link to={`/gr/history?${new URLSearchParams({ event: row.event })}`}>{row.name}</Link></TableCell>
          <TableCell column="player"><HolderLink holder={category === 'score' ? row.score && { ...row.score, seconds: row.score.value } : row.single} /></TableCell><TableCell column="time">{category === 'score' ? row.score?.value ?? '—' : time(row.single?.seconds ?? null)}</TableCell>
          {category !== 'score' && <><TableCell column="player"><HolderLink holder={row.average} /></TableCell><TableCell column="time">{time(row.average?.seconds ?? null)}</TableCell></>}
        </TableRow>)}</TableBody></Table></div>
        <ul className="gr-cards">{rows.map(row => <li key={row.event}>
          <h2><Link to={`/gr/history?${new URLSearchParams({ event: row.event })}`}>{row.name}</Link></h2>
          <dl>{(category === 'score' ? [['成绩', row.score && { ...row.score, seconds: row.score.value }]] as const : [['单次', row.single], ['平均', row.average]] as const).map(([label, holder]) => <div key={label}>
            <dt>{label}</dt><dd><strong className="result-time">{category === 'score' ? holder?.seconds ?? '—' : time(holder?.seconds ?? null)}</strong><HolderLink holder={holder} /></dd>
          </div>)}</dl>
        </li>)}</ul>
      </>}
    </div>
  </>
}
