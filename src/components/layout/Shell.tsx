/* ============================================================================
   ORBIT — application shell: sidebar, top bar, scroll container
   ========================================================================== */
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import {
  IconBars,
  IconBook,
  IconBriefcase,
  IconBulb,
  IconPlay,
  IconCode,
  IconClock,
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
import { FocusBar } from '@/components/FocusBar'
import { Notifications } from '@/components/Notifications'
import { Search } from '@/components/Search'
import { useLearner } from '@/hooks/useLearner'
import { useUpdates } from '@/hooks/useUpdates'
import { navigate, useRoute, useScrollReset } from '@/lib/router'
import { startUpdateWatch } from '@/lib/updateWatch'
import { useAwakeWhileActive } from '@/lib/wakeLock'
import './shell.css'

/**
 * How long the rail waits before sliding away once the pointer leaves it.
 * Long enough to survive a clipped corner, short enough not to linger.
 */
const HIDE_DELAY_MS = 420

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
  { id: 'focus', label: 'Focus', path: '/focus', Icon: IconClock },
  { id: 'learning', label: 'Learning', path: '/learning', Icon: IconBook, also: ['/review', '/lesson'] },
  { id: 'foundations', label: 'Foundations', path: '/foundations', Icon: IconSigma },
  { id: 'coding', label: 'Coding', path: '/coding', Icon: IconCode, also: ['/playground'] },
  { id: 'learn', label: 'Learn to code', path: '/learn', Icon: IconBulb },
  { id: 'gnc', label: 'GNC Prep', path: '/gnc', Icon: IconTarget },
  { id: 'career', label: 'Career', path: '/career', Icon: IconBriefcase },
  { id: 'bench', label: 'Workbench', path: '/bench', Icon: IconPlay },
  { id: 'jobs', label: 'Hawthorne', path: '/jobs', Icon: IconBriefcase },
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
  const { state } = useLearner()
  const focus = state.focus
  const pinned = state.settings.pinSidebar === true
  const [drawer, setDrawer] = useState(false)
  const [peek, setPeek] = useState(false)
  const [stuck, setStuck] = useState(false)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* The shell asks for updates once at launch and never again, so an app left
     open all day never hears about a release that lands while it is running.
     Started here because the shell is mounted for the life of the app. */
  useEffect(() => startUpdateWatch(), [])
  // The screen stays on while she is using the app (src/lib/wakeLock.ts).
  useAwakeWhileActive()

  /* The rail is revealed by moving toward the left edge and hidden again on
     the way out. The delay on the way out is the part that matters: without
     it, clipping the corner of the rail on the way to something else snaps it
     shut mid-reach, which reads as the interface fighting her. */
  const reveal = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    setPeek(true)
  }, [])

  const scheduleHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setPeek(false), HIDE_DELAY_MS)
  }, [])

  useEffect(() => () => void (hideTimer.current && clearTimeout(hideTimer.current)), [])

  useScrollReset(route.path, scrollRef)

  // Close the drawer and the hover reveal on navigation and on Escape.
  useEffect(() => {
    setDrawer(false)
    setPeek(false)
  }, [route.path])
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

  const open = drawer || peek || pinned

  return (
    <div className="shell" data-focus={!!focus} data-autohide={!pinned}>
      {/* A strip of nothing along the very edge of the window. Entering it is
          what brings the rail back, so getting to the menu costs a deliberate
          move to the side rather than a glance. */}
      {!pinned ? (
        <div className="edge-zone" onMouseEnter={reveal} aria-hidden="true" />
      ) : null}

      <Sidebar
        current={route.path}
        open={open}
        dueCount={dueCount}
        onMouseEnter={!pinned ? reveal : undefined}
        onMouseLeave={!pinned ? scheduleHide : undefined}
        onFocusCapture={!pinned ? reveal : undefined}
        onBlurCapture={!pinned ? scheduleHide : undefined}
      />
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

      <FocusBar />
    </div>
  )
}

function Sidebar({
  current,
  open,
  dueCount,
  ...handlers
}: {
  current: string
  open: boolean
  dueCount: number
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  onFocusCapture?: () => void
  onBlurCapture?: () => void
}) {
  return (
    <aside className="side" data-open={open} {...handlers}>
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
  // Desktop only: an update waiting on a restart. Updates download on their
  // own, and one staged for the next launch needs nothing from her, so only
  // a restart nobody else will do earns the dot. In a browser the hook never
  // subscribes and `state` stays null.
  const update = useUpdates().state
  const updateWaiting = update?.status === 'ready' && !update.staged

  return (
    <header className="topbar" data-stuck={stuck}>
      <button className="topbar__burger" onClick={onMenu} aria-label="Open navigation" type="button">
        <IconMenu size={19} />
      </button>

      <Search />

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

      <Notifications />

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
