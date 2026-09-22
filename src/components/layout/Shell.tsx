/* ============================================================================
   ORBIT — application shell: sidebar, top bar, scroll container
   ========================================================================== */
import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  IconBars,
  IconBook,
  IconBriefcase,
  IconPlay,
  IconCode,
  IconCompass,
  IconGear,
  IconHome,
  IconMenu,
  IconTarget,
  IconDoc,
  IconSigma,
  IconUser,
  Logomark,
  Wordmark,
  type IconProps,
} from '@/components/icons'
import { useUpdates } from '@/hooks/useUpdates'
import { navigate, useRoute, useScrollReset } from '@/lib/router'
import './shell.css'

export interface NavDef {
  id: string
  label: string
  path: string
  Icon: (p: IconProps) => ReactNode
  /** Extra path prefixes that should also light this destination. */
  also?: string[]
}

export const NAV: NavDef[] = [
  { id: 'home', label: 'Home', path: '/', Icon: IconHome },
  { id: 'learning', label: 'Learning', path: '/learning', Icon: IconBook, also: ['/review', '/lesson'] },
  { id: 'foundations', label: 'Foundations', path: '/foundations', Icon: IconSigma },
  { id: 'coding', label: 'Coding', path: '/coding', Icon: IconCode, also: ['/playground'] },
  { id: 'gnc', label: 'GNC Prep', path: '/gnc', Icon: IconTarget },
  { id: 'career', label: 'Career', path: '/career', Icon: IconBriefcase },
  { id: 'bench', label: 'Workbench', path: '/bench', Icon: IconPlay },
  { id: 'progress', label: 'Progress', path: '/progress', Icon: IconBars },
  { id: 'resources', label: 'Resources', path: '/resources', Icon: IconDoc },
  { id: 'guide', label: 'Guide', path: '/guide', Icon: IconCompass },
  { id: 'settings', label: 'Settings', path: '/settings', Icon: IconGear },
]

/** The mission phase the learner is in, derived from overall readiness. */
export type Phase = 'prepare' | 'build' | 'launch'

export function phaseFor(readiness: number): Phase {
  if (readiness >= 0.75) return 'launch'
  if (readiness >= 0.35) return 'build'
  return 'prepare'
}

function isActive(navPath: string, current: string, also?: string[]): boolean {
  if (navPath === '/') return current === '/'
  if (current === navPath || current.startsWith(`${navPath}/`)) return true
  return (also ?? []).some((p) => current === p || current.startsWith(`${p}/`))
}

export function Shell({
  children,
  dueCount = 0,
  phase = 'prepare',
}: {
  children: ReactNode
  /** Reviews waiting — shown as a badge on Learning. */
  dueCount?: number
  phase?: Phase
}) {
  const route = useRoute()
  const [drawer, setDrawer] = useState(false)
  const [stuck, setStuck] = useState(false)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useScrollReset(route.path, scrollRef)

  // Close the drawer on navigation and on Escape.
  useEffect(() => setDrawer(false), [route.path])
  useEffect(() => {
    if (!drawer) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawer(false)
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [drawer])

  // The top bar only gains its backdrop once content is behind it.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    let frame = 0
    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        setStuck(el.scrollTop > 12)
      })
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      el.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div className="shell">
      <Sidebar current={route.path} open={drawer} dueCount={dueCount} />
      {drawer ? <div className="scrim" onClick={() => setDrawer(false)} /> : null}

      <div className="main">
        {/* The bar lives *inside* the scroll container so it can be sticky, which
            is what lets the hero plate slide up behind it and reach the very top
            of the viewport. Outside the container it would be a fixed header
            with a hard edge, and the artwork would start 62px down. */}
        <div className="scroll" ref={scrollRef}>
          <TopBar phase={phase} stuck={stuck} onMenu={() => setDrawer((d) => !d)} />
          {children}
        </div>
      </div>
    </div>
  )
}

function Sidebar({
  current,
  open,
  dueCount,
}: {
  current: string
  open: boolean
  dueCount: number
}) {
  return (
    <aside className="side" data-open={open}>
      <div className="side__brand">
        <a href="#/" aria-label="ORBIT — home">
          <Wordmark height={15} />
        </a>
      </div>

      <nav className="side__nav" aria-label="Primary">
        {NAV.map(({ id, label, path, Icon, also }) => {
          const on = isActive(path, current, also)
          return (
            <a
              key={id}
              className="nav-item"
              href={`#${path}`}
              data-on={on}
              aria-current={on ? 'page' : undefined}
            >
              <Icon size={19} />
              <span>{label}</span>
              {id === 'learning' && dueCount > 0 ? (
                <span className="nav-item__badge" title={`${dueCount} reviews due`}>
                  {dueCount > 99 ? '99+' : dueCount}
                </span>
              ) : null}
            </a>
          )
        })}
      </nav>

      <div className="side__foot">
        <div className="side__motto">
          Same
          <br />
          mission.
          <br />
          Different
          <br />
          paths.
        </div>
        <Logomark size={62} className="side__mark" />
      </div>
    </aside>
  )
}

const PHASES: { id: Phase; label: string }[] = [
  { id: 'prepare', label: 'Prepare' },
  { id: 'build', label: 'Build' },
  { id: 'launch', label: 'Launch' },
]

function TopBar({
  phase,
  stuck,
  onMenu,
}: {
  phase: Phase
  stuck: boolean
  onMenu: () => void
}) {
  // Desktop only: a bundle update waiting on the Settings page. In a browser
  // the hook never subscribes and `state` stays null.
  const updateStatus = useUpdates().state?.status
  const updateWaiting = updateStatus === 'available' || updateStatus === 'ready'

  return (
    <header className="topbar" data-stuck={stuck}>
      <button className="topbar__burger" onClick={onMenu} aria-label="Open navigation" type="button">
        <IconMenu size={19} />
      </button>

      <div className="phases" title="Your current mission phase">
        {PHASES.map((p, i) => (
          <span key={p.id} style={{ display: 'contents' }}>
            {i > 0 ? <span className="phases__sep">/</span> : null}
            <span className="phases__item" data-on={p.id === phase}>
              {p.label}
            </span>
          </span>
        ))}
      </div>

      <button
        className="avatar"
        onClick={() => navigate('/settings')}
        aria-label={updateWaiting ? 'Account and settings — update available' : 'Account and settings'}
        type="button"
      >
        <IconUser size={17} />
        {updateWaiting ? <span className="avatar__dot" /> : null}
      </button>
    </header>
  )
}
