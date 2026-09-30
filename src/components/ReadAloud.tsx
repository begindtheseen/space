/* ============================================================================
   ORBIT — read-aloud controls
   ----------------------------------------------------------------------------
   One quiet capsule near the top of the lesson: Read aloud, and how fast.
   Everything else about the voice (which one it is, whether it talks her
   through a run that did not pass) lives in Settings, so the lesson itself
   carries only what she reaches for while reading.

   While it reads, the capsule becomes the player: pause, a sentence back, a
   thin line that fills as the lesson goes, a sentence on, and stop. The line
   is the same promise the old "sentence 40 of 240" made, the thing has an
   end and she can see where it is, without numbers to read.

   Scrolled past, the capsule is out of reach just when she wants it, so while
   the voice is on a player docks at the bottom of the window, the way a song
   does in a music app: the lesson, what the voice is doing, and the same
   controls. It leaves again when the capsule is back in view. The space bar
   pauses and plays from anywhere on the page that is not taking typing.

   During a focus block the controls sit on the focus strip at the bottom
   instead (lib/voice/slot.ts), always there, and no second player docks
   above it.
   ========================================================================== */
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { IconPause, IconPlay, IconWave, IconX } from '@/components/icons'
import { Scrubber, SkipButton } from '@/components/Scrubber'
import { useLearner } from '@/hooks/useLearner'
import { useReadAloud } from '@/hooks/useReadAloud'
import { DEFAULT_SPEECH_RATE, speechRateOptions } from '@/lib/speech'
import { registerReader } from '@/lib/voice/say'
import { useVoiceSlot } from '@/lib/voice/slot'
import './read-aloud.css'

export interface ReadAloudProps {
  markdown: string | null
  /** The element the text is rendered in, for following along (default `.reader__md`). */
  contentSelector?: string
  /** Stops written into the text (learn/reading.ts): what to do at one, and what to say while waiting there. */
  pauses?: { run: (id: string, signal: AbortSignal) => Promise<void>; label: (id: string) => string }
  /** What is being read, for the docked player: the lesson's title. */
  title?: string
}

/** Whether a key pressed here is meant for what has focus (typing, a control) rather than for the page. */
export function keyIsForFocus(target: EventTarget | null): boolean {
  const t = target as HTMLElement | null
  if (!t?.closest) return false
  return !!t.closest(
    'input, textarea, select, button, a[href], summary, [contenteditable]:not([contenteditable="false"]), [role="button"], [role="textbox"], [role="slider"], [role="tab"], [role="checkbox"], [role="radio"], [role="option"], [role="menuitem"], [role="dialog"], .cm-editor, .term',
  )
}

export function ReadAloud({ markdown, contentSelector, pauses, title }: ReadAloudProps) {
  const { state: learner, setState } = useLearner()
  const rate = learner.settings.speechRate ?? DEFAULT_SPEECH_RATE
  const player = useReadAloud({
    markdown,
    voiceName: learner.settings.voiceName,
    rate,
    ...(contentSelector ? { contentSelector } : {}),
    ...(pauses ? { onPause: pauses.run } : {}),
  })
  const waiting = player.state === 'waiting'

  // The tutor can speak over the reading: it steps aside for the line, then carries on where it was.
  const live = useRef(player)
  live.current = player
  useEffect(
    () =>
      registerReader({
        // A device voice she paused counts too: the synthesiser is shared, and a paused one would hold the line back.
        busy: () => {
          const s = live.current.state
          return s === 'speaking' || s === 'preparing' || (s === 'paused' && live.current.engine === 'device')
        },
        hold: () => {
          const p = live.current
          // The device's voice cannot be paused under another line, so it stops, and starts again at the
          // same sentence afterwards if it was reading (not if she had paused it).
          if (p.engine === 'device') {
            const at = Math.max(0, p.at)
            const reading = p.state !== 'paused'
            p.stop()
            return () => {
              if (reading) live.current.start(at)
            }
          }
          p.pause()
          return () => live.current.resume()
        },
      }),
    [],
  )

  // The capsule scrolled out of sight (under the top bar counts as out of sight): the player docks.
  const focusSlot = useVoiceSlot()
  // Where a held back or on button has scanned to, until it is let go.
  const [scan, setScan] = useState<number | null>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const [barHidden, setBarHidden] = useState(false)
  const shown = player.supported && player.total > 0
  useEffect(() => {
    const el = barRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const top = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--topbar-h')) || 62
    const io = new IntersectionObserver(([e]) => setBarHidden(!!e && !e.isIntersecting), { rootMargin: `-${top}px 0px 0px 0px` })
    io.observe(el)
    return () => io.disconnect()
  }, [shown])

  // The space bar: play, pause, play again. Left alone when something that takes keys has focus, or a window is open over the page.
  useEffect(() => {
    if (!shown) return
    const key = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return
      if (keyIsForFocus(e.target) || document.querySelector('[aria-modal="true"]')) return
      const p = live.current
      // The arrow keys go back and on a sentence while it reads.
      if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && p.state !== 'idle') {
        e.preventDefault()
        p.skip(e.key === 'ArrowLeft' ? -1 : 1)
        return
      }
      if (e.key !== ' ' || e.repeat) return
      e.preventDefault()
      if (p.state === 'idle') p.start(0)
      else if (p.state === 'paused') p.resume()
      else if (p.state === 'speaking') p.pause()
    }
    addEventListener('keydown', key)
    return () => removeEventListener('keydown', key)
  }, [shown])

  if (!shown) return null

  const idle = player.state === 'idle'
  const preparing = player.state === 'preparing'
  const paused = player.state === 'paused'

  const preparingLabel =
    player.engine === 'recorded'
      ? 'Loading…'
      : player.naturalStatus === 'downloading'
        ? `Getting the voice ready · ${Math.round(player.progress * 100)}%`
        : player.naturalStatus === 'starting'
          ? 'Starting the voice…'
          : 'Preparing…'

  const main = waiting ? (
    <span className="raloud__status" role="status">
      {player.waitingOn && pauses ? pauses.label(player.waitingOn) : 'Waiting…'}
    </span>
  ) : preparing && (player.naturalStatus === 'downloading' || player.naturalStatus === 'starting' || player.at < 0) ? (
    // Getting the voice itself ready, the first time: worth the words.
    <span className="raloud__status" role="status">
      <span className="raloud__spin" aria-hidden="true" />
      {preparingLabel}
    </span>
  ) : preparing ? (
    // A sentence being made after a jump: a spinner in the button's own place, so nothing moves under her pointer.
    <span className="raloud__icon raloud__icon--main raloud__icon--busy" role="status" aria-label={preparingLabel} title={preparingLabel}>
      <span className="raloud__spin" aria-hidden="true" />
    </span>
  ) : (
    <button
      className="raloud__icon raloud__icon--main"
      onClick={() => (paused ? player.resume() : player.pause())}
      aria-label={paused ? 'Resume' : 'Pause'}
      title={paused ? 'Resume (space)' : 'Pause (space)'}
    >
      {paused ? <IconPlay size={12} /> : <IconPause size={12} />}
    </button>
  )
  const seek = (i: number) => player.start(i)
  const skipButton = (dir: -1 | 1, size = 12) => (
    <SkipButton dir={dir} at={player.at} total={player.total} onSkip={player.skip} onSeek={seek} scanTo={setScan} size={size} />
  )
  const back = skipButton(-1)
  const on = skipButton(1)
  const stop = (
    <button className="raloud__icon" onClick={player.stop} aria-label="Stop reading" title="Stop reading">
      <IconX size={11} />
    </button>
  )
  const speed = (
    <label className="raloud__rate" title="Reading speed">
      <span aria-hidden="true">{rate}×</span>
      <select
        value={String(rate)}
        aria-label="Reading speed"
        onChange={(e) => {
          const next = Number(e.target.value)
          // Only record the choice. The player picks it up itself: restarting
          // from here used the `start` of the render before the change, which
          // still carried the old speed, so the sentence came back at exactly
          // the speed she had just moved away from.
          setState((s) => ({ ...s, settings: { ...s.settings, speechRate: next } }))
        }}
      >
        {speechRateOptions(rate).map((r) => (
          <option key={r} value={String(r)}>
            {r}×
          </option>
        ))}
      </select>
    </label>
  )
  const track = (className: string, times = false) => (
    <Scrubber className={className} at={player.at} total={player.total} texts={player.texts} rate={rate} onSeek={seek} scanning={scan} times={times} />
  )
  const doing = waiting
    ? player.waitingOn && pauses
      ? pauses.label(player.waitingOn)
      : 'Waiting for you'
    : preparing
      ? preparingLabel
      : paused
        ? 'Paused'
        : player.wordOffscreen
          ? 'Click to follow along'
          : 'Reading aloud'
  const docked = !idle && barHidden && !focusSlot
  const go = (label: string) => (
    <button
      className="raloud__go"
      onClick={() => player.start(0)}
      onPointerEnter={player.warm}
      onFocus={player.warm}
      title={
        player.engine === 'recorded'
          ? 'This lesson is recorded in a natural voice, so it plays straight away and follows along word by word. (Space plays and pauses.)'
          : player.engine === 'natural'
            ? 'A natural voice, made on this device. The first time, it downloads once (about 92 MB). Choose the voice in Settings. (Space plays and pauses.)'
            : 'Choose the voice in Settings. (Space plays and pauses.)'
      }
    >
      <IconPlay size={12} />
      <span>{label}</span>
    </button>
  )

  return (
    <div className="raloud" ref={barRef} data-on={!idle} data-engine={player.engine} data-state={player.state}>
      {player.wordOffscreen && typeof document !== 'undefined'
        ? createPortal(
            <button className="raloud-jump" onClick={player.jumpToWord}>
              Back to the word being read
            </button>,
            document.body,
          )
        : null}
      <div className="raloud__pill">
        {idle ? (
          go('Read aloud')
        ) : (
          <>
            {main}
            {back}
            {track('raloud__track')}
            {on}
            {stop}
          </>
        )}
        <span className="raloud__sep" aria-hidden="true" />
        {speed}
      </div>

      {player.notice ? (
        <p className="raloud__notice" role="status">
          {player.notice}
        </p>
      ) : null}

      {focusSlot
        ? createPortal(
            <div className="raloud raloud--strip" data-on={!idle} data-state={player.state} role="group" aria-label="Read aloud">
              {idle ? (
                go('Read aloud')
              ) : (
                <>
                  {/* Tells the voice's pause from the block's own, a few buttons along. */}
                  <IconWave size={13} className="raloud__mark" aria-hidden="true" />
                  {main}
                  {back}
                  {track('raloud__track')}
                  {on}
                  {stop}
                </>
              )}
              <span className="raloud__sep" aria-hidden="true" />
              {speed}
            </div>,
            focusSlot,
          )
        : null}

      <Dock show={docked}>
        <button
          type="button"
          className="raloud-dock__now"
          onClick={() => (player.wordOffscreen ? player.jumpToWord() : barRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }))}
          title="Back to where the voice is"
        >
          <span className="raloud-dock__art" data-playing={player.state === 'speaking'} aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
          <span className="raloud-dock__words">
            <span className="raloud-dock__title">{title ?? 'This lesson'}</span>
            <span className="raloud-dock__doing">{doing}</span>
          </span>
        </button>
        <span className="raloud-dock__middle">
          <span className="raloud-dock__controls">
            {skipButton(-1, 15)}
            {waiting ? <span className="raloud-dock__wait" /> : preparing ? <span className="raloud__icon raloud__icon--main raloud__icon--busy" role="status" aria-label={preparingLabel}><span className="raloud__spin" aria-hidden="true" /></span> : main}
            {skipButton(1, 15)}
          </span>
          {track('raloud-dock__track', true)}
        </span>
        <span className="raloud-dock__end">
          {speed}
          {stop}
        </span>
      </Dock>
    </div>
  )
}

/**
 * The docked player, drawn over the lesson's column (not the sidebar) and kept on the page while hidden, so it
 * can slide in and out rather than blink. Hidden, it takes no clicks and no focus.
 */
function Dock({ show, children }: { show: boolean; children: ReactNode }) {
  if (typeof document === 'undefined') return null
  const host = document.querySelector('.shell > .main') ?? document.body
  return createPortal(
    <div className="raloud-dock" data-show={show} aria-hidden={!show} inert={!show} role="region" aria-label="Read aloud player">
      {children}
    </div>,
    host,
  )
}
