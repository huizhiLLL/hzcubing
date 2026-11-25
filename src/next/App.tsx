import { lazy, Suspense, useEffect, useState } from 'react'
import { CircleUserRound, Layers3, ListOrdered, LogIn, LogOut, Plus, Trophy, UsersRound } from 'lucide-react'
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { message, send } from './api'
import { ActionLink, IconButton, ResourceNotice } from './components/Actions'
import { useSite } from './site'

const Home = lazy(() => import('./pages/Home'))
const Board = lazy(() => import('./pages/Board'))
const Players = lazy(() => import('./pages/Players'))
const Player = lazy(() => import('./pages/Player'))
const Auth = lazy(() => import('./pages/Auth'))
const Submit = lazy(() => import('./pages/Submit'))
const Events = lazy(() => import('./pages/Events'))
const navigation = [
  { to: '/leaderboard', label: '榜单', Icon: ListOrdered },
  { to: '/gr', label: '群纪录', Icon: Trophy },
  { to: '/players', label: '选手', Icon: UsersRound },
  { to: '/events', label: '项目', Icon: Layers3 },
]

export default function App() {
  const { session, sessionReady, setSession, initializationError } = useSite()
  const [error, setError] = useState('')
  const [compactHeader, setCompactHeader] = useState(false)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  useEffect(() => {
    const syncHeader = () => {
      const scrollTop = window.scrollY
      setCompactHeader(compact => scrollTop > (compact ? 4 : 16))
    }
    window.addEventListener('scroll', syncHeader, { passive: true })
    syncHeader()
    return () => window.removeEventListener('scroll', syncHeader)
  }, [])
  async function logout() {
    try { await send('/auth/logout', 'POST'); setSession(null); navigate('/') }
    catch (cause) { setError(message(cause)) }
  }
  return <>
    <a className="skip" href="#main">跳到正文</a>
    <header className="site-header" data-compact={compactHeader || undefined}><div className="header-inner">
      <Link className="brand" to="/"><img src="/logo.png" alt="" width={36} height={36} />HZCubing</Link>
      <nav aria-label="站点导航">
        {navigation.map(({ to, label, Icon }) => <NavLink key={to} className="nav-link" to={to}><Icon aria-hidden="true" />{label}</NavLink>)}
      </nav>
      <div className="header-actions">
        {session && <>
          <ActionLink to={`/user/${session.userNo}`} label="我的主页"><CircleUserRound /></ActionLink>
          <IconButton label="退出登录" onClick={logout}><LogOut /></IconButton>
        </>}
        {sessionReady && !session && <ActionLink to="/auth" label="登录"><LogIn /></ActionLink>}
      </div>
    </div></header>
    <main id="main" className="site-main" tabIndex={-1}>
      <ResourceNotice error={error || initializationError} />
      <Suspense fallback={<ResourceNotice loading />}><Routes>
        <Route path="/" element={<Home />} />
        <Route path="/leaderboard" element={<Board />} />
        <Route path="/gr" element={<Board historyMode />} />
        <Route path="/players" element={<Players />} />
        <Route path="/user/:userNo" element={<Player />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/submit" element={<Submit />} />
        <Route path="/events" element={<Events />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes></Suspense>
    </main>
    <footer className="site-footer"><span>HZCubing</span><ActionLink to="/submit" label="录入成绩"><Plus /></ActionLink></footer>
  </>
}
