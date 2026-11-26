import { Link } from 'react-router-dom'
import { ResourceNotice } from '../components/Actions'
import { categories } from '../api'
import { Button } from '../components/ui/button'
import { useResource, useSite } from '../site'

export default function Home() {
  const { events, eventsLoading } = useSite()
  const { data: summary, error, loading } = useResource<{ users: number; records: number }>('/summary')
  return <>
    <section className="home-intro">
      <div>
        <h1>我来到，我看见<br />我记录<span className="home-subtitle">Veni, Vidi, Vici</span></h1>
        <p>「知识即为力量，记录即是见证」</p>
        <div className="actions home-actions">
          <Button className="border-(--brand) bg-(--brand) text-(--brand-on) shadow-(color:--brand)/24 hover:bg-(--brand)/90" render={<Link to="/leaderboard" />}>查看榜单</Button>
          <Button variant="outline" render={<Link to="/submit" />}>提交成绩</Button>
        </div>
      </div>
      {summary ? <dl className="summary-grid" aria-label="社区统计">
        <div><dt>总成绩数</dt><dd>{summary.records.toLocaleString()}</dd></div>
        <div><dt>活跃用户</dt><dd>{summary.users.toLocaleString()}</dd></div>
      </dl> : <ResourceNotice skeleton="summary" loading={loading} error={error} />}
    </section>
    <section className="section home-projects">
      <h2>探索项目</h2>
      {eventsLoading ? <ResourceNotice loading skeleton="directory" /> : Object.entries(categories).filter(([category]) => category !== 'historical').map(([category, name]) => {
        const items = events.filter(event => event.category === category && event.active)
        return items.length > 0 && <section className="project-group" key={category}>
          <h3>{name}项目<small>{items.length} 项</small></h3>
          <ul className="directory-list">{items.map(event => <li key={event.code}>
            <Link className="directory-link" to={`/leaderboard?${new URLSearchParams({ event: event.code })}`}><strong>{event.name}</strong></Link>
          </li>)}</ul>
        </section>
      })}
    </section>
  </>
}
