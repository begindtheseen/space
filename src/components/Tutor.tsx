/* ============================================================================
   ORBIT — the tutor, on screen
   ----------------------------------------------------------------------------
   When a run does not pass, a small card rises near the bottom of the lesson
   and the voice says what it sees (learn/tutor.ts). The words fill in as they
   are said, the way a person's would reach her, and stay there to reread
   once the voice has finished. "Say it again" repeats it; the cross puts it
   away; a run that passes puts it away by itself, without a word.

   One card for the whole app, mounted once, so a line is never said twice
   by two copies of the page, and a new line simply takes the old one's place.
   ========================================================================== */
import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { IconRefresh, IconX } from '@/components/icons'
import { useLearner } from '@/hooks/useLearner'
import { DEFAULT_SPEECH_RATE } from '@/lib/speech'
import { canSay, say, stopSaying } from '@/lib/voice/say'
import './tutor.css'

/* ── The one channel into the card ───────────────────────────────────────── */

type Listener = (text: string | null) => void
const listeners = new Set<Listener>()

/** Has the tutor say `text` (markdown). */
export function tutorSpeak(text: string): void {
  for (const l of listeners) l(text)
}

/** Puts the card away and stops the voice. */
export function tutorDismiss(): void {
  for (const l of listeners) l(null)
}

/* ── Words, revealed as they are said ────────────────────────────────────── */

/** The line as words and code, so each can be revealed in turn. */
function tokens(text: string): { code: boolean; text: string }[] {
  const out: { code: boolean; text: string }[] = []
  for (const [i, part] of text.split(/`([^`]+)`/).entries()) {
    if (i % 2) out.push({ code: true, text: part })
    else for (const w of part.split(/(\s+)/)) if (w) out.push({ code: false, text: w })
  }
  return out
}

export function TutorHost() {
  const { state } = useLearner()
  const [line, setLine] = useState<{ n: number; text: string } | null>(null)
  const [share, setShare] = useState(1)
  const [speaking, setSpeaking] = useState(false)
  const settings = useRef(state.settings)
  settings.current = state.settings
  const n = useRef(0)

  const speak = useCallback((text: string) => {
    const s = settings.current
    if (!canSay()) {
      setShare(1)
      return
    }
    setShare(0)
    setSpeaking(true)
    const saying = say(text, { voiceName: s.voiceName, rate: s.speechRate ?? DEFAULT_SPEECH_RATE, onProgress: setShare })
    void saying.done.then(() => {
      setSpeaking(false)
      setShare(1)
    })
  }, [])

  useEffect(() => {
    const on: Listener = (text) => {
      if (text === null) {
        stopSaying()
        setSpeaking(false)
        setLine(null)
        return
      }
      n.current += 1
      setLine({ n: n.current, text })
      speak(text)
    }
    listeners.add(on)
    return () => {
      listeners.delete(on)
    }
  }, [speak])

  // Leaving the page puts it away.
  useEffect(() => {
    const away = () => tutorDismiss()
    window.addEventListener('hashchange', away)
    return () => window.removeEventListener('hashchange', away)
  }, [])

  if (!line || typeof document === 'undefined') return null
  const words = tokens(line.text)
  const spokenWords = words.filter((w) => w.code || w.text.trim()).length
  let shown = Math.ceil(share * spokenWords)
  return createPortal(
    <aside className="tutor" key={line.n} role="status" aria-live="polite" data-speaking={speaking}>
      <div className="tutor__face" aria-hidden="true">
        <span className="tutor__ring" />
        <span className="tutor__ring tutor__ring--2" />
        <span className="tutor__core" />
      </div>
      <div className="tutor__body">
        <div className="tutor__who">Your guide</div>
        <p className="tutor__text" aria-label={line.text.replace(/`/g, '')}>
          {words.map((w, i) => {
            const counts = w.code || !!w.text.trim()
            const later = counts ? shown-- <= 0 : shown <= 0
            return (
              <Fragment key={i}>
                {w.code ? (
                  <code className="tutor__code" data-later={later}>
                    {w.text}
                  </code>
                ) : (
                  <span data-later={later}>{w.text}</span>
                )}
              </Fragment>
            )
          })}
        </p>
        <div className="tutor__actions">
          <button type="button" className="tutor__again" onClick={() => speak(line.text)} disabled={speaking}>
            <IconRefresh size={11} /> Say it again
          </button>
        </div>
      </div>
      <button type="button" className="tutor__close" onClick={tutorDismiss} aria-label="Close">
        <IconX size={11} />
      </button>
    </aside>,
    document.body,
  )
}
