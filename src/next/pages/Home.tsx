import { ListOrdered, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ActionLink, ResourceNotice } from '../components/Actions'
import { Button } from '../components/ui/button'
import { useResource, useSite } from '../site'

export default function Home() {
  const { events } = useSite()
  const { data: summary, error } = useResource<{ users: number; records: number; events: number }>('/summary')
  return <>
    <section className="home-intro">
      <div><h1>魔方成绩册</h1><div className="actions home-actions">
        <Button render={<Link to="/leaderboard" />}><ListOrdered aria-hidden="true" />榜单</Button>
        <ActionLink to="/submit" label="录入成绩"><Plus /></ActionLink>
      </div></div>
      {summary ? <dl className="summary-grid" aria-label="社区统计">
        <div><dt>成绩</dt><dd>{summary.records.toLocaleString()}</dd></div>
        <div><dt>选手</dt><dd>{summary.users.toLocaleString()}</dd></div>
        <div><dt>项目</dt><dd>{summary.events.toLocaleString()}</dd></div>
      </dl> : <ResourceNotice error={error} />}
    </section>
    <section className="section">
      <div className="section-head"><h2>项目榜单</h2><Link className="text-link" to="/events">全部项目</Link></div>
      <ul className="directory-list">{events.filter(event => event.category === 'official').slice(0, 8).map(event =>
        <li key={event.code}><Link className="directory-link" to={`/leaderboard?${new URLSearchParams({ event: event.code })}`}>
          <strong>{event.name}</strong><small>{event.code}</small>
        </Link></li>,
      )}</ul>
    </section>
  </>
}
