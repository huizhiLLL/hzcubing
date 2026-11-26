import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { CircleUserRound, Layers3, ListOrdered, Menu, Trophy, UsersRound, X } from 'lucide-react'
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { message, send } from './api'
import { IconButton, ResourceNotice } from './components/Actions'
import { Skeleton } from './components/Skeleton'
import { ThemeToggle } from './components/ThemeToggle'
import Home from './pages/Home'
import { useSite } from './site'

const SignedInAccount = lazy(() => import('./components/SignedInAccount'))
const Board = lazy(() => import('./pages/Board'))
const GroupRecords = lazy(() => import('./pages/GroupRecords'))
const Players = lazy(() => import('./pages/Players'))
const Player = lazy(() => import('./pages/Player'))
const Auth = lazy(() => import('./pages/Auth'))
const Submit = lazy(() => import('./pages/Submit'))
const Settings = lazy(() => import('./pages/Settings'))
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
  const [loggingOut, setLoggingOut] = useState(false)
  const [compactHeader, setCompactHeader] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const headerInner = useRef<HTMLDivElement>(null)
  const menuButton = useRef<HTMLButtonElement>(null)
  const navigationRef = useRef<HTMLElement>(null)
  const activeIndicator = useRef<HTMLSpanElement>(null)
  const navigate = useNavigate()
  const { pathname, key } = useLocation()
  const [introKey, setIntroKey] = useState(() => {
    const [entry] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
    return pathname === '/' && (!entry || entry.type === 'navigate') &&
      matchMedia('(prefers-reduced-motion: no-preference)').matches && 'registerProperty' in CSS ? key : null
  })
  const homeIntro = pathname === '/' && introKey === key
  const finishHomeIntro = useCallback(() => setIntroKey(null), [])
  useEffect(() => {
    window.scrollTo(0, 0)
    setMenuOpen(false)
  }, [pathname])
  useEffect(() => {
    if (!homeIntro) {
      setIntroKey(null)
      return
    }
    const preference = matchMedia('(prefers-reduced-motion: reduce)')
    const finish = () => { if (preference.matches) setIntroKey(null) }
    preference.addEventListener('change', finish)
    finish()
    return () => preference.removeEventListener('change', finish)
  }, [homeIntro])
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
    if (loggingOut) return
    setLoggingOut(true)
    setError('')
    try {
      await send('/auth/logout', 'POST')
      setSession(null)
      navigate('/')
    } catch (cause) { setError(message(cause)) }
    finally { setLoggingOut(false) }
  }
  const accountAvatar = session && (session.avatar
    ? <img className="avatar account-avatar" src={session.avatar} width={28} height={28} alt="" />
    : <span className="avatar fallback account-avatar">{[...session.nickname][0]}</span>)

  return <>
    <a className="skip" href="#main">跳到正文</a>
    <header className="site-header" data-compact={compactHeader || undefined} inert={homeIntro || undefined}><div className="header-inner" ref={headerInner}>
      <Link className="brand" to="/" onClick={() => setMenuOpen(false)}>
        <img src="/brand-wordmark.webp" alt="HZCubing 首页" width={360} height={123} />
      </Link>
      <nav id="site-navigation" className="site-navigation" ref={navigationRef} aria-label="站点导航" data-open={menuOpen || undefined}>
        <span className="nav-indicator" ref={activeIndicator} aria-hidden="true" />
        {navigation.map(({ to, label, Icon }) => <NavLink key={to} className="nav-link" to={to} onClick={() => setMenuOpen(false)}><Icon aria-hidden="true" />{label}</NavLink>)}
      </nav>
      <div className="header-actions">
        <ThemeToggle />
        {session ? <Suspense fallback={<IconButton className="account-trigger account-trigger--signed-in" label="正在加载账号菜单" disabled>{accountAvatar}</IconButton>}>
          <SignedInAccount avatar={accountAvatar} loggingOut={loggingOut} onOpen={() => setMenuOpen(false)} onLogout={() => void logout()} />
        </Suspense> : sessionReady ? <IconButton className="account-trigger" label="登录" render={<Link to="/auth" />}>
          <CircleUserRound />
        </IconButton> : <IconButton className="account-trigger" label="正在读取账号状态" disabled>
          <CircleUserRound />
        </IconButton>}
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
    <main id="main" className={pathname === '/' ? 'site-main site-main--home' : 'site-main'} tabIndex={-1}>
      <ResourceNotice error={error || initializationError} />
      <Suspense fallback={<Skeleton />}>
        <div className="route-content" key={pathname}>
          <Routes>
            <Route path="/" element={<Home intro={homeIntro} onIntroEnd={finishHomeIntro} />} />
            <Route path="/leaderboard" element={<Board />} />
            <Route path="/gr" element={<GroupRecords />} />
            <Route path="/gr/history" element={<Board historyMode />} />
            <Route path="/players" element={<Players />} />
            <Route path="/user/:userNo" element={<Player />} />
            <Route path="/profile/:userNo" element={<Player />} />
            <Route path="/profile" element={<Player personal />} />
            <Route path="/settings" element={<Settings />} />
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
