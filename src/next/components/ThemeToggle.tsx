import { useRef, useState, type MouseEvent } from 'react'
import { flushSync } from 'react-dom'
import { Moon, Sun } from 'lucide-react'
import { IconButton } from './Actions'

const root = document.documentElement

export function ThemeToggle() {
  const [dark, setDark] = useState(() => root.dataset.theme === 'dark')
  const transitioning = useRef(false)

  async function toggle(event: MouseEvent<HTMLButtonElement>) {
    if (transitioning.current) return
    const nextDark = !dark
    const theme = nextDark ? 'dark' : 'light'
    function applyTheme() {
      root.dataset.theme = theme
      setDark(nextDark)
      try { localStorage.setItem('hzcubing-theme', theme) } catch { /* Storage can be unavailable. */ }
    }
    if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      applyTheme()
      return
    }

    const button = event.currentTarget.getBoundingClientRect()
    const x = button.left + button.width / 2
    const y = button.top + button.height / 2
    const radius = Math.ceil(Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)))
    transitioning.current = true
    root.style.setProperty('--theme-center', `${x}px ${y}px`)
    root.style.setProperty('--theme-radius', `${radius}px`)
    root.dataset.themeReveal = ''
    try {
      await document.startViewTransition(() => flushSync(applyTheme)).finished
    } catch {
      applyTheme()
    } finally {
      delete root.dataset.themeReveal
      root.style.removeProperty('--theme-center')
      root.style.removeProperty('--theme-radius')
      transitioning.current = false
    }
  }

  return <IconButton type="button" label={dark ? '切换到浅色主题' : '切换到深色主题'} onClick={toggle}>
    {dark ? <Sun /> : <Moon />}
  </IconButton>
}
