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
import { isDesktop, type UpdateState } from '@/lib/desktop'
import { fetchHawthorneTemporary, unseenPostings, type JobPosting } from '@/lib/jobs'
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
  updateState: string | Pick<UpdateState, 'status' | 'staged' | 'autoUpdate' | 'shellUpdate'> | undefined,
  postings: JobPosting[] = [],
  now: Date = new Date(),
  desktop: boolean = isDesktop,
): Note[] {
  const out: Note[] = []

  // Hawthorne temporary roles do not stay up long, so a new one outranks
  // everything else here: a review can be done tomorrow, a posting cannot.
  const fresh = unseenPostings(postings, state.jobsSeen).length
  if (fresh > 0) {
    out.push({
      id: 'jobs',
      title: `${fresh} new temporary ${fresh === 1 ? 'opening' : 'openings'} at Hawthorne`,
      detail: 'These come and go quickly. Worth a look now rather than later.',
      href: '/jobs',
      urgent: true,
    })
  }

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

  // Updates download on their own (src/lib/updateWatch.ts, or the shell
  // itself), so there is nothing to say while one is found or on its way —
  // only once it is in hand, and only what, if anything, is left to do.
  type Snapshot = { status: string; staged?: boolean; autoUpdate?: boolean; shellUpdate?: UpdateState['shellUpdate'] }
  const update: Snapshot | undefined = typeof updateState === 'string' ? { status: updateState } : updateState
  if (desktop && update?.status === 'ready') {
    out.push(
      update.staged
        ? {
            id: 'update',
            title: 'ORBIT has updated',
            detail: 'The new version opens the next time you start ORBIT. Restart now to use it straight away. Your progress is kept.',
            href: '/settings',
          }
        : {
            id: 'update',
            title: 'Restart to finish updating',
            detail: 'The update is downloaded. Restart when you are at a good stopping point. Your progress is kept.',
            href: '/settings',
            urgent: true,
          },
    )
  }

  if (desktop && update?.status === 'shell-required') {
    const app = update.shellUpdate?.status
    if (app === 'ready') {
      out.push(
        update.autoUpdate
          ? {
              id: 'shell',
              title: 'The new ORBIT is ready',
              detail: 'It goes in when you quit ORBIT, like any other app update. Settings can install it now instead. Your progress is kept.',
              href: '/settings',
            }
          : {
              id: 'shell',
              title: 'The new ORBIT is ready to install',
              detail: 'Settings installs it and reopens ORBIT. Your progress is kept.',
              href: '/settings',
              urgent: true,
            },
      )
    } else if (app !== 'downloading') {
      out.push({
        id: 'shell',
        title: 'A newer ORBIT app is available',
        detail: 'Settings updates the app straight to the latest version. Your progress is kept.',
        href: '/settings',
        urgent: true,
      })
    }
  }

  return out
}

let probe: Promise<JobPosting[]> | null = null

/**
 * The postings, fetched once per launch.
 *
 * The Jobs page marks everything it fetches as seen, so by the time she
 * leaves it there is nothing left to notice — the bell has to look for
 * itself. A failure is silence rather than an error: a notification that
 * cannot say anything useful should not say anything.
 */
function probeJobs(): Promise<JobPosting[]> {
  if (!probe) probe = fetchHawthorneTemporary().then((r) => r.postings).catch(() => [])
  return probe
}

export function Notifications() {
  const { state } = useLearner()
  const update = useUpdates().state
  const [open, setOpen] = useState(false)
  const [postings, setPostings] = useState<JobPosting[]>([])
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let alive = true
    void probeJobs().then((p) => {
      if (alive) setPostings(p)
    })
    return () => {
      alive = false
    }
  }, [])

  const notes = notesFor(state, update ?? undefined, postings)
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
