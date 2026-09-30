/* ============================================================================
   ORBIT — the tutor, on screen
   ----------------------------------------------------------------------------
   When a run does not pass, a small card rises near the bottom of the lesson
   and the voice says what it sees (learn/tutor.ts). Each word lights as it is
   heard, timed by the voice itself, with a soft light gliding from word to
   word, and the line stays there to reread once the voice has finished. "Say it again" repeats it; the cross puts it
   away; a run that passes puts it away by itself, without a word.

   One card for the whole app, mounted once, so a line is never said twice
   by two copies of the page, and a new line simply takes the old one's place.
   ========================================================================== */
import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { IconRefresh, IconX } from '@/components/icons'
import { useLearner } from '@/hooks/useLearner'
import { DEFAULT_SPEECH_RATE, prepare } from '@/lib/speech'
import { alignNorms, normWord } from '@/lib/voice/highlight'
import { textWords } from '@/lib/voice/kokoro'
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

/* ── Words, lit as they are said ─────────────────────────────────────────── */

type Unit = { code: boolean; text: string; said: boolean }

/** The line as words and code, so each can be lit in turn. `said` is false for the spaces between. */
function units(text: string): Unit[] {
  const out: Unit[] = []
  for (const [i, part] of text.split(/`([^`]+)`/).entries()) {
    if (i % 2) out.push({ code: true, text: part, said: true })
    else for (const w of part.split(/(\s+)/)) if (w) out.push({ code: false, text: w, said: !!w.trim() })
  }
  return out
}

/**
 * Which unit on the card each spoken word belongs to. What is said is not what is shown: `mv ../feul` is
 * said "M V dot dot slash feul", numbers are read out, symbols are named. So each unit is prepared the way
 * the voice will say it, and the words the voice actually says are lined up with those, in order
 * (alignNorms, as the lesson reader does). A spoken word with no partner stays on the unit before it.
 */
export function spokenToUnits(list: Unit[], spoken: string[]): Int32Array {
  const expected: string[] = []
  const owner: number[] = []
  list.forEach((u, k) => {
    if (!u.said) return
    const say = prepare(u.code ? `\`${u.text}\`` : u.text).utterances.join(' ')
    for (const w of textWords(say)) {
      expected.push(normWord(say.slice(w.start, w.end)))
      owner.push(k)
    }
  })
  const at = alignNorms(expected, spoken.map(normWord), 0)
  const out = new Int32Array(spoken.length).fill(-1)
  let last = -1
  for (let i = 0; i < spoken.length; i++) {
    const e = at[i]!
    if (e >= 0 && owner[e]! >= last) last = owner[e]!
    out[i] = last
  }
  return out
}

export function TutorHost() {
  const { state } = useLearner()
  const [line, setLine] = useState<{ n: number; text: string } | null>(null)
  const [share, setShare] = useState(1)
  const [now, setNow] = useState(-1)
  const [speaking, setSpeaking] = useState(false)
  const settings = useRef(state.settings)
  settings.current = state.settings
  const n = useRef(0)
  const map = useRef<Int32Array | null>(null)
  const textRef = useRef<HTMLParagraphElement>(null)
  const pillRef = useRef<HTMLSpanElement>(null)

  const speak = useCallback((text: string) => {
    const s = settings.current
    map.current = null
    setNow(-1)
    if (!canSay()) {
      setShare(1)
      return
    }
    setShare(0)
    setSpeaking(true)
    const list = units(text)
    const saying = say(text, {
      voiceName: s.voiceName,
      rate: s.speechRate ?? DEFAULT_SPEECH_RATE,
      onProgress: setShare,
      onWords: (spoken) => {
        map.current = spokenToUnits(list, spoken)
      },
      onWord: (i) => {
        const u = map.current?.[i] ?? -1
        if (u >= 0) setNow((p) => Math.max(p, u))
      },
    })
    void saying.done.then(() => {
      setSpeaking(false)
      setShare(1)
      setNow(-1)
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

  // The light under the word being said glides to the next one: measured from the word's own box, moved by
  // transform so the browser animates it without laying the card out again.
  useLayoutEffect(() => {
    const pill = pillRef.current
    const box = textRef.current
    if (!pill || !box) return
    const el = now >= 0 ? box.querySelector<HTMLElement>(`[data-u="${now}"]`) : null
    if (!el || !speaking) {
      pill.style.opacity = '0'
      return
    }
    const pad = 3
    pill.style.opacity = '1'
    pill.style.width = `${el.offsetWidth + pad * 2}px`
    pill.style.height = `${el.offsetHeight}px`
    pill.style.transform = `translate(${el.offsetLeft - pad}px, ${el.offsetTop}px)`
  }, [now, speaking, line])

  if (!line || typeof document === 'undefined') return null
  const list = units(line.text)
  const spokenUnits = list.filter((u) => u.said).length
  // Lit up to the word being said; if the voice gives no words, by how far through the line it is.
  const byShare = Math.ceil(share * spokenUnits)
  let count = 0
  return createPortal(
    <aside className="tutor" key={line.n} role="status" aria-live="polite" data-speaking={speaking}>
      <div className="tutor__face" aria-hidden="true">
        <span className="tutor__ring" />
        <span className="tutor__ring tutor__ring--2" />
        <span className="tutor__core" />
      </div>
      <div className="tutor__body">
        <div className="tutor__who">Your guide</div>
        <p className="tutor__text" ref={textRef} aria-label={line.text.replace(/`/g, '')}>
          <span className="tutor__pill" ref={pillRef} aria-hidden="true" />
          {list.map((u, i) => {
            if (u.said) count++
            const later = speaking && (now >= 0 ? i > now : count > byShare)
            return (
              <Fragment key={i}>
                {u.code ? (
                  <code className="tutor__code" data-u={i} data-later={later} data-now={i === now}>
                    {u.text}
                  </code>
                ) : (
                  <span data-u={i} data-later={later} data-now={i === now}>
                    {u.text}
                  </span>
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
