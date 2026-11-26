import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { day, prefetchResource, type Player } from '../api'
import { IconButton, Pagination, ResourceNotice } from '../components/Actions'
import { Input } from '../components/ui/input'
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from '../components/ui/select'
import { usePageTitle, useResource, useSite } from '../site'

const pageSize = 12
const sortOptions = [
  { label: '最新', value: 'latest' },
  { label: '成绩最多', value: 'mostRecords' },
  { label: '项目最多', value: 'mostEvents' },
]
type ListedPlayer = Player & { createdAt: number; recordCount: number; eventCount: number; events: string[] }

function playersPath(page: number, q: string, sort: string) {
  return `/players?${new URLSearchParams({ page: String(page), pageSize: String(pageSize), q, sort })}`
}

export default function Players() {
  const { events } = useSite()
  const eventNames = new Map(events.map(event => [event.code, event.name]))
  const [filter, setFilter] = useState({ page: 1, q: '', sort: 'latest' })
  const { page, q, sort } = filter
  const { data, loading, error } = useResource<{ users: ListedPlayer[]; more: boolean }>(playersPath(page, q, sort), 0, true)
  useEffect(() => {
    if (!data) return
    if (data.more) prefetchResource(playersPath(page + 1, q, sort))
    if (page === 1 && !q) {
      for (const option of sortOptions) {
        if (option.value !== sort) prefetchResource(playersPath(1, '', option.value))
      }
    }
  }, [data, page, q, sort])
  return <>
    <header className="page-heading"><h1>{pageTitle}</h1></header>
    <div className="toolbar board-toolbar players-toolbar">
      <Select items={sortOptions} value={sort} onValueChange={value => value && setFilter({ ...filter, page: 1, sort: value })}>
        <SelectTrigger aria-label="排序方式"><SelectValue /></SelectTrigger>
        <SelectPopup alignItemWithTrigger={false}>{sortOptions.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectPopup>
      </Select>
      <form className="search" role="search" onSubmit={submit => {
        submit.preventDefault()
        setFilter({ ...filter, page: 1, q: String(new FormData(submit.currentTarget).get('query') || '').trim() })
      }}>
        <Input name="query" aria-label="昵称或 WCA ID" type="search" placeholder="搜索选手昵称" maxLength={50} />
        <IconButton type="submit" label="搜索"><Search /></IconButton>
      </form>
    </div>
    <div key={`${page}:${q}:${sort}:${loading}`} className="resource-enter">
      {loading || error || !data?.users.length ? <ResourceNotice skeleton="players" loading={loading} error={error} empty="未找到选手。" /> :
        <ul className="directory-list player-directory">{data.users.map(player => {
          const projects = player.events.map(code => eventNames.get(code) ?? code).join(' · ')
          return <li key={player.userNo}>
            <Link to={`/user/${player.userNo}`} className="directory-link player-link">
              {player.avatar ? <img className="avatar" src={player.avatar} alt="" width={42} height={42} loading="lazy" /> :
                <span className="avatar fallback" aria-hidden="true">{[...player.nickname][0]}</span>}
              <span className="player-summary">
                <strong title={player.nickname}>{player.nickname}</strong>
                <small className="player-meta">
                  <span>{player.wcaId || `#${player.userNo}`}</span>
                  <span>加入于 {day(player.createdAt)}</span>
                  <span>{player.recordCount} 条成绩 · {player.eventCount} 项</span>
                </small>
                <small className="player-events" title={projects || undefined}>{projects}</small>
              </span>
            </Link>
          </li>
        })}</ul>}
  const pageTitle = '选手'
  usePageTitle(pageTitle)
    </div>
    <Pagination page={page} more={Boolean(data?.more)} loading={loading} showPage={loading || Boolean(data?.users.length)} onPage={next => setFilter({ ...filter, page: next })} />
  </>
}
