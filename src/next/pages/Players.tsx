import { useState } from 'react'
import { Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Player } from '../api'
import { IconButton, Pagination, ResourceNotice } from '../components/Actions'
import { Input } from '../components/ui/input'
import { useResource } from '../site'

export default function Players() {
  const [filter, setFilter] = useState({ page: 1, q: '' })
  const { page, q } = filter
  const { data, loading, error } = useResource<{ users: Player[]; more: boolean }>(`/players?${new URLSearchParams({ page: String(page), q })}`)
  return <>
    <header className="page-heading"><h1>选手</h1></header>
    <form className="search toolbar" role="search" onSubmit={submit => {
      submit.preventDefault()
      setFilter({ page: 1, q: String(new FormData(submit.currentTarget).get('query') || '').trim() })
    }}>
      <Input name="query" aria-label="昵称或 WCA ID" type="search" placeholder="昵称或 WCA ID" maxLength={50} />
      <IconButton type="submit" label="搜索"><Search /></IconButton>
    </form>
    {loading || error || !data?.users.length ? <ResourceNotice loading={loading} error={error} empty="未找到选手。" /> :
      <ul className="directory-list">{data.users.map(player => <li key={player.userNo}>
        <Link to={`/user/${player.userNo}`} className="directory-link player-link">
          {player.avatar ? <img className="avatar" src={player.avatar} alt="" width={42} height={42} loading="lazy" /> :
            <span className="avatar fallback" aria-hidden="true">{[...player.nickname][0]}</span>}
          <span><strong>{player.nickname}</strong><small>{player.wcaId || `#${player.userNo}`}</small></span>
        </Link>
      </li>)}</ul>}
    <Pagination page={page} more={Boolean(data?.more)} loading={loading} onPage={next => setFilter({ page: next, q })} />
  </>
}
