import { Pause, Play } from 'lucide-react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { EventInfo } from '../api'
import { IconButton } from '../components/Actions'
import { useSite } from '../site'

type Point = { x: number; y: number; z: number }
type Orientation = Point & { w: number }
type Drag = { id: number; x: number; y: number; time: number; speedX: number; speedY: number; moved: boolean }

const turn = 2 * Math.PI
const goldenAngle = Math.PI * (3 - Math.sqrt(5))
const tilt = Math.PI / 10
const initialOrientation = { x: 0, y: 0, z: Math.sin(tilt / 2), w: Math.cos(tilt / 2) }
const flingDamping = 1.8
const minimumSpin = 0.035
const maximumSpin = 6

function rotate(orientation: Orientation, x: number, y: number, local = false): Orientation {
  const angle = Math.hypot(x, y)
  if (!angle) return orientation
  const factor = Math.sin(angle / 2) / angle
  const step = { x: x * factor, y: y * factor, z: 0, w: Math.cos(angle / 2) }
  const [a, b] = local ? [orientation, step] : [step, orientation]
  const next = {
    x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
    z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
  }
  const length = Math.hypot(next.x, next.y, next.z, next.w)
  return { x: next.x / length, y: next.y / length, z: next.z / length, w: next.w / length }
}
const cameraDistance = 3.2
const silhouette = Math.sqrt(1 - 1 / cameraDistance ** 2)

function spherePoint(latitude: number, longitude: number): Point {
  const radius = Math.cos(latitude)
  return { x: radius * Math.cos(longitude), y: Math.sin(latitude), z: radius * Math.sin(longitude) }
}

const gridSegments = 48
const globeGrid = [
  ...[-Math.PI / 6, 0, Math.PI / 6].map(latitude =>
    Array.from({ length: gridSegments + 1 }, (_, index) => spherePoint(latitude, turn * index / gridSegments))),
  ...Array.from({ length: 4 }, (_, meridian) =>
    Array.from({ length: gridSegments + 1 }, (_, index) => spherePoint(Math.PI * (index / gridSegments - 0.5), turn * meridian / 4))),
]

function distributeProjects(events: EventInfo[]) {
  const shuffled = [...events]
  for (let index = shuffled.length - 1; index > 0; index--) {
    const other = Math.floor(Math.random() * (index + 1))
    const project = shuffled[index]
    shuffled[index] = shuffled[other]
    shuffled[other] = project
  }
  // Uniform latitude bands and a golden-angle step keep points apart near the poles.
  return shuffled.map((project, index) => {
    const latitude = Math.asin(1 - 2 * (index + 0.5) / shuffled.length)
    return { project, point: spherePoint(latitude, index * goldenAngle), latitudeRadius: Math.cos(latitude) }
  })
}

export default function Home({ intro, onIntroEnd }: { intro: boolean; onIntroEnd: () => void }) {
  const { events } = useSite()
  const projects = useMemo(() => distributeProjects(events), [events])
  const logoRef = useRef<HTMLHeadingElement>(null)
  const logoImageRef = useRef<HTMLImageElement>(null)
  const revealRef = useRef<HTMLDivElement>(null)
  const sphereRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLCanvasElement>(null)
  const orbitRef = useRef<HTMLUListElement>(null)
  const rotation = useRef({ orientation: initialOrientation, elapsed: 0 })
  const [paused, setPaused] = useState(false)
  const [logoReady, setLogoReady] = useState(false)

  useEffect(() => {
    const image = logoImageRef.current
    if (!intro || !image) return

    let active = true
    const timeout = window.setTimeout(onIntroEnd, 6000)
    void image.decode().then(() => {
      if (active) setLogoReady(true)
    }, () => {
      if (active) onIntroEnd()
    }).finally(() => window.clearTimeout(timeout))
    return () => {
      active = false
      window.clearTimeout(timeout)
    }
  }, [intro, onIntroEnd])

  useLayoutEffect(() => {
    const logo = logoRef.current
    const reveal = revealRef.current
    if (!intro || !logo || !reveal) return

    function syncOrigin() {
      if (!logo || !reveal) return
      const { left, top, width, height } = logo.getBoundingClientRect()
      const x = left + width / 2
      const y = top + height / 2
      const farX = Math.max(Math.abs(x), Math.abs(window.innerWidth - x))
      const farY = Math.max(Math.abs(y), Math.abs(window.innerHeight - y))
      reveal.style.setProperty('--home-reveal-x', x + 'px')
      reveal.style.setProperty('--home-reveal-y', y + 'px')
      reveal.style.setProperty('--home-reveal-logo', Math.ceil(Math.hypot(width, height) / 2) + 'px')
      reveal.style.setProperty('--home-reveal-edge', Math.ceil(Math.hypot(farX, farY)) + 1 + 'px')
    }

    syncOrigin()
    const observer = new ResizeObserver(syncOrigin)
    observer.observe(logo)
    window.addEventListener('resize', syncOrigin)
    window.addEventListener('scroll', syncOrigin, { passive: true })
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', syncOrigin)
      window.removeEventListener('scroll', syncOrigin)
    }
  }, [intro])

  useLayoutEffect(() => {
    const logo = logoRef.current
    const sphere = sphereRef.current
    const canvas = gridRef.current
    const orbit = orbitRef.current
    if (!logo || !sphere || !canvas || !orbit || !projects.length) return
    const context = canvas.getContext('2d')
    const items = Array.from(orbit.children) as HTMLLIElement[]
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')
    let frame: number | undefined
    let previousTime: number | undefined
    let drag: Drag | undefined
    let velocityX = 0
    let velocityY = 0
    let autoBlend = 1
    let size = 0
    let logoWidth = 0
    let logoHeight = 0
    let itemSizes: { width: number; height: number }[] = []

    function draw() {
      const { x, y, z, w } = rotation.current.orientation
      const xx = x * x, yy = y * y, zz = z * z
      const xy = x * y, xz = x * z, yz = y * z
      const wx = w * x, wy = w * y, wz = w * z
      const m00 = 1 - 2 * (yy + zz), m01 = 2 * (xy - wz), m02 = 2 * (xz + wy)
      const m10 = 2 * (xy + wz), m11 = 1 - 2 * (xx + zz), m12 = 2 * (yz - wx)
      const m20 = 2 * (xz - wy), m21 = 2 * (yz + wx), m22 = 1 - 2 * (xx + yy)
      const radius = size / 2
      const labelThreshold = size < 340 ? 0.47 : 0.28

      function project(point: Point) {
        const worldX = m00 * point.x + m01 * point.y + m02 * point.z
        const worldY = m10 * point.x + m11 * point.y + m12 * point.z
        const worldZ = m20 * point.x + m21 * point.y + m22 * point.z
        const scale = cameraDistance / (cameraDistance - worldZ)
        return {
          x: worldX * radius * scale * silhouette,
          y: -worldY * radius * scale * silhouette,
          z: worldZ,
          scale,
        }
      }

      if (context) {
        context.clearRect(0, 0, size, size)
        context.lineWidth = 1
        const visibleDepth = 1 / cameraDistance
        const lines = globeGrid.map(line => line.map(project))
        for (const front of [false, true]) {
          context.beginPath()
          for (const line of lines) {
            for (let index = 1; index < line.length; index++) {
              const from = line[index - 1]
              const to = line[index]
              if (((from.z + to.z) / 2 >= visibleDepth) !== front) continue
              context.moveTo(radius + from.x, radius + from.y)
              context.lineTo(radius + to.x, radius + to.y)
            }
          }
          context.strokeStyle = front ? 'rgba(0, 0, 0, .14)' : 'rgba(0, 0, 0, .04)'
          context.stroke()
        }
      }

      projects.forEach(({ point, latitudeRadius }, index) => {
        const { x, y, z, scale } = project(point)
        const item = items[index]
        const depth = (z + 1) / 2
        const front = z / latitudeRadius
        const itemScale = scale * 0.82
        const itemSize = itemSizes[index]
        const clearance = Math.max(
          Math.abs(x) - (logoWidth + itemSize.width * itemScale) / 2,
          Math.abs(y) - (logoHeight + itemSize.height * itemScale) / 2,
        )
        const fade = Math.max(0, Math.min(1, (clearance - 8) / 28))
        const logoFade = fade * fade * (3 - 2 * fade)
        const labelOpacity = Math.max(0, Math.min(1, (front - labelThreshold) * 5))
        item.style.transform = `translate(-50%, -50%) translate3d(${x}px, ${y}px, 0) scale(${itemScale})`
        item.style.opacity = String((0.22 + 0.78 * depth) * logoFade)
        item.style.zIndex = String(Math.round(depth * 100))
        item.style.setProperty('--label-opacity', String(labelOpacity))
      })
    }

    function queueFrame() {
      if (frame !== undefined || drag || reducedMotion.matches) return
      if (!paused || velocityX || velocityY) frame = requestAnimationFrame(tick)
    }

    function stopFrame() {
      if (frame !== undefined) cancelAnimationFrame(frame)
      frame = undefined
      previousTime = undefined
    }

    function tick(time: number) {
      frame = undefined
      const seconds = previousTime === undefined ? 0 : Math.min(time - previousTime, 50) / 1000
      previousTime = time
      const motion = rotation.current
      if (velocityX || velocityY) {
        // Integrate exponentially damped angular velocity over this frame.
        const decay = Math.exp(-flingDamping * seconds)
        const step = (1 - decay) / flingDamping
        motion.orientation = rotate(motion.orientation, velocityX * step, velocityY * step)
        velocityX *= decay
        velocityY *= decay
        if (Math.hypot(velocityX, velocityY) < minimumSpin) velocityX = velocityY = 0
      } else if (!paused) {
        motion.elapsed += seconds
        autoBlend += (1 - autoBlend) * (1 - Math.exp(-2 * seconds))
        const speed = 0.25 + 0.13 * Math.sin(motion.elapsed * 0.56)
        motion.orientation = rotate(motion.orientation, 0, speed * autoBlend * seconds, true)
      }
      draw()
      queueFrame()
    }

    function pointerDown(event: PointerEvent) {
      if (!sphere || drag || !event.isPrimary || event.button !== 0 || !size || reducedMotion.matches) return
      sphere.setPointerCapture(event.pointerId)
      sphere.dataset.dragging = ''
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY, time: event.timeStamp, speedX: 0, speedY: 0, moved: false }
      velocityX = velocityY = 0
      stopFrame()
    }

    function pointerMove(event: PointerEvent) {
      if (!drag || drag.id !== event.pointerId) return
      const radiansPerPixel = Math.PI / size
      const x = (event.clientY - drag.y) * radiansPerPixel
      const y = (event.clientX - drag.x) * radiansPerPixel
      if (!x && !y) return
      const seconds = Math.max(0.008, (event.timeStamp - drag.time) / 1000)
      const blend = drag.moved ? 1 - Math.exp(-seconds / 0.035) : 1
      drag.speedX += (x / seconds - drag.speedX) * blend
      drag.speedY += (y / seconds - drag.speedY) * blend
      drag.x = event.clientX
      drag.y = event.clientY
      drag.time = event.timeStamp
      drag.moved = true
      const motion = rotation.current
      motion.orientation = rotate(motion.orientation, x, y)
      draw()
    }

    function pointerEnd(event: PointerEvent) {
      if (!sphere || !drag || drag.id !== event.pointerId) return
      if (event.type === 'pointerup') {
        pointerMove(event)
        const speed = Math.hypot(drag.speedX, drag.speedY)
        const idle = Math.max(0, event.timeStamp - drag.time)
        if (speed > minimumSpin && idle < 100) {
          const factor = Math.min(1, maximumSpin / speed) * Math.exp(-idle / 45)
          velocityX = drag.speedX * factor
          velocityY = drag.speedY * factor
        }
      }
      if (drag.moved) autoBlend = 0
      drag = undefined
      delete sphere.dataset.dragging
      if (sphere.hasPointerCapture(event.pointerId)) sphere.releasePointerCapture(event.pointerId)
      queueFrame()
    }

    function resize() {
      if (!logo || !sphere || !canvas || reducedMotion.matches) return
      size = sphere.clientWidth
      logoWidth = logo.offsetWidth
      logoHeight = logo.offsetHeight
      itemSizes = items.map(item => ({ width: item.offsetWidth, height: item.offsetHeight }))
      const pixelRatio = Math.min(devicePixelRatio || 1, 2)
      canvas.width = canvas.height = Math.round(size * pixelRatio)
      context?.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      draw()
    }

    function sync() {
      stopFrame()
      if (reducedMotion.matches) {
        const pointerId = drag?.id
        drag = undefined
        velocityX = velocityY = 0
        if (sphere) {
          delete sphere.dataset.dragging
          if (pointerId !== undefined && sphere.hasPointerCapture(pointerId)) sphere.releasePointerCapture(pointerId)
        }
        return
      }
      resize()
      queueFrame()
    }

    const observer = new ResizeObserver(resize)
    observer.observe(sphere)
    observer.observe(logo)
    sync()
    reducedMotion.addEventListener('change', sync)
    sphere.addEventListener('pointerdown', pointerDown)
    sphere.addEventListener('pointermove', pointerMove)
    const endEvents = ['pointerup', 'pointercancel', 'lostpointercapture'] as const
    for (const event of endEvents) sphere.addEventListener(event, pointerEnd)
    return () => {
      stopFrame()
      observer.disconnect()
      reducedMotion.removeEventListener('change', sync)
      sphere.removeEventListener('pointerdown', pointerDown)
      sphere.removeEventListener('pointermove', pointerMove)
      for (const event of endEvents) sphere.removeEventListener(event, pointerEnd)
      delete sphere.dataset.dragging
      if (drag && sphere.hasPointerCapture(drag.id)) sphere.releasePointerCapture(drag.id)
    }
  }, [paused, projects])

  return <section className="home-showcase" aria-label="HZCubing">
    {intro && <div className="home-reveal" data-ready={logoReady || undefined} ref={revealRef} onAnimationEnd={event => { if (event.animationName === 'home-reveal') onIntroEnd() }} aria-hidden="true" />}
    <div className="home-orbit-stage">
      <h1 className="home-logo" ref={logoRef}>
        <img ref={logoImageRef} src="/brand-wordmark.webp" alt="HZCubing" width={360} height={123} fetchPriority={intro ? 'high' : undefined} draggable={false} />
      </h1>
      {projects.length > 0 && <>
        <div className="home-sphere" ref={sphereRef} aria-hidden="true">
          <canvas ref={gridRef} className="home-sphere-grid" />
          <ul className="home-orbit" ref={orbitRef}>
            {projects.map(({ project }) => <li key={project.code}>
              <span>{project.name}</span>
            </li>)}
          </ul>
        </div>
        <div className="home-orbit-control">
          <IconButton label={paused ? '播放项目环绕' : '暂停项目环绕'} onClick={() => setPaused(value => !value)}>
            {paused ? <Play /> : <Pause />}
          </IconButton>
        </div>
      </>}
    </div>
    {projects.length > 0 && <ul className="home-project-list" role="list" aria-label="全部项目">
      {projects.map(({ project }) => <li key={project.code}>{project.name}</li>)}
    </ul>}
  </section>
}
