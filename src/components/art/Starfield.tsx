/* ============================================================================
   ORBIT — ambient star field
   ----------------------------------------------------------------------------
   A fixed canvas behind the whole application. Three parallax layers drifting
   at different rates, plus a rare meteor. It is deliberately almost invisible:
   peak star opacity is 0.55 and the drift is under two pixels a second, so it
   registers as texture, never as motion competing with the content.

   Cheap by construction — it repaints at most ~30fps, pauses entirely when the
   tab is hidden, and draws nothing at all under `prefers-reduced-motion`.
   ========================================================================== */
import { useEffect, useRef } from 'react'
import { mulberry32 } from './rng'

interface Star {
  x: number
  y: number
  r: number
  a: number
  /** px per second */
  v: number
  /** twinkle phase */
  p: number
}

interface Meteor {
  x: number
  y: number
  len: number
  life: number
  ttl: number
  vx: number
  vy: number
}

const LAYERS = [
  { count: 0.00011, rMin: 0.35, rMax: 0.75, aMin: 0.1, aMax: 0.3, v: 0.9 },
  { count: 0.00006, rMin: 0.6, rMax: 1.1, aMin: 0.18, aMax: 0.45, v: 1.7 },
  { count: 0.000018, rMin: 0.9, rMax: 1.6, aMin: 0.3, aMax: 0.55, v: 2.8 },
] as const

export function Starfield({ density = 1 }: { density?: number }) {
  const ref = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // Still paint one static frame — the texture is part of the design.
      paintStatic(cv, density)
      return
    }

    const ctx = cv.getContext('2d', { alpha: true })
    if (!ctx) return

    let raf = 0
    let stars: Star[] = []
    let meteors: Meteor[] = []
    let w = 0
    let h = 0
    let dpr = 1
    let last = performance.now()
    let acc = 0
    const rnd = mulberry32(0x5eed)

    const build = () => {
      dpr = Math.min(2, devicePixelRatio || 1)
      w = cv.clientWidth
      h = cv.clientHeight
      cv.width = Math.max(1, Math.round(w * dpr))
      cv.height = Math.max(1, Math.round(h * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      stars = []
      const area = w * h
      for (const L of LAYERS) {
        const n = Math.round(area * L.count * density)
        for (let i = 0; i < n; i++) {
          stars.push({
            x: rnd() * w,
            y: rnd() * h,
            r: L.rMin + rnd() * (L.rMax - L.rMin),
            a: L.aMin + rnd() * (L.aMax - L.aMin),
            v: L.v,
            p: rnd() * Math.PI * 2,
          })
        }
      }
    }

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      acc += dt
      // Throttle to ~30fps; nothing here benefits from 120.
      if (acc < 1 / 30) return
      const step = acc
      acc = 0

      ctx.clearRect(0, 0, w, h)

      for (const s of stars) {
        s.y += s.v * step
        if (s.y > h + 2) {
          s.y = -2
          s.x = rnd() * w
        }
        s.p += step * 0.7
        const tw = 0.82 + Math.sin(s.p) * 0.18
        ctx.globalAlpha = s.a * tw
        ctx.fillStyle = '#cfe2ff'
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fill()
      }

      // ~1 meteor every 11s on average.
      if (rnd() < step / 11 && meteors.length < 2) {
        const sx = rnd() * w * 1.1
        meteors.push({
          x: sx,
          y: -20,
          len: 90 + rnd() * 120,
          life: 0,
          ttl: 1.1 + rnd() * 0.5,
          vx: -(120 + rnd() * 90),
          vy: 230 + rnd() * 140,
        })
      }

      meteors = meteors.filter((m) => {
        m.life += step
        if (m.life > m.ttl) return false
        m.x += m.vx * step
        m.y += m.vy * step
        const k = m.life / m.ttl
        // Fade in fast, out slow.
        const alpha = (k < 0.18 ? k / 0.18 : 1 - (k - 0.18) / 0.82) * 0.55
        const nx = m.vx / Math.hypot(m.vx, m.vy)
        const ny = m.vy / Math.hypot(m.vx, m.vy)
        const g = ctx.createLinearGradient(m.x, m.y, m.x - nx * m.len, m.y - ny * m.len)
        g.addColorStop(0, `rgba(210,232,255,${alpha})`)
        g.addColorStop(1, 'rgba(210,232,255,0)')
        ctx.globalAlpha = 1
        ctx.strokeStyle = g
        ctx.lineWidth = 1.3
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(m.x, m.y)
        ctx.lineTo(m.x - nx * m.len, m.y - ny * m.len)
        ctx.stroke()
        return m.y < h + 60 && m.x > -80
      })

      ctx.globalAlpha = 1
    }

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf)
        raf = 0
      } else if (!raf) {
        last = performance.now()
        raf = requestAnimationFrame(frame)
      }
    }

    build()
    raf = requestAnimationFrame(frame)

    const ro = new ResizeObserver(build)
    ro.observe(cv)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [density])

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  )
}

function paintStatic(cv: HTMLCanvasElement, density: number) {
  const ctx = cv.getContext('2d')
  if (!ctx) return
  const dpr = Math.min(2, devicePixelRatio || 1)
  const w = cv.clientWidth
  const h = cv.clientHeight
  cv.width = Math.round(w * dpr)
  cv.height = Math.round(h * dpr)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  const rnd = mulberry32(0x5eed)
  for (const L of LAYERS) {
    const n = Math.round(w * h * L.count * density)
    for (let i = 0; i < n; i++) {
      ctx.globalAlpha = L.aMin + rnd() * (L.aMax - L.aMin)
      ctx.fillStyle = '#cfe2ff'
      ctx.beginPath()
      ctx.arc(rnd() * w, rnd() * h, L.rMin + rnd() * (L.rMax - L.rMin), 0, Math.PI * 2)
      ctx.fill()
    }
  }
}
