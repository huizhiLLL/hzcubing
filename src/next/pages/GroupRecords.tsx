import { useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { categories, time } from '../api'
import { ResourceNotice } from '../components/Actions'
import { SegmentedControl } from '../components/SegmentedControl'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { useResource, useSite } from '../site'

type Holder = { userNo: number; nickname: string; seconds: number }
type GroupRecord = { event: string; single: Holder | null; average: Holder | null }
const groupCategories = ['official', 'fun', 'meme'] as const
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
  const [category, setCategory] = useState<typeof groupCategories[number]>('official')
  const { data, loading, error } = useResource<GroupRecord[]>('/records/best')
  const best = new Map(data?.map(record => [record.event, record]))
  const rows = events.flatMap(event => {
    const record = best.get(event.code)
    return event.category === category && record ? [{ ...record, name: event.name }] : []
  })

  return <>
    <header className="page-heading"><h1>GR 纪录</h1></header>
    <div className="toolbar board-toolbar">
      <SegmentedControl label="项目类型" options={categoryOptions} value={category} onValueChange={setCategory} />
    </div>
    {loading || error || !rows.length ? <ResourceNotice loading={loading} error={error} empty={`暂无${categories[category]}纪录数据`} /> : <>
      <div className="gr-table"><Table><TableHeader><TableRow>
        <TableHead scope="col">项目</TableHead><TableHead scope="col">单次保持者</TableHead>
        <TableHead scope="col" className="numeric">最佳单次</TableHead><TableHead scope="col">平均保持者</TableHead>
        <TableHead scope="col" className="numeric">最佳平均</TableHead>
      </TableRow></TableHeader><TableBody>{rows.map(row => <TableRow key={row.event}>
        <TableCell><Link to={`/gr/history?${new URLSearchParams({ event: row.event })}`}>{row.name}</Link></TableCell>
        <TableCell><HolderLink holder={row.single} /></TableCell><TableCell className="numeric result-time">{time(row.single?.seconds ?? null)}</TableCell>
        <TableCell><HolderLink holder={row.average} /></TableCell><TableCell className="numeric result-time">{time(row.average?.seconds ?? null)}</TableCell>
      </TableRow>)}</TableBody></Table></div>
      <ul className="gr-cards">{rows.map(row => <li key={row.event}>
        <h2><Link to={`/gr/history?${new URLSearchParams({ event: row.event })}`}>{row.name}</Link></h2>
        <dl>{([['最佳单次', row.single], ['最佳平均', row.average]] as const).map(([label, holder]) => <div key={label}>
          <dt>{label}</dt><dd><strong className="result-time">{time(holder?.seconds ?? null)}</strong><HolderLink holder={holder} /></dd>
        </div>)}</dl>
      </li>)}</ul>
    </>}
  </>
}
