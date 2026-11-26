import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { categories, day, message, send, time, type Best, type Player, type RecordInfo } from '../api'
import { ActionLink, IconButton, Pagination, ResourceNotice } from '../components/Actions'
import { SegmentedControl } from '../components/SegmentedControl'
import { Button } from '../components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { usePageTitle, useResource, useSite } from '../site'

type Profile = {
  user: Player & { createdAt: number }; records: RecordInfo[]; best: Best[]; more: boolean
}
type ProfileMode = 'public' | 'manage'
const titles = { public: '选手主页', manage: '管理成绩' }
const categoryOptions = [{ value: '', label: '全部' }, ...Object.entries(categories).map(([value, label]) => ({ value, label }))]

export default function PlayerPage({ mode = 'public', personal = false }: { mode?: ProfileMode; personal?: boolean }) {
  const { userNo } = useParams()
  const { session, sessionReady } = useSite()
  const location = useLocation()
  const target = personal ? session?.userNo.toString() : userNo
  usePageTitle(personal && !target ? titles[mode] : undefined)
  if (personal && !target) return sessionReady
    ? <Link to={`/auth?${new URLSearchParams({ next: location.pathname })}`}>请先登录</Link>
    : <ResourceNotice loading />
  return <ProfilePage key={`${mode}-${target}`} userNo={target ?? ''} mode={mode} />
}

function ProfilePage({ userNo, mode }: { userNo: string; mode: ProfileMode }) {
  const { session, events } = useSite()
  const own = session?.userNo === Number(userNo)
  const [page, setPage] = useState(1)
  const [category, setCategory] = useState('')
  const [revision, setRevision] = useState(0)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [pending, setPending] = useState(false)
  const { data: profile, error: loadError, loading } = useResource<Profile>(`/players/${encodeURIComponent(userNo)}?${new URLSearchParams({ page: String(page), category })}`, revision)
  usePageTitle(mode === 'public' ? profile?.user.nickname || titles.public : titles[mode])
  const label = (code: string) => events.find(event => event.code === code)?.name ?? code
  async function action(run: () => Promise<unknown>, success: string) {
    setPending(true)
    setError('')
    setNotice('')
    try { await run(); setNotice(success); setRevision(value => value + 1) }
    catch (cause) { setError(message(cause)) }
    finally { setPending(false) }
  }
  if (!profile && mode !== 'manage') return <ResourceNotice loading={loading} error={loadError} skeleton="page" />
  const { user, best = [], records = [], more = false } = profile ?? {}
  return <>
    <ResourceNotice error={error} />
    {notice && <p className="notice success" role="status">{notice}</p>}
    {mode === 'public' && user ? <header className="player-profile-header">
      <div className="player-heading">
        {user.avatar ? <img className="avatar" src={user.avatar} width={72} height={72} alt="" /> :
          <span className="avatar fallback" aria-hidden="true">{[...user.nickname][0]}</span>}
        <div className="player-profile-details">
          <h1>{user.nickname}</h1>
          <p className="player-profile-meta">
            <span className="player-profile-number">#{user.userNo}</span>
            {user.wcaId && <span>{user.wcaId}</span>}
            <span>加入于 {day(user.createdAt)}</span>
          </p>
          {user.bio && <p className="player-profile-bio">{user.bio}</p>}
        </div>
      </div>
      {own && <ActionLink to="/settings" label="编辑资料"><Pencil /></ActionLink>}
    </header> : <header className="page-heading">
      <h1>{titles[mode]}</h1>
      <Button variant="outline" render={<Link to="/submit" />}>返回提交</Button>
    </header>}
    {mode === 'public' && <section className="section"><h2>个人最佳</h2>
      {!best.length && <ResourceNotice empty="还没有个人最佳。" />}
      {[false, true].map(score => {
        const rows = best.filter(item => (events.find(event => event.code === item.event)?.category === 'score') === score)
        return rows.length > 0 && <div key={String(score)}><h3>{score ? '积分' : '计时'}</h3><Table><TableHeader><TableRow>
          <TableHead scope="col">项目</TableHead>{score ? <TableHead scope="col" column="time">成绩</TableHead> : <><TableHead scope="col" column="time">单次</TableHead><TableHead scope="col" column="time">平均</TableHead></>}
        </TableRow></TableHeader><TableBody>{rows.map(item => <TableRow key={item.event}>
          <TableCell>{label(item.event)}</TableCell>{score ? <TableCell column="time">{item.score}</TableCell> : <><TableCell column="time">{time(item.singleSeconds)}</TableCell><TableCell column="time">{time(item.averageSeconds)}</TableCell></>}
        </TableRow>)}</TableBody></Table></div>
      })}
    </section>}
    {mode === 'manage' && <section className="section">
      <div className="toolbar">
        <SegmentedControl label="项目类型" options={categoryOptions} value={category} onValueChange={next => {
          setCategory(next)
          setPage(1)
        }} />
      </div>
      <div key={`${category}:${page}:${loading}`} className="resource-enter">
        {records.length ? [false, true].map(score => {
          const rows = records.filter(item => (events.find(event => event.code === item.event)?.category === 'score') === score)
          return rows.length > 0 && <div key={String(score)}>{score && <h3>积分</h3>}<Table><TableHeader><TableRow>
            <TableHead scope="col">项目</TableHead>{score ? <TableHead scope="col" column="time">成绩</TableHead> : <><TableHead scope="col" column="time">单次</TableHead><TableHead scope="col" column="time">平均</TableHead></>}
            <TableHead scope="col" column="date">日期</TableHead><TableHead scope="col">操作</TableHead>
          </TableRow></TableHeader><TableBody>{rows.map(item => <TableRow key={item.id}>
            <TableCell>{label(item.event)}</TableCell>{score ? <TableCell column="time">{item.score}</TableCell> : <><TableCell column="time">{time(item.singleSeconds)}</TableCell><TableCell column="time">{time(item.averageSeconds)}</TableCell></>}
            <TableCell column="date">{day(item.timestamp)}</TableCell><TableCell><div className="record-actions">
              <ActionLink to={`/submit?${new URLSearchParams({ edit: item.id })}`} label="编辑成绩"><Pencil /></ActionLink>
              <IconButton className="danger-action" label="删除成绩" disabled={pending} onClick={() => {
                if (window.confirm('确定删除这条成绩？')) void action(() => send(`/records/${encodeURIComponent(item.id)}`, 'DELETE'), '成绩已删除')
              }}><Trash2 /></IconButton>
            </div></TableCell>
          </TableRow>)}</TableBody></Table></div>
        }) : <ResourceNotice loading={loading} error={loadError} empty="暂无成绩。" skeleton="table" />}

      </div>
      <Pagination page={page} more={more} loading={loading} onPage={setPage} />
    </section>}
  </>
}
