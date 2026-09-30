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
   ========================================================================== */
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { IconChevronLeft, IconChevronRight, IconPause, IconPlay, IconX } from '@/components/icons'
import { useLearner } from '@/hooks/useLearner'
import { useReadAloud } from '@/hooks/useReadAloud'
import { DEFAULT_SPEECH_RATE, speechRateOptions } from '@/lib/speech'
import { registerReader } from '@/lib/voice/say'
import './read-aloud.css'

export interface ReadAloudProps {
  markdown: string | null
  /** The element the text is rendered in, for following along (default `.reader__md`). */
  contentSelector?: string
  /** Stops written into the text (learn/reading.ts): what to do at one, and what to say while waiting there. */
  pauses?: { run: (id: string, signal: AbortSignal) => Promise<void>; label: (id: string) => string }
}

export function ReadAloud({ markdown, contentSelector, pauses }: ReadAloudProps) {
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

  if (!player.supported || player.total === 0) return null

  const idle = player.state === 'idle'
  const preparing = player.state === 'preparing'
  const paused = player.state === 'paused'
  const share = player.total > 0 && player.at >= 0 ? Math.min(1, (player.at + 1) / player.total) : 0

  const preparingLabel =
    player.engine === 'recorded'
      ? 'Loading…'
      : player.naturalStatus === 'downloading'
        ? `Getting the voice ready · ${Math.round(player.progress * 100)}%`
        : player.naturalStatus === 'starting'
          ? 'Starting the voice…'
          : 'Preparing…'

  return (
    <div className="raloud" data-on={!idle} data-engine={player.engine} data-state={player.state}>
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
          <button
            className="raloud__go"
            onClick={() => player.start(0)}
            onPointerEnter={player.warm}
            onFocus={player.warm}
            title={
              player.engine === 'recorded'
                ? 'This lesson is recorded in a natural voice, so it plays straight away and follows along word by word.'
                : player.engine === 'natural'
                  ? 'A natural voice, made on this device. The first time, it downloads once (about 92 MB). Choose the voice in Settings.'
                  : 'Choose the voice in Settings.'
            }
          >
            <IconPlay size={12} />
            <span>Read aloud</span>
          </button>
        ) : (
          <>
            {waiting ? (
              <span className="raloud__status" role="status">
                {player.waitingOn && pauses ? pauses.label(player.waitingOn) : 'Waiting…'}
              </span>
            ) : preparing ? (
              <span className="raloud__status" role="status">
                <span className="raloud__spin" aria-hidden="true" />
                {preparingLabel}
              </span>
            ) : (
              <button
                className="raloud__icon raloud__icon--main"
                onClick={() => (paused ? player.resume() : player.pause())}
                aria-label={paused ? 'Resume' : 'Pause'}
                title={paused ? 'Resume' : 'Pause'}
              >
                {paused ? <IconPlay size={12} /> : <IconPause size={12} />}
              </button>
            )}
            <button className="raloud__icon" onClick={() => player.skip(-1)} aria-label="Back a sentence" title="Back a sentence">
              <IconChevronLeft size={13} />
            </button>
            <span
              className="raloud__track"
              role="progressbar"
              aria-label="How far through the lesson"
              aria-valuemin={0}
              aria-valuemax={player.total}
              aria-valuenow={player.at + 1}
              title={`Sentence ${player.at + 1} of ${player.total}`}
            >
              <span className="raloud__fill" style={{ width: `${(share * 100).toFixed(1)}%` }} />
            </span>
            <button className="raloud__icon" onClick={() => player.skip(1)} aria-label="On a sentence" title="On a sentence">
              <IconChevronRight size={13} />
            </button>
            <button className="raloud__icon" onClick={player.stop} aria-label="Stop reading" title="Stop reading">
              <IconX size={11} />
            </button>
          </>
        )}
        <span className="raloud__sep" aria-hidden="true" />
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
      </div>

      {player.notice ? (
        <p className="raloud__notice" role="status">
          {player.notice}
        </p>
      ) : null}
    </div>
  )
}
