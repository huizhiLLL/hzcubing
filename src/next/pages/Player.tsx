import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { api, categories, day, message, send, time, type Best, type Player, type RecordInfo } from '../api'
import { ActionLink, IconButton, Pagination, ResourceNotice } from '../components/Actions'
import { SegmentedControl } from '../components/SegmentedControl'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Textarea } from '../components/ui/textarea'
import { useResource, useSite } from '../site'

type Profile = {
  user: Player & { createdAt: number }; records: RecordInfo[]; best: Best[]; more: boolean
  createdProjects: { code: string; name: string; active: boolean }[]
}
type ProfileMode = 'public' | 'settings' | 'manage'
const categoryOptions = [{ value: '', label: '全部' }, ...Object.entries(categories).map(([value, label]) => ({ value, label }))]

export default function PlayerPage({ mode = 'public', personal = false }: { mode?: ProfileMode; personal?: boolean }) {
  const { userNo } = useParams()
  const { session, sessionReady } = useSite()
  const location = useLocation()
  const target = personal ? session?.userNo.toString() : userNo
  if (personal && !target) return sessionReady
    ? <Link to={`/auth?${new URLSearchParams({ next: location.pathname })}`}>请先登录</Link>
    : <ResourceNotice loading />
  return <ProfilePage key={`${mode}-${target}`} userNo={target ?? ''} mode={mode} />
}

function ProfilePage({ userNo, mode }: { userNo: string; mode: ProfileMode }) {
  const { session, setSession, events } = useSite()
  const own = session?.userNo === Number(userNo)
  const [page, setPage] = useState(1)
  const [category, setCategory] = useState('')
  const [revision, setRevision] = useState(0)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [pending, setPending] = useState(false)
  const { data: profile, error: loadError, loading } = useResource<Profile>(`/players/${encodeURIComponent(userNo)}?${new URLSearchParams({ page: String(page), category })}`, revision)
  const label = (code: string) => events.find(event => event.code === code)?.name ?? code
  async function action(run: () => Promise<unknown>, success: string) {
    setPending(true)
    setError('')
    setNotice('')
    try { await run(); setNotice(success); setRevision(value => value + 1) }
    catch (cause) { setError(message(cause)) }
    finally { setPending(false) }
  }
  if (!profile && mode !== 'manage') return <ResourceNotice loading={loading} error={loadError} skeleton={mode === 'settings' ? 'form' : 'page'} />
  const { user, best = [], records = [], more = false, createdProjects = [] } = profile ?? {}
  return <>
    <ResourceNotice error={error} />
    {notice && <p className="notice success" role="status">{notice}</p>}
    {mode === 'public' && user ? <header className="page-heading">
      <div className="player-heading">
        {user.avatar && <img className="avatar" src={user.avatar} width={48} height={48} alt="" />}
        <div><h1>{user.nickname}</h1><p>{user.wcaId || `#${user.userNo}`} · 加入于 {day(user.createdAt)}</p></div>
      </div>
      {own && <div className="actions">
        <Button variant="outline" render={<Link to="/settings" />}>编辑资料</Button>
        <ActionLink to="/submit" label="提交成绩"><Plus /></ActionLink>
      </div>}
    </header> : <header className="page-heading">
      <h1>{mode === 'settings' ? '编辑资料' : '管理成绩'}</h1>
      <Button variant="outline" render={<Link to={mode === 'settings' ? '/profile' : '/submit'} />}>
        {mode === 'settings' ? '返回个人主页' : '返回提交'}
      </Button>
    </header>}
    {mode === 'public' && user?.bio && <p>{user.bio}</p>}
    {mode === 'public' && <section className="section"><h2>个人最佳</h2>
      {best.length ? <Table><TableHeader><TableRow><TableHead scope="col">项目</TableHead><TableHead scope="col" column="time">单次</TableHead><TableHead scope="col" column="time">平均</TableHead></TableRow></TableHeader>
        <TableBody>{best.map(item => <TableRow key={item.event}>
          <TableCell>{label(item.event)}</TableCell><TableCell column="time">{time(item.singleSeconds)}</TableCell><TableCell column="time">{time(item.averageSeconds)}</TableCell>
        </TableRow>)}</TableBody>
      </Table> : <ResourceNotice empty="还没有个人最佳。" />}
    </section>}
    {mode !== 'settings' && <section className="section">
      {mode === 'public' && <div className="section-head"><h2>最近提交</h2>
        {own && <Button variant="outline" render={<Link to="/submit/manage" />}>管理成绩</Button>}
      </div>}
      {mode === 'manage' && <div className="toolbar">
        <SegmentedControl label="项目类型" options={categoryOptions} value={category} onValueChange={next => {
          setCategory(next)
          setPage(1)
        }} />
      </div>}
      <div key={`${category}:${page}:${loading}`} className="resource-enter">
        {records.length ? <Table><TableHeader><TableRow>
          <TableHead scope="col">项目</TableHead><TableHead scope="col" column="time">单次</TableHead><TableHead scope="col" column="time">平均</TableHead>
          <TableHead scope="col" column="date">日期</TableHead>{mode === 'manage' && <TableHead scope="col">操作</TableHead>}
        </TableRow></TableHeader><TableBody>{(mode === 'public' ? records.slice(0, 6) : records).map(item => <TableRow key={item.id}>
          <TableCell>{label(item.event)}</TableCell><TableCell column="time">{time(item.singleSeconds)}</TableCell><TableCell column="time">{time(item.averageSeconds)}</TableCell>
          <TableCell column="date">{day(item.timestamp)}</TableCell>
          {mode === 'manage' && <TableCell><div className="record-actions">
            <ActionLink to={`/submit?${new URLSearchParams({ edit: item.id })}`} label="编辑成绩"><Pencil /></ActionLink>
            <IconButton className="danger-action" label="删除成绩" disabled={pending} onClick={() => {
              if (window.confirm('确定删除这条成绩？')) void action(() => send(`/records/${encodeURIComponent(item.id)}`, 'DELETE'), '成绩已删除')
            }}><Trash2 /></IconButton>
          </div></TableCell>}
        </TableRow>)}</TableBody></Table> : <ResourceNotice loading={loading} error={loadError} empty="暂无成绩。" skeleton="table" />}
      </div>
      {mode === 'manage' && <Pagination page={page} more={more} loading={loading} onPage={setPage} />}
    </section>}
    {mode === 'public' && createdProjects.length > 0 && <section className="section">
      <h2>创建的整活项目</h2>
      <ul className="directory-list">{createdProjects.map(project => <li key={project.code}>
        <Link className="directory-link" to={`/leaderboard?${new URLSearchParams({ event: project.code })}`}>
          <strong>{project.name}</strong><small>{project.active ? '启用中' : '已停用'}</small>
        </Link>
      </li>)}</ul>
    </section>}
    {mode === 'settings' && session && user && <section className="section form-panel">
      <form key={revision} className="fields" onSubmit={event => {
        event.preventDefault()
        const values = new FormData(event.currentTarget)
        void action(() => send('/profile', 'PATCH', Object.fromEntries(['nickname', 'wcaId', 'bio'].map(key => [key, String(values.get(key) ?? '').trim()]))), '资料已保存')
      }}>
        <label>邮箱<Input type="email" value={session.email} readOnly /></label>
        <label>昵称<Input name="nickname" defaultValue={user.nickname} maxLength={50} required /></label>
        <label>WCA ID<Input name="wcaId" defaultValue={user.wcaId} maxLength={20} /></label>
        <label>简介<Textarea name="bio" defaultValue={user.bio} maxLength={500} rows={3} /></label>
        <Button type="submit" variant="outline" loading={pending}>保存修改</Button>
      </form>
      <div className="standalone avatar-settings">
        {user.avatar && <img className="avatar" src={user.avatar} alt="当前头像" width={42} height={42} />}
        <label className="standalone">头像<Input type="file" accept="image/png,image/jpeg,image/gif,image/webp,image/avif" disabled={pending} onChange={event => {
        const file = event.target.files?.[0]
        if (file) void action(() => api('/profile/avatar', { method: 'PUT', body: file }), '头像已更新')
        }} /></label>
        {user.avatar && <Button variant="outline" disabled={pending} onClick={() => {
          if (window.confirm('确定移除当前头像？')) void action(() => send('/profile/avatar', 'DELETE'), '头像已移除')
        }}>移除头像</Button>}
      </div>
      {session.qqBound ? <p className="standalone">已绑定 QQ</p> : <form className="fields standalone" onSubmit={event => {
        event.preventDefault()
        const qqId = String(new FormData(event.currentTarget).get('qq') ?? '').trim()
        void action(async () => { await send('/profile/qq', 'POST', { qqId }); setSession({ ...session, qqBound: true }) }, 'QQ 已绑定')
      }}>
        <label>QQ 号码<Input name="qq" inputMode="numeric" minLength={5} maxLength={15} required /></label>
        <Button type="submit" variant="outline" loading={pending}>绑定 QQ</Button>
      </form>}
    </section>}
  </>
}
