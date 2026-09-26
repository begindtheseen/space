/* ============================================================================
   ORBIT — read-aloud controls
   ----------------------------------------------------------------------------
   Deliberately small and deliberately near the top of the lesson, because the
   moment she needs it is before she has started, not after she has given up.

   The sentence counter is not decoration either. Hearing "sentence 40 of 240"
   is the same promise a focus block makes: the thing has an end and she can
   see where it is.

   The natural voices come first in the picker, and are the default: they read
   like a person. The device's own voices follow, for anyone who prefers one.
   ========================================================================== */
import { createPortal } from 'react-dom'
import { IconPause, IconPlay, IconX } from '@/components/icons'
import { useLearner } from '@/hooks/useLearner'
import { useReadAloud } from '@/hooks/useReadAloud'
import { DEFAULT_SPEECH_RATE, speechRateOptions } from '@/lib/speech'
import { NATURAL_PREFIX, NATURAL_VOICES, naturalVoiceFor } from '@/lib/voice/kokoro'
import './read-aloud.css'

export function ReadAloud({ markdown }: { markdown: string | null }) {
  const { state: learner, setState } = useLearner()
  const rate = learner.settings.speechRate ?? DEFAULT_SPEECH_RATE
  const player = useReadAloud({
    markdown,
    voiceName: learner.settings.voiceName,
    rate,
  })

  if (!player.supported || player.total === 0) return null

  const idle = player.state === 'idle'
  const preparing = player.state === 'preparing'
  const setting = learner.settings.voiceName ?? ''
  // The picker shows the natural voice actually in use, so '' (the default)
  // reads as its name rather than as a blank.
  const shown = player.naturalAvailable && naturalVoiceFor(setting) ? `${NATURAL_PREFIX}${naturalVoiceFor(setting)!.id}` : setting

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
      {idle ? (
        <button
          className="raloud__btn raloud__btn--go"
          onClick={() => player.start(0)}
          onPointerEnter={player.warm}
          onFocus={player.warm}
          title={
            player.engine === 'recorded'
              ? 'This lesson is recorded in a natural voice, so it plays straight away and follows along word by word.'
              : player.engine === 'natural'
                ? 'A natural voice, made on this device. The first time, it downloads once (about 92 MB).'
                : undefined
          }
        >
          <IconPlay size={12} /> Read aloud
        </button>
      ) : (
        <>
          {preparing ? (
            <span className="raloud__prep" role="status">
              <span className="raloud__spin" aria-hidden="true" />
              {preparingLabel}
            </span>
          ) : (
            <button
              className="raloud__btn"
              onClick={() => (player.state === 'paused' ? player.resume() : player.pause())}
            >
              {player.state === 'paused' ? <IconPlay size={12} /> : <IconPause size={12} />}
              <span>{player.state === 'paused' ? 'Resume' : 'Pause'}</span>
            </button>
          )}

          <button className="raloud__btn" onClick={() => player.skip(-1)} title="Back a sentence">
            &minus;
          </button>
          <button className="raloud__btn" onClick={() => player.skip(1)} title="On a sentence">
            +
          </button>

          <span className="raloud__at num">
            {player.at + 1} / {player.total}
          </span>

          <button className="raloud__btn" onClick={player.stop} title="Stop reading">
            <IconX size={11} />
          </button>
        </>
      )}

      {player.naturalAvailable || player.voices.length > 1 ? (
        <select
          className="raloud__voice"
          value={shown}
          aria-label="Voice"
          onChange={(e) => {
            const name = e.target.value || undefined
            // Recorded only; the player re-says the current sentence in the new
            // voice once the choice settles, for the same reason as the speed.
            setState((s) => ({ ...s, settings: { ...s.settings, voiceName: name } }))
          }}
        >
          {player.naturalAvailable ? (
            <optgroup label="Natural voices">
              {NATURAL_VOICES.map((v) => (
                <option key={v.id} value={`${NATURAL_PREFIX}${v.id}`}>
                  {v.name} · {v.describe}
                </option>
              ))}
            </optgroup>
          ) : (
            <option value="">Best available</option>
          )}
          {player.voices.length ? (
            <optgroup label="This device's voices">
              {player.voices.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name}
                </option>
              ))}
            </optgroup>
          ) : null}
        </select>
      ) : null}

      <select
        className="raloud__rate"
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

      {player.notice ? (
        <p className="raloud__notice" role="status">
          {player.notice}
        </p>
      ) : null}
    </div>
  )
}
