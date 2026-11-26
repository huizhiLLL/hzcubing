import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { day, prefetchResource, type Player } from '../api'
import { Pagination, ResourceNotice } from '../components/Actions'
import { Skeleton } from '../components/Skeleton'
import { Input } from '../components/ui/input'
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from '../components/ui/select'
import { usePageTitle, useResource, useSite } from '../site'

const maxPageSize = 60
const sortOptions = [
  { label: '最新', value: 'latest' },
  { label: '成绩最多', value: 'mostRecords' },
  { label: '项目最多', value: 'mostEvents' },
]
type ListedPlayer = Player & { createdAt: number; recordCount: number; eventCount: number; events: string[] }

function playersPath(page: number, pageSize: number, q: string, sort: string) {
  return `/players?${new URLSearchParams({ page: String(page), pageSize: String(pageSize), q, sort })}`
}

function PlayerProjects({ projects, codes }: { projects: string[]; codes: string[] }) {
  const listRef = useRef<HTMLElement>(null)
  const moreRef = useRef<HTMLSpanElement>(null)
  const [visibleCount, setVisibleCount] = useState(projects.length)

  useLayoutEffect(() => {
    const list = listRef.current
    const more = moreRef.current
    if (!list || !more) return
    const labels = Array.from(list.querySelectorAll<HTMLElement>('.player-event'))

    function measure() {
      if (!list || !more) return
      const firstHidden = labels.findIndex(label => label.offsetTop + label.offsetHeight > list.clientHeight)
      if (firstHidden === -1) {
        setVisibleCount(labels.length)
        return
      }

      // Reserve room for the overflow count at the end of the second line.
      const gap = parseFloat(getComputedStyle(list).columnGap)
      let count = firstHidden
      while (count > 0) {
        const last = labels[count - 1]
        if (last.offsetTop === labels[0].offsetTop || last.offsetLeft + last.offsetWidth + gap <= more.offsetLeft) break
        count--
      }
      setVisibleCount(count)
    }

    const observer = new ResizeObserver(measure)
    observer.observe(list)
    labels.forEach(label => observer.observe(label))
    measure()
    return () => observer.disconnect()
  }, [projects])

  const remaining = projects.length - visibleCount
  return <small className="player-events" ref={listRef} title={projects.join(' · ')}>
    {projects.map((project, index) => <span className="player-event" key={codes[index]}
      data-overflow={index >= visibleCount || undefined}>{project}</span>)}
    <span className="player-event-more" ref={moreRef} data-overflow={remaining === 0 || undefined}>
      <span aria-hidden="true">+{remaining}</span><span className="sr-only">另有 {remaining} 个项目</span>
    </span>
  </small>
}

export default function Players() {
  const { events } = useSite()
  const pageTitle = '选手'
  usePageTitle(pageTitle)
  const eventNames = new Map(events.map(event => [event.code, event.name]))
  const [filter, setFilter] = useState({ offset: 0, q: '', sort: 'latest' })
  const [pageSize, setPageSize] = useState(0)
  const composing = useRef(false)
  const resultsRef = useRef<HTMLDivElement>(null)
  const rowRef = useRef<HTMLDivElement>(null)
  const pagerRef = useRef<HTMLDivElement>(null)
  const { offset, q, sort } = filter
  const page = pageSize ? Math.floor(offset / pageSize) + 1 : 1
  const path = pageSize ? playersPath(page, pageSize, q, sort) : null
  const { data, loading: fetching, error } = useResource<{ users: ListedPlayer[]; total: number; more: boolean }>(path, 0, true)
  const loading = !pageSize || fetching
  const totalPages = data ? Math.min(1000, Math.ceil(data.total / pageSize)) : null

  function search(value: string) {
    const query = value.trim()
    setFilter(current => current.q === query ? current : { ...current, offset: 0, q: query })
  }

  useLayoutEffect(() => {
    const results = resultsRef.current
    const row = rowRef.current
    const pager = pagerRef.current
    const main = results?.closest('main')
    const footer = document.querySelector('.site-footer')
    if (!results || !row || !pager || !main) return

    const measure = () => {
      const columns = Number(getComputedStyle(results).getPropertyValue('--players-columns'))
      const rowHeight = row.getBoundingClientRect().height
      if (!columns || !rowHeight) return
      const top = results.getBoundingClientRect().top + window.scrollY
      const padding = parseFloat(getComputedStyle(main).paddingBottom)
      const footerHeight = footer?.getBoundingClientRect().height ?? 0
      const availableHeight = window.innerHeight - top - padding - footerHeight - pager.offsetHeight
      const rows = Math.max(1, Math.floor(availableHeight / rowHeight))
      setPageSize(Math.min(maxPageSize, rows * columns))
    }

    let timer: number
    const scheduleMeasure = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(measure, 120)
    }
    measure()
    const observer = new ResizeObserver(scheduleMeasure)
    observer.observe(row)
    if (results.previousElementSibling) observer.observe(results.previousElementSibling)
    if (footer) observer.observe(footer)
    window.addEventListener('resize', scheduleMeasure)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('resize', scheduleMeasure)
      observer.disconnect()
    }
  }, [])
  useEffect(() => {
    if (!data) return
    if (data.more) prefetchResource(playersPath(page + 1, pageSize, q, sort))
    if (page === 1 && !q) {
      for (const option of sortOptions) {
        if (option.value !== sort) prefetchResource(playersPath(1, pageSize, '', option.value))
      }
    }
  }, [data, page, pageSize, q, sort])
  return <div className="players-page">
    <header className="page-heading"><h1>{pageTitle}</h1></header>
    <div className="toolbar board-toolbar players-toolbar">
      <Select items={sortOptions} value={sort} onValueChange={value => value && setFilter({ ...filter, offset: 0, sort: value })}>
        <SelectTrigger aria-label="排序方式"><SelectValue /></SelectTrigger>
        <SelectPopup alignItemWithTrigger={false}>{sortOptions.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectPopup>
      </Select>
      <form className="player-search" role="search" onSubmit={event => event.preventDefault()}>
        <Search aria-hidden="true" />
        <Input unstyled nativeInput name="query" aria-label="搜索选手昵称或 WCA ID" type="search" placeholder="搜索选手昵称" maxLength={50}
          onCompositionStart={() => { composing.current = true }}
          onCompositionEnd={event => {
            composing.current = false
            search(event.currentTarget.value)
          }}
          onChange={event => {
            if (!composing.current && !('isComposing' in event.nativeEvent && event.nativeEvent.isComposing)) {
              search(event.currentTarget.value)
            }
          }} />
      </form>
    </div>
    <div className="players-results" ref={resultsRef}>
      <div className="players-row-measure" ref={rowRef} aria-hidden="true" />
      <div key={`${page}:${pageSize}:${q}:${sort}:${loading}`} className="resource-enter">
        {loading ? <Skeleton kind="players" count={pageSize || 12} /> :
          error || !data?.users.length ? <ResourceNotice error={error} empty="未找到选手。" /> :
          <ul className="directory-list player-directory">{data.users.map(player => {
            const projectLabels = player.events.map(code => eventNames.get(code) ?? code)
            return <li key={player.userNo}>
              <Link to={`/user/${player.userNo}`} className="directory-link player-link">
                {player.avatar ? <img className="avatar" src={player.avatar} alt="" width={42} height={42} loading="lazy" /> :
                  <span className="avatar fallback" aria-hidden="true">{[...player.nickname][0]}</span>}
                <span className="player-summary">
                  <span className="player-identity">
                    <strong title={player.nickname}>{player.nickname}</strong>
                    {player.wcaId && <small className="player-id">{player.wcaId}</small>}
                  </span>
                  <small className="player-stats">
                    <span><b>{player.recordCount}</b> 成绩</span>
                    <span><b>{player.eventCount}</b> 项</span>
                  </small>
                  <small className="player-joined">{day(player.createdAt)}</small>
                  {projectLabels.length > 0 && <PlayerProjects projects={projectLabels} codes={player.events} />}
                </span>
              </Link>
            </li>
          })}</ul>}
      </div>
    </div>
    <div className="players-pager" ref={pagerRef}>
      <Pagination page={page} totalPages={totalPages} more={Boolean(data?.more)} loading={loading} showPage={loading || Boolean(data?.users.length)}
        onPage={next => setFilter({ ...filter, offset: (next - 1) * pageSize })} />
    </div>
  </div>
}
