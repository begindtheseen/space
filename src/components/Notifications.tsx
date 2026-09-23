/* ============================================================================
   ORBIT — the bell
   ----------------------------------------------------------------------------
   Everything waiting on her, in one place next to the profile button: reviews
   that have come due, a lesson she stopped halfway through, and an update
   ready to install.

   Each line is a link to the thing itself, because a notice that tells you
   something is waiting and then makes you go and find it is worse than no
   notice. Nothing here is dismissible: these are states of the app, not
   messages, and they go away by being dealt with.
   ========================================================================== */
import { useEffect, useRef, useState } from 'react'
import { IconBell } from '@/components/icons'
import { MODULES } from '@/curriculum'
import { dueAtoms } from '@/engine/scheduler'
import type { LearnerState } from '@/engine/state'
import { useLearner } from '@/hooks/useLearner'
import { useUpdates } from '@/hooks/useUpdates'
import { isDesktop } from '@/lib/desktop'
import { navigate } from '@/lib/router'
import './notifications.css'

export interface Note {
  id: string
  title: string
  detail: string
  href: string
  /** Worth the dot on the bell. */
  urgent?: boolean
}

/**
 * What is waiting, most pressing first.
 *
 * Pure so it can be tested without a browser: everything it needs is passed
 * in rather than read from a hook.
 */
export function notesFor(
  state: LearnerState,
  updateStatus: string | undefined,
  now: Date = new Date(),
): Note[] {
  const out: Note[] = []

  const due = dueAtoms(state, MODULES, now).length
  if (due > 0) {
    out.push({
      id: 'due',
      title: `${due} ${due === 1 ? 'review is' : 'reviews are'} due`,
      detail: 'Reviews are what makes any of this stick. They take minutes.',
      href: '/review',
      urgent: true,
    })
  }

  // Where she actually stopped. The resume point already knows the route back
  // to the exact place and how to describe it, so this does not rebuild either
  // — reconstructing the link from the module id would land her at the top of
  // the module rather than in the lesson she was reading.
  const resume = state.resume
  const progress = resume?.progress
  const barelyStarted = typeof progress === 'number' && progress <= 0.05
  if (resume?.path && !barelyStarted) {
    out.push({
      id: 'resume',
      title: 'Pick up where you stopped',
      detail: resume.detail ?? resume.label,
      href: resume.path,
    })
  }

  if (isDesktop && (updateStatus === 'available' || updateStatus === 'ready')) {
    out.push({
      id: 'update',
      title: updateStatus === 'ready' ? 'An update is ready to install' : 'An update is available',
      detail:
        updateStatus === 'ready'
          ? 'Restart when you are at a good stopping point. Your progress is kept.'
          : 'Settings shows what changed before you install it.',
      href: '/settings',
      urgent: updateStatus === 'ready',
    })
  }

  if (isDesktop && updateStatus === 'shell-required') {
    out.push({
      id: 'shell',
      title: 'This update needs a newer ORBIT app',
      detail: 'The lessons update themselves; the app around them is its own download.',
      href: '/settings',
      urgent: true,
    })
  }

  return out
}

export function Notifications() {
  const { state } = useLearner()
  const updateStatus = useUpdates().state?.status
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)

  const notes = notesFor(state, updateStatus)
  const urgent = notes.some((n) => n.urgent)

  useEffect(() => {
    if (!open) return
    const away = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', away)
    return () => document.removeEventListener('mousedown', away)
  }, [open])

  return (
    <div className="notif" ref={box}>
      <button
        className="notif__bell"
        onClick={() => setOpen((v) => !v)}
        aria-label={notes.length ? `Notifications — ${notes.length} waiting` : 'Notifications'}
        type="button"
      >
        <IconBell size={17} />
        {notes.length ? <span className="notif__dot" data-urgent={urgent} /> : null}
      </button>

      {open ? (
        <div className="notif__out">
          {notes.length === 0 ? (
            <div className="notif__none">Nothing needs you right now.</div>
          ) : (
            notes.map((n) => (
              <button
                key={n.id}
                className="notif__item"
                type="button"
                onClick={() => {
                  setOpen(false)
                  navigate(n.href)
                }}
              >
                <span className="notif__title">{n.title}</span>
                <span className="notif__detail">{n.detail}</span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  )
}
