/* ============================================================================
   ORBIT — moving through a reading
   ----------------------------------------------------------------------------
   The line that shows how far the voice has got is also how she moves: click
   anywhere on it to go there, or drag, and a card above it shows the sentence
   she would land on and when it comes. The two buttons either side go back or
   on a sentence at a tap; held down, they scan, faster the longer they are
   held, the light racing along the line, and letting go reads from there.

   Going forward stops at practice she has not done yet: the line past it is
   shaded, a mark shows where the practice is, and dragging or scanning comes
   to rest there. Going back is always open.

   The reading is made of sentences, so that is what the line counts in. The
   times are worked out from how long each sentence is and the speed she reads
   at: close to what the voice takes, and good for "about a minute left".
   ========================================================================== */
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { IconForward, IconRewind } from '@/components/icons'

/** How many characters of a lesson the voice says in a second, at 1×. */
const CHARS_PER_SECOND = 14.5
/** The breath between sentences, in seconds at 1×. */
const BETWEEN = 0.35

/** When each sentence starts, in seconds from the beginning at `rate`, and (last) how long the whole reading is. */
export function sentenceTimes(texts: string[], rate: number): number[] {
  const out = [0]
  let t = 0
  for (const s of texts) {
    if (s) t += (s.length / CHARS_PER_SECOND + BETWEEN) / Math.max(0.25, rate)
    out.push(t)
  }
  return out
}

/** m:ss */
export function clock(seconds: number): string {
  const s = Math.max(0, Math.round(seconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export interface ScrubberProps {
  at: number
  total: number
  texts: string[]
  rate: number
  onSeek: (index: number) => void
  /** Where a held button has scanned to, shown in place of `at` until it is let go. */
  scanning?: number | null
  /** Elapsed and remaining times either side of the line. */
  times?: boolean
  className?: string
  /** The furthest sentence she can go to (the next practice not done); defaults to the last. */
  limit?: number
  /** Where the practice still to do is, marked on the line. */
  marks?: number[]
}

export function Scrubber({ at, total, texts, rate, onSeek, scanning = null, times = false, className = '', limit, marks = [] }: ScrubberProps) {
  const last = Math.max(0, Math.min(total - 1, limit ?? total - 1))
  const track = useRef<HTMLSpanElement>(null)
  const [hover, setHover] = useState<{ i: number; x: number } | null>(null)
  const [drag, setDrag] = useState<number | null>(null)
  const starts = useMemo(() => sentenceTimes(texts, rate), [texts, rate])
  const length = starts[starts.length - 1] ?? 0

  const indexAt = useCallback(
    (clientX: number): { i: number; x: number } => {
      const box = track.current!.getBoundingClientRect()
      const f = Math.min(1, Math.max(0, (clientX - box.left) / Math.max(1, box.width)))
      return { i: Math.min(total - 1, Math.floor(f * total)), x: f * box.width }
    },
    [total],
  )

  const down = (e: ReactPointerEvent<HTMLSpanElement>) => {
    if (e.button !== 0 || !total) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    const h = indexAt(e.clientX)
    setDrag(Math.min(h.i, last))
    setHover(h)
  }
  const move = (e: ReactPointerEvent<HTMLSpanElement>) => {
    if (!total || !track.current) return
    const h = indexAt(e.clientX)
    setHover(h)
    if (drag !== null) setDrag(Math.min(h.i, last))
  }
  const up = (e: ReactPointerEvent<HTMLSpanElement>) => {
    if (drag === null) return
    const h = indexAt(e.clientX)
    setDrag(null)
    onSeek(Math.min(h.i, last))
  }

  const shown = drag ?? scanning ?? at
  const share = total > 0 && shown >= 0 ? Math.min(1, (shown + 1) / total) : 0
  // The card: the sentence under the pointer, or where a drag or a scan has got to.
  const peek = drag ?? scanning ?? hover?.i ?? null
  const peekX = drag !== null || hover ? (hover?.x ?? 0) : scanning !== null ? share * (track.current?.getBoundingClientRect().width ?? 0) : 0
  const beyond = hover !== null && drag === null && hover.i > last
  const peekText = beyond
    ? 'Finish the practice first: the reading goes on past here once it passes.'
    : peek !== null
      ? texts[peek] || 'A stop in the lesson: it waits for you here.'
      : ''
  const now = starts[Math.max(0, shown)] ?? 0

  return (
    <span className={`scrub ${className}`} data-active={drag !== null || scanning !== null}>
      {times ? <span className="scrub__time num">{clock(now)}</span> : null}
      <span
        className="scrub__hit"
        ref={track}
        role="slider"
        tabIndex={0}
        aria-label="Where the reading is"
        aria-valuemin={1}
        aria-valuemax={Math.max(1, total)}
        aria-valuenow={Math.max(1, shown + 1)}
        aria-valuetext={`Sentence ${Math.max(1, shown + 1)} of ${total}, ${clock(now)} of about ${clock(length)}${last < total - 1 ? `; practice at sentence ${last + 1} comes first` : ''}`}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={() => setDrag(null)}
        onPointerLeave={() => drag === null && setHover(null)}
        onKeyDown={(e) => {
          const step = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1, PageDown: -10, PageUp: 10 }[e.key]
          const to = e.key === 'Home' ? 0 : e.key === 'End' ? total - 1 : step !== undefined ? Math.max(0, at) + step : null
          if (to === null) return
          e.preventDefault()
          e.stopPropagation()
          onSeek(Math.max(0, Math.min(last, to)))
        }}
      >
        <span className="scrub__rail">
          <span className="scrub__fill" style={{ width: `${(share * 100).toFixed(2)}%` }} />
          {hover && drag === null ? <span className="scrub__ghost" style={{ width: `${(((Math.min(hover.i, last) + 1) / total) * 100).toFixed(2)}%` }} /> : null}
          {last < total - 1 ? <span className="scrub__locked" style={{ left: `${(((last + 1) / total) * 100).toFixed(2)}%` }} /> : null}
        </span>
        {marks.map((k) => (
          <span key={k} className="scrub__mark" data-next={k === last} style={{ left: `${(((k + 0.5) / total) * 100).toFixed(2)}%` }} title="Practice" />
        ))}
        <span className="scrub__thumb" style={{ left: `${(share * 100).toFixed(2)}%` }} />
        {peek !== null ? (
          <span className="scrub__peek" style={{ left: `${peekX}px` }} role="presentation">
            <span className="scrub__peek-where num">
              {beyond ? 'Practice first' : `${clock(starts[peek] ?? 0)} · sentence ${peek + 1} of ${total}`}
            </span>
            <span className="scrub__peek-text">{peekText}</span>
          </span>
        ) : null}
      </span>
      {times ? <span className="scrub__time scrub__time--left num">-{clock(length - now)}</span> : null}
    </span>
  )
}

/**
 * A back or on button: a tap moves one sentence; held, it scans, a sentence at a time and then faster, and
 * letting go reads from where it got to. `scanTo` reports the scan as it goes (null when it ends).
 */
export function SkipButton({
  dir,
  at,
  total,
  limit,
  onSkip,
  onSeek,
  scanTo,
  className = 'raloud__icon',
  size = 13,
}: {
  dir: -1 | 1
  at: number
  total: number
  /** The furthest it can scan forward to. */
  limit?: number
  onSkip: (delta: number) => void
  onSeek: (index: number) => void
  scanTo: (index: number | null) => void
  className?: string
  size?: number
}) {
  const timer = useRef(0)
  const held = useRef<{ to: number; since: number } | null>(null)
  const pressed = useRef(false)
  const live = useRef({ at, total, last: limit ?? total - 1 })
  live.current = { at, total, last: Math.min(total - 1, limit ?? total - 1) }

  const end = useCallback(
    (commit: boolean) => {
      clearTimeout(timer.current)
      const h = held.current
      held.current = null
      if (!pressed.current) return
      pressed.current = false
      if (h) {
        scanTo(null)
        if (commit) onSeek(h.to)
      } else if (commit) onSkip(dir)
    },
    [dir, onSeek, onSkip, scanTo],
  )

  useEffect(() => () => clearTimeout(timer.current), [])

  const tick = () => {
    const h = held.current
    if (!h) return
    const { last } = live.current
    const heldFor = performance.now() - h.since
    // One sentence at a time for the first second, then two, then four.
    const step = heldFor > 2600 ? 4 : heldFor > 1300 ? 2 : 1
    h.to = Math.max(0, Math.min(last, h.to + dir * step))
    scanTo(h.to)
    timer.current = window.setTimeout(tick, 180)
  }

  const label = dir < 0 ? 'Back a sentence' : 'On a sentence'
  return (
    <button
      type="button"
      className={className}
      aria-label={`${label} (hold to scan)`}
      title={`${label}. Hold to scan ${dir < 0 ? 'back' : 'ahead'}.`}
      onPointerDown={(e) => {
        if (e.button !== 0) return
        pressed.current = true
        e.currentTarget.setPointerCapture(e.pointerId)
        clearTimeout(timer.current)
        timer.current = window.setTimeout(() => {
          const { at, last } = live.current
          held.current = { to: Math.max(0, Math.min(last, Math.max(0, at) + dir)), since: performance.now() }
          scanTo(held.current.to)
          timer.current = window.setTimeout(tick, 180)
        }, 380)
      }}
      onPointerUp={() => end(true)}
      onPointerCancel={() => end(false)}
      onClick={(e) => {
        // A click from the keyboard (Enter, Space) has no pointer before it.
        if (e.detail === 0) onSkip(dir)
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {dir < 0 ? <IconRewind size={size} /> : <IconForward size={size} />}
    </button>
  )
}
