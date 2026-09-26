/* ============================================================================
   ORBIT — the focus block strip
   ----------------------------------------------------------------------------
   A block has to survive navigation, because the whole point of a block is
   that she goes and does the thing. If the timer lived on the Focus page it
   would end the moment she opened the lesson it sent her to. So it lives in
   the shell, under every page, and the Focus page is only where a block is
   chosen and where it is closed out.

   What is on the strip is deliberate. The time remaining, because the visible
   end is the thing that makes starting possible. The task, because a block
   with no stated object drifts. Somewhere to put an intruding thought, because
   the alternative is that she leaves to deal with it. And a way to stop, in
   plain words, because a timer you cannot stop is a thing people avoid
   starting.

   While the block runs it also holds her on its page (engine/focus.ts,
   "Staying in the block"): a link, the search box or the back button that
   would take her elsewhere puts her straight back, and the strip says why and
   how to leave — pause it (once five minutes have run) or end it.
   ========================================================================== */
import { useEffect, useRef, useState } from 'react'
import { IconCheck, IconPause, IconPlay, IconPlus, IconX } from '@/components/icons'
import { endFocus, park, pauseFocus, resumeFocus } from '@/engine/apply'
import {
  isComplete,
  isLocked,
  lockAllows,
  pauseAvailableIn,
  PAUSE_COOLDOWN_MS,
  remainingMs,
  type FocusRun,
} from '@/engine/focus'
import { useLearner } from '@/hooks/useLearner'
import { navigate, useRoute } from '@/lib/router'
import './focus-bar.css'

export function FocusBar() {
  const { state, setState } = useLearner()
  const run = state.focus
  if (!run) return null
  return <Strip run={run} setState={setState} />
}

function Strip({
  run,
  setState,
}: {
  run: FocusRun
  setState: ReturnType<typeof useLearner>['setState']
}) {
  const [, force] = useState(0)
  const [parking, setParking] = useState(false)
  const [note, setNote] = useState('')
  const [turnedBack, setTurnedBack] = useState(0)
  const noteRef = useRef<HTMLInputElement | null>(null)
  const route = useRoute()

  // One second is the coarsest tick that still reads as a live countdown. A
  // paused block has nothing to redraw, so it costs nothing while it waits.
  useEffect(() => {
    if (run.pausedAt) return
    const id = setInterval(() => force((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [run.pausedAt])

  useEffect(() => {
    if (parking) noteRef.current?.focus()
  }, [parking])

  const done = isComplete(run)
  const left = remainingMs(run)
  const locked = isLocked(run)
  const pauseIn = pauseAvailableIn(run)

  // The hold. Checked on every route change and every tick, so a block that
  // is resumed from somewhere else takes her back to it, and one that ends
  // lets her go.
  useEffect(() => {
    if (!locked || lockAllows(run, route.path)) return
    navigate(run.pick.href, { replace: true })
    setTurnedBack(Date.now())
  }, [locked, route.path, run])

  // Links that would leave, stopped before they go: a hash route outside the
  // block, or a same-tab link off this page altogether (the realm switcher),
  // which the route check above could never turn back. A link that opens in a
  // new tab, like a lesson's reference, is not leaving.
  useEffect(() => {
    if (!locked) return
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return
      const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!a || a.closest('.fbar')) return
      if (a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey) return
      const href = a.getAttribute('href') ?? ''
      const leaves = href.startsWith('#')
        ? !lockAllows(run, href.slice(1).split('?')[0] || '/')
        : !/^(mailto:|tel:)/.test(href)
      if (!leaves) return
      e.preventDefault()
      e.stopPropagation()
      setTurnedBack(Date.now())
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [locked, run])

  // The note stays up long enough to read, then gets out of the way.
  useEffect(() => {
    if (!turnedBack) return
    const id = setTimeout(() => setTurnedBack(0), 5000)
    return () => clearTimeout(id)
  }, [turnedBack])

  // The rest of the app dims its way out (sidebar, search) while it is closed.
  useEffect(() => {
    const root = document.documentElement
    if (locked) root.dataset.focusLock = 'true'
    else delete root.dataset.focusLock
    return () => {
      delete root.dataset.focusLock
    }
  }, [locked])

  const submitNote = () => {
    const text = note
    setNote('')
    setParking(false)
    if (text.trim()) setState((s) => park(s, text))
  }

  return (
    <div className="fbar" data-done={done} data-locked={locked} role="region" aria-label="Focus block">
      {turnedBack && locked ? (
        <div className="fbar__notice" role="status">
          You are in a focus block, so you stay on this lesson.{' '}
          {pauseIn > 0
            ? `You can pause in ${clock(pauseIn)}, or end the block now.`
            : 'Pause or end the block to go somewhere else.'}
        </div>
      ) : null}
      <Dial run={run} left={left} done={done} />

      <div className="fbar__time">
        <span className="fbar__clock num" aria-live="off">
          {done ? 'Done' : clock(left)}
        </span>
        <span className="fbar__label">
          {done ? 'Block finished' : run.pausedAt ? 'Paused' : `${run.minutes}-minute block`}
        </span>
      </div>

      <button className="fbar__task" onClick={() => navigate(run.pick.href)} title="Go to it">
        <span className="fbar__task-title truncate">{run.pick.title}</span>
        <span className="fbar__task-go">Open</span>
      </button>

      {parking ? (
        <form
          className="fbar__park"
          onSubmit={(e) => {
            e.preventDefault()
            submitNote()
          }}
        >
          <input
            ref={noteRef}
            className="fbar__note"
            value={note}
            maxLength={280}
            placeholder="Park it and keep going…"
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setParking(false)
                setNote('')
              }
            }}
            aria-label="Park a thought for later"
          />
          <button className="fbar__btn" type="submit" title="Park it">
            <IconCheck size={13} />
          </button>
        </form>
      ) : (
        <div className="fbar__acts">
          <button
            className="fbar__btn"
            onClick={() => setParking(true)}
            title="Park a thought for later"
          >
            <IconPlus size={13} />
            <span>Park a thought</span>
          </button>
          {!done ? (
            <button
              className="fbar__btn"
              onClick={() => {
                if (!run.pausedAt) return setState((s) => pauseFocus(s))
                setState((s) => resumeFocus(s))
                navigate(run.pick.href)
              }}
              disabled={!run.pausedAt && pauseIn > 0}
              title={
                run.pausedAt
                  ? 'Resume the block and go back to it'
                  : pauseIn > 0
                    ? `A block can be paused once every ${PAUSE_COOLDOWN_MS / 60_000} minutes of focus. "I'm done" ends it now.`
                    : 'Pause the block; you can leave this page while it is paused'
              }
            >
              {run.pausedAt ? <IconPlay size={12} /> : <IconPause size={12} />}
              <span className="num">{run.pausedAt ? 'Resume' : pauseIn > 0 ? `Pause in ${clock(pauseIn)}` : 'Pause'}</span>
            </button>
          ) : null}
          <button
            className="fbar__btn fbar__btn--end"
            onClick={() => {
              setState((s) => endFocus(s))
              navigate('/focus')
            }}
            title={done ? 'Close out the block' : 'End the block and keep the time'}
          >
            {done ? <IconCheck size={13} /> : <IconX size={12} />}
            <span>{done ? 'Finish' : "I'm done"}</span>
          </button>
        </div>
      )}
    </div>
  )
}

/** m:ss, and never a negative number. */
function clock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

/* ── The dial ────────────────────────────────────────────────────────────────
   The digits already say how long is left, so the ring is not there to tell
   her the number again. It is there so that the amount remaining is legible
   without reading anything — a shape she can take in from the corner of her
   eye while she is in the middle of a sentence, which is exactly when she
   should not be doing arithmetic about her own study session.

   It empties rather than fills. A ring that fills celebrates elapsed time; a
   ring that empties shows a thing getting smaller, which is the honest and
   the more reassuring picture of a block she committed to. */

const DIAL_R = 15
const DIAL_C = 2 * Math.PI * DIAL_R

function Dial({ run, left, done }: { run: FocusRun; left: number; done: boolean }) {
  const total = run.minutes * 60_000
  const remaining = total > 0 ? Math.min(1, Math.max(0, left / total)) : 0
  return (
    <svg
      className="fbar__dial"
      width="36"
      height="36"
      viewBox="0 0 36 36"
      data-done={done}
      data-paused={!!run.pausedAt}
      aria-hidden="true"
    >
      <circle className="fbar__dial-track" cx="18" cy="18" r={DIAL_R} />
      <circle
        className="fbar__dial-arc"
        cx="18"
        cy="18"
        r={DIAL_R}
        strokeDasharray={DIAL_C}
        strokeDashoffset={DIAL_C * (1 - remaining)}
      />
    </svg>
  )
}
