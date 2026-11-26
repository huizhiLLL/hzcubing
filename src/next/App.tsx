import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { CircleUserRound, Layers3, ListOrdered, LogOut, Menu, Trophy, UsersRound, X } from 'lucide-react'
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { message, send } from './api'
import { ActionLink, IconButton, ResourceNotice } from './components/Actions'
import { Button } from './components/ui/button'
import { ThemeToggle } from './components/ThemeToggle'
import { useSite } from './site'

const Home = lazy(() => import('./pages/Home'))
const Board = lazy(() => import('./pages/Board'))
const GroupRecords = lazy(() => import('./pages/GroupRecords'))
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
  const [menuOpen, setMenuOpen] = useState(false)
  const headerInner = useRef<HTMLDivElement>(null)
  const menuButton = useRef<HTMLButtonElement>(null)
  const navigationRef = useRef<HTMLElement>(null)
  const activeIndicator = useRef<HTMLSpanElement>(null)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
    setMenuOpen(false)
  }, [pathname])
  useLayoutEffect(() => {
    const nav = navigationRef.current
    const indicator = activeIndicator.current
    if (!nav || !indicator) return

    const activeLink = nav.querySelector<HTMLElement>('[aria-current="page"]')
    if (!activeLink) {
      indicator.removeAttribute('data-visible')
      return
    }

    const syncIndicator = () => {
      indicator.style.translate = `${activeLink.offsetLeft}px ${activeLink.offsetTop}px`
      indicator.style.width = `${activeLink.offsetWidth}px`
      indicator.style.height = `${activeLink.offsetHeight}px`
      indicator.setAttribute('data-visible', '')
    }
    syncIndicator()
    const observer = new ResizeObserver(syncIndicator)
    observer.observe(nav)
    nav.querySelectorAll('.nav-link').forEach(link => observer.observe(link))
    return () => observer.disconnect()
  }, [pathname])
  useEffect(() => {
    if (!menuOpen) return

    function dismissOutside(event: PointerEvent) {
      if (event.target instanceof Node && !headerInner.current?.contains(event.target)) setMenuOpen(false)
    }
    function dismissWithEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setMenuOpen(false)
      menuButton.current?.focus()
    }
    const desktop = window.matchMedia('(width > 42rem)')
    function dismissOnDesktop(event: MediaQueryListEvent) {
      if (event.matches) setMenuOpen(false)
    }

    document.addEventListener('pointerdown', dismissOutside)
    document.addEventListener('keydown', dismissWithEscape)
    desktop.addEventListener('change', dismissOnDesktop)
    return () => {
      document.removeEventListener('pointerdown', dismissOutside)
      document.removeEventListener('keydown', dismissWithEscape)
      desktop.removeEventListener('change', dismissOnDesktop)
    }
  }, [menuOpen])
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
    <header className="site-header" data-compact={compactHeader || undefined}><div className="header-inner" ref={headerInner}>
      <Link className="brand" to="/" onClick={() => setMenuOpen(false)}>
        <img src="/brand-wordmark.webp" alt="HZCubing 首页" width={360} height={123} />
      </Link>
      <nav id="site-navigation" className="site-navigation" ref={navigationRef} aria-label="站点导航" data-open={menuOpen || undefined}>
        <span className="nav-indicator" ref={activeIndicator} aria-hidden="true" />
        {navigation.map(({ to, label, Icon }) => <NavLink key={to} className="nav-link" to={to} onClick={() => setMenuOpen(false)}><Icon aria-hidden="true" />{label}</NavLink>)}
      </nav>
      <div className="header-actions">
        <ThemeToggle />
        {session && <>
          <ActionLink to="/profile" label="我的主页"><CircleUserRound /></ActionLink>
          <IconButton label="退出登录" onClick={logout}><LogOut /></IconButton>
        </>}
        {sessionReady && !session && <Button variant="ghost" className="min-h-11 whitespace-nowrap" render={<Link to="/auth" />}>登录</Button>}
      </div>
      <IconButton
        ref={menuButton}
        className="menu-toggle"
        label={menuOpen ? '关闭导航' : '打开导航'}
        aria-expanded={menuOpen}
        aria-controls="site-navigation"
        type="button"
        onClick={event => {
          setMenuOpen(!menuOpen)
          if (!menuOpen && event.detail === 0) {
            requestAnimationFrame(() => navigationRef.current?.querySelector('a')?.focus())
          }
        }}
      >
        {menuOpen ? <X /> : <Menu />}
      </IconButton>
    </div></header>
    <main id="main" className="site-main" tabIndex={-1}>
      <ResourceNotice error={error || initializationError} />
      <Suspense fallback={<ResourceNotice loading />}>
        <div className="route-content" key={pathname}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/leaderboard" element={<Board />} />
            <Route path="/gr" element={<GroupRecords />} />
            <Route path="/gr/history" element={<Board historyMode />} />
            <Route path="/players" element={<Players />} />
            <Route path="/user/:userNo" element={<Player />} />
            <Route path="/profile/:userNo" element={<Player />} />
            <Route path="/profile" element={<Player personal />} />
            <Route path="/settings" element={<Player personal mode="settings" />} />
            <Route path="/submit/manage" element={<Player personal mode="manage" />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/submit" element={<Submit />} />
            <Route path="/events" element={<Events />} />
            <Route path="/admin/meme-events" element={<Events adminOnly />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Suspense>
    </main>
    <footer className="site-footer">hzcubing</footer>
  </>
}
