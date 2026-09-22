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
   ========================================================================== */
import { useEffect, useRef, useState } from 'react'
import { IconCheck, IconPause, IconPlay, IconPlus, IconX } from '@/components/icons'
import { endFocus, park, pauseFocus, resumeFocus } from '@/engine/apply'
import { isComplete, remainingMs, type FocusRun } from '@/engine/focus'
import { useLearner } from '@/hooks/useLearner'
import { navigate } from '@/lib/router'
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
  const noteRef = useRef<HTMLInputElement | null>(null)

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

  const submitNote = () => {
    const text = note
    setNote('')
    setParking(false)
    if (text.trim()) setState((s) => park(s, text))
  }

  return (
    <div className="fbar" data-done={done} role="region" aria-label="Focus block">
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
              onClick={() => setState((s) => (run.pausedAt ? resumeFocus(s) : pauseFocus(s)))}
              title={run.pausedAt ? 'Resume the block' : 'Pause the block'}
            >
              {run.pausedAt ? <IconPlay size={12} /> : <IconPause size={12} />}
              <span>{run.pausedAt ? 'Resume' : 'Pause'}</span>
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
