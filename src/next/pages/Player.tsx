import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { api, day, message, send, time, type Best, type Player, type RecordInfo } from '../api'
import { ActionLink, IconButton, Pagination, ResourceNotice } from '../components/Actions'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Textarea } from '../components/ui/textarea'
import { useResource, useSite } from '../site'

type Profile = { user: Player; records: RecordInfo[]; best: Best[]; more: boolean }

export default function PlayerPage() {
  const { userNo = '' } = useParams()
  return <ProfilePage key={userNo} userNo={userNo} />
}

function ProfilePage({ userNo }: { userNo: string }) {
  const { session, setSession, events } = useSite()
  const own = session?.userNo === Number(userNo)
  const [page, setPage] = useState(1)
  const [revision, setRevision] = useState(0)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [pending, setPending] = useState(false)
  const { data: profile, error: loadError, loading } = useResource<Profile>(`/players/${encodeURIComponent(userNo)}?page=${page}`, revision)
  const label = (code: string) => events.find(event => event.code === code)?.name ?? code
  async function action(run: () => Promise<unknown>, success: string) {
    setPending(true)
    setError('')
    setNotice('')
    try { await run(); setNotice(success); setRevision(value => value + 1) }
    catch (cause) { setError(message(cause)) }
    finally { setPending(false) }
  }
  if (!profile) return <ResourceNotice loading={loading} error={loadError} />
  const { user, best, records, more } = profile
  return <>
    <ResourceNotice error={error} />
    {notice && <p className="notice success" role="status">{notice}</p>}
    <header className="page-heading">
      <div className="player-heading">
        {user.avatar && <img className="avatar" src={user.avatar} width={48} height={48} alt="" />}
        <div><h1>{user.nickname}</h1><p>{user.wcaId || `#${user.userNo}`}</p></div>
      </div>
      {own && <ActionLink to="/submit" label="录入成绩"><Plus /></ActionLink>}
    </header>
    {user.bio && <p>{user.bio}</p>}
    <section className="section"><h2>个人最佳</h2>
      {best.length ? <Table><TableHeader><TableRow><TableHead scope="col">项目</TableHead><TableHead scope="col" className="numeric">单次</TableHead><TableHead scope="col" className="numeric">平均</TableHead></TableRow></TableHeader>
        <TableBody>{best.map(item => <TableRow key={item.event}>
          <TableCell>{label(item.event)}</TableCell><TableCell className="numeric">{time(item.singleSeconds)}</TableCell><TableCell className="numeric">{time(item.averageSeconds)}</TableCell>
        </TableRow>)}</TableBody>
      </Table> : <ResourceNotice empty="还没有个人最佳。" />}
    </section>
    <section className="section"><h2>成绩记录</h2>
      {records.length ? <Table><TableHeader><TableRow>
        <TableHead scope="col">项目</TableHead><TableHead scope="col" className="numeric">单次</TableHead><TableHead scope="col" className="numeric">平均</TableHead>
        <TableHead scope="col" className="date-col">日期</TableHead>{own && <TableHead scope="col">操作</TableHead>}
      </TableRow></TableHeader><TableBody>{records.map(item => <TableRow key={item.id}>
        <TableCell>{label(item.event)}</TableCell><TableCell className="numeric">{time(item.singleSeconds)}</TableCell><TableCell className="numeric">{time(item.averageSeconds)}</TableCell>
        <TableCell className="date-col">{day(item.timestamp)}</TableCell>
        {own && <TableCell><div className="record-actions">
          <ActionLink to={`/submit?${new URLSearchParams({ edit: item.id })}`} label="编辑成绩"><Pencil /></ActionLink>
          <IconButton className="danger-action" label="删除成绩" disabled={pending} onClick={() => {
            if (window.confirm('确定删除这条成绩？')) void action(() => send(`/records/${encodeURIComponent(item.id)}`, 'DELETE'), '成绩已删除')
          }}><Trash2 /></IconButton>
        </div></TableCell>}
      </TableRow>)}</TableBody></Table> : <ResourceNotice empty="暂无成绩。" />}
      <Pagination page={page} more={more} loading={loading} onPage={setPage} />
    </section>
    {own && session && <section className="section form-panel">
      <h2>个人资料</h2>
      <form key={revision} className="fields" onSubmit={event => {
        event.preventDefault()
        const values = new FormData(event.currentTarget)
        void action(() => send('/profile', 'PATCH', Object.fromEntries(['nickname', 'wcaId', 'bio'].map(key => [key, String(values.get(key) ?? '').trim()]))), '资料已保存')
      }}>
        <label>昵称<Input name="nickname" defaultValue={user.nickname} maxLength={50} required /></label>
        <label>WCA ID<Input name="wcaId" defaultValue={user.wcaId} maxLength={20} /></label>
        <label>简介<Textarea name="bio" defaultValue={user.bio} maxLength={500} rows={3} /></label>
        <Button type="submit" variant="outline" loading={pending}>保存资料</Button>
      </form>
      <label className="standalone">更新头像<Input type="file" accept="image/png,image/jpeg,image/gif,image/webp,image/avif" disabled={pending} onChange={event => {
        const file = event.target.files?.[0]
        if (file) void action(() => api('/profile/avatar', { method: 'PUT', body: file }), '头像已更新')
      }} /></label>
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
