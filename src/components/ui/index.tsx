/* ============================================================================
   ORBIT — UI primitives
   ========================================================================== */
import type { ButtonHTMLAttributes, CSSProperties, HTMLAttributes, ReactNode, SVGProps } from 'react'
import { useEffect, useRef, useState } from 'react'
import { IconCheck, IconChevronRight } from '@/components/icons'
import './ui.css'

/* ── Card ────────────────────────────────────────────────────────────────── */

export function Card({
  children,
  pad = false,
  interactive = false,
  accent,
  className = '',
  style,
  index,
  ...rest
}: {
  children: ReactNode
  pad?: boolean
  interactive?: boolean
  accent?: string
  className?: string
  style?: CSSProperties
  index?: number
} & Omit<HTMLAttributes<HTMLDivElement>, 'style' | 'className'>) {
  return (
    <div
      className={[
        'card',
        pad ? 'card--pad' : '',
        interactive ? 'card--interactive' : '',
        accent ? 'card--accent' : '',
        index != null ? 'enter' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={
        {
          ...(accent ? { '--accent-local': accent } : {}),
          ...(index != null ? { '--i': index } : {}),
          ...style,
        } as CSSProperties
      }
      {...rest}
    >
      {children}
    </div>
  )
}

export function CardHead({
  icon,
  title,
  right,
  divided = false,
}: {
  icon?: ReactNode
  title: ReactNode
  right?: ReactNode
  divided?: boolean
}) {
  return (
    <div className={`card-head${divided ? ' card-head--divided' : ''}`}>
      <div className="card-head__title">
        {icon}
        <span className="eyebrow">{title}</span>
      </div>
      {right}
    </div>
  )
}

/* ── Progress bar ────────────────────────────────────────────────────────── */

export function Bar({
  value,
  height = 5,
  glow = false,
  className = '',
  trackColor,
  fill,
}: {
  /** 0–1. */
  value: number
  height?: number
  glow?: boolean
  className?: string
  trackColor?: string
  fill?: string
}) {
  const pct = clamp01(value) * 100
  return (
    <div
      className={`bar${glow ? ' bar--glow' : ''} ${className}`}
      style={{ height, ...(trackColor ? { background: trackColor } : {}) }}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="bar__fill" style={{ width: `${pct}%`, ...(fill ? { background: fill } : {}) }} />
    </div>
  )
}

/* ── Ring ────────────────────────────────────────────────────────────────────
   Two concentric strokes — a flat track and an arc clipped by stroke-dashoffset.
   The arc counts up from zero on mount, which is the one place in this product
   where a number animating is worth the attention it costs. */

export function Ring({
  value,
  size = 62,
  thickness = 4,
  label,
  fontSize,
  color = 'var(--accent)',
  trackColor = '#182238',
  animate = true,
}: {
  /** 0–1. */
  value: number
  size?: number
  thickness?: number
  label?: ReactNode
  fontSize?: number
  color?: string
  trackColor?: string
  animate?: boolean
}) {
  const target = clamp01(value)
  const shown = useCountUp(target, animate)
  const r = (size - thickness) / 2
  const c = 2 * Math.PI * r
  const fs = fontSize ?? Math.round(size * 0.27)

  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke={trackColor} strokeWidth={thickness} fill="none" />
        <circle
          className="ring__arc"
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={thickness}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - shown)}
        />
      </svg>
      <div className="ring__label" style={{ fontSize: fs }}>
        {label ?? (
          <>
            {Math.round(shown * 100)}
            <span className="ring__unit" style={{ fontSize: fs * 0.92 }}>
              %
            </span>
          </>
        )}
      </div>
    </div>
  )
}

/* ── Icon tile ───────────────────────────────────────────────────────────── */

export function Tile({
  children,
  size = 44,
  radius,
  color,
  lit = false,
  className = '',
}: {
  children: ReactNode
  size?: number
  radius?: number
  color?: string
  lit?: boolean
  className?: string
}) {
  return (
    <div
      className={`tile${lit ? ' tile--lit' : ''} ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: radius ?? Math.round(size * 0.24),
        ...(color ? { color } : {}),
      }}
    >
      {children}
    </div>
  )
}

/* ── Button ──────────────────────────────────────────────────────────────── */

type BtnVariant = 'primary' | 'outline' | 'block' | 'ghost' | 'quiet' | 'danger'
type BtnSize = 'sm' | 'md' | 'lg' | 'icon'

export function Button({
  children,
  variant = 'ghost',
  size = 'md',
  className = '',
  ...rest
}: {
  children: ReactNode
  variant?: BtnVariant
  size?: BtnSize
  className?: string
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`btn btn--${variant} btn--${size} ${className}`} {...rest}>
      {children}
    </button>
  )
}

/* ── Checkbox ────────────────────────────────────────────────────────────── */

export function Check({
  checked,
  onChange,
  size = 16,
  label,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  size?: number
  label?: string
}) {
  return (
    <button
      className="check"
      data-on={checked}
      style={{ '--sz': `${size}px` } as CSSProperties}
      onClick={() => onChange(!checked)}
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      type="button"
    >
      <IconCheck className="check__tick" size={size - 6} />
    </button>
  )
}

/* ── Bullet list ─────────────────────────────────────────────────────────── */

export interface BulletItem {
  label: string
  done?: boolean
  active?: boolean
}

export function Bullets({ items, color }: { items: BulletItem[]; color?: string }) {
  return (
    <ul className="bullets" style={color ? ({ '--accent': color } as CSSProperties) : undefined}>
      {items.map((it) => (
        <li className="bullet" key={it.label} data-done={!!it.done} data-active={!!it.active}>
          <span className="bullet__dot" />
          <span className="truncate">{it.label}</span>
        </li>
      ))}
    </ul>
  )
}

/* ── Chip ────────────────────────────────────────────────────────────────── */

export function Chip({
  children,
  tone = 'default',
  ghost = false,
}: {
  children: ReactNode
  tone?: 'default' | 'blue' | 'ok' | 'warn' | 'bad'
  ghost?: boolean
}) {
  const cls = tone === 'default' ? '' : ` chip--${tone}`
  return <span className={`chip${cls}${ghost ? ' chip--ghost' : ''}`}>{children}</span>
}

/* ── List row ────────────────────────────────────────────────────────────── */

export function RowItem({
  icon,
  title,
  sub,
  right,
  onClick,
  chevron = false,
}: {
  icon?: ReactNode
  title: ReactNode
  sub?: ReactNode
  right?: ReactNode
  onClick?: () => void
  chevron?: boolean
}) {
  const inner = (
    <>
      {icon}
      <div className="grow">
        <div className="row-item__title truncate">{title}</div>
        {sub ? <div className="row-item__sub truncate">{sub}</div> : null}
      </div>
      {right}
      {chevron ? <IconChevronRight size={15} className="row-item__chev" /> : null}
    </>
  )
  if (!onClick) return <div className="row-item">{inner}</div>
  return (
    <button className="row-item row-item--tappable" onClick={onClick} type="button">
      {inner}
    </button>
  )
}

/* ── Segmented control ───────────────────────────────────────────────────── */

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="seg" role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          className="seg__btn"
          data-on={o.value === value}
          onClick={() => onChange(o.value)}
          role="tab"
          aria-selected={o.value === value}
          type="button"
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/* ── Empty state ─────────────────────────────────────────────────────────── */

export function Empty({
  icon,
  title,
  body,
  action,
}: {
  icon?: ReactNode
  title: string
  body?: string
  action?: ReactNode
}) {
  return (
    <div className="empty">
      {icon}
      <div className="empty__title">{title}</div>
      {body ? <div className="empty__body">{body}</div> : null}
      {action}
    </div>
  )
}

/* ── Stat ────────────────────────────────────────────────────────────────── */

export function Stat({
  value,
  label,
  delta,
  deltaTone = 'ok',
}: {
  value: ReactNode
  label: string
  delta?: string
  deltaTone?: 'ok' | 'bad' | 'muted'
}) {
  const color =
    deltaTone === 'ok' ? 'var(--ok)' : deltaTone === 'bad' ? 'var(--bad)' : 'var(--ink-4)'
  return (
    <div>
      <div className="row" style={{ gap: 7, alignItems: 'baseline' }}>
        <span className="stat__value">{value}</span>
        {delta ? (
          <span className="stat__delta" style={{ color }}>
            {delta}
          </span>
        ) : null}
      </div>
      <div className="stat__label">{label}</div>
    </div>
  )
}

/* ── Sparkline ───────────────────────────────────────────────────────────────
   Small enough that axes would be noise: the shape and the endpoint are the
   whole message. */

export function Sparkline({
  data,
  width = 96,
  height = 28,
  color = 'var(--accent)',
  fillArea = true,
  ...rest
}: {
  data: number[]
  width?: number
  height?: number
  color?: string
  fillArea?: boolean
} & SVGProps<SVGSVGElement>) {
  if (data.length < 2) return <svg width={width} height={height} {...rest} />
  const min = Math.min(...data)
  const max = Math.max(...data)
  const span = max - min || 1
  const pad = 2
  const x = (i: number) => (i / (data.length - 1)) * (width - pad * 2) + pad
  const y = (v: number) => height - pad - ((v - min) / span) * (height - pad * 2)
  const line = data.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const area = `${line} L${x(data.length - 1).toFixed(1)},${height} L${x(0).toFixed(1)},${height} Z`
  const gid = `spark-${Math.abs(hashNums(data))}`

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} {...rest}>
      {fillArea ? (
        <>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.28" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#${gid})`} />
        </>
      ) : null}
      <path d={line} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={x(data.length - 1)} cy={y(data[data.length - 1]!)} r="2" fill={color} />
    </svg>
  )
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

export function clamp01(n: number): number {
  return n < 0 ? 0 : n > 1 ? 1 : Number.isFinite(n) ? n : 0
}

function hashNums(ns: number[]): number {
  let h = 2166136261
  for (const n of ns) {
    h ^= Math.round(n * 1000)
    h = Math.imul(h, 16777619)
  }
  return h | 0
}

/**
 * Eases a 0–1 value up from zero on mount. Respects reduced motion by
 * snapping straight to the target.
 */
function useCountUp(target: number, enabled: boolean): number {
  const [v, setV] = useState(enabled ? 0 : target)
  const raf = useRef(0)

  useEffect(() => {
    if (!enabled || prefersReducedMotion()) {
      setV(target)
      return
    }
    const start = performance.now()
    const from = 0
    const dur = 900
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur)
      // easeOutCubic
      const e = 1 - Math.pow(1 - t, 3)
      setV(from + (target - from) * e)
      if (t < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [target, enabled])

  return v
}

export function prefersReducedMotion(): boolean {
  return (
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}
