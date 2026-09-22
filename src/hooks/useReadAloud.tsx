/* ============================================================================
   ORBIT — the read-aloud player
   ----------------------------------------------------------------------------
   Drives the browser's own synthesiser through a lesson, one sentence at a
   time. The interesting parts are all defensive, because this API is one of
   the least reliable in the platform:

     - Chromium stops speaking after roughly fifteen seconds unless it is
       nudged. The fix is a periodic pause/resume, which is a real bug
       workaround and not superstition; without it a lesson stops mid-page.
     - Queueing the whole lesson up front loses the queue on any hiccup and
       makes "stop" slow. One utterance at a time, chained on its end event,
       keeps the position exact and cancellation instant.
     - `getVoices()` is empty on first call in several browsers and fills in
       later, so the list is read again on `voiceschanged`.
     - `cancel()` sometimes fires an error event on the utterance in flight,
       which must not be reported as a failure.
   ========================================================================== */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { prepare, usableVoices, type VoiceLike } from '@/lib/speech'

/** How often to nudge Chromium so it does not fall silent mid-lesson. */
const KEEPALIVE_MS = 10_000

export type ReadState = 'idle' | 'speaking' | 'paused'

export interface ReadAloud {
  supported: boolean
  state: ReadState
  /** Index of the sentence being spoken, or -1. */
  at: number
  total: number
  voices: VoiceLike[]
  start: (from?: number) => void
  pause: () => void
  resume: () => void
  stop: () => void
  skip: (delta: number) => void
}

export interface ReadAloudOptions {
  /** Lesson markdown. Prepared into speakable sentences internally. */
  markdown: string | null
  voiceName?: string
  rate?: number
}

export function useReadAloud({ markdown, voiceName, rate = 1 }: ReadAloudOptions): ReadAloud {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window

  const [voices, setVoices] = useState<VoiceLike[]>([])
  const [state, setState] = useState<ReadState>('idle')
  const [at, setAt] = useState(-1)

  const utterances = useMemo(() => (markdown ? prepare(markdown).utterances : []), [markdown])

  // The index is held in a ref as well so the chain can advance without the
  // callback closing over a stale value.
  const atRef = useRef(-1)
  const stopping = useRef(false)

  useEffect(() => {
    if (!supported) return
    const read = () => setVoices(usableVoices(window.speechSynthesis.getVoices()))
    read()
    window.speechSynthesis.addEventListener('voiceschanged', read)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', read)
  }, [supported])

  const pickVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (!supported) return null
    const all = window.speechSynthesis.getVoices()
    const wanted = voiceName && all.find((v) => v.name === voiceName)
    if (wanted) return wanted
    const best = usableVoices(all)[0]
    return best ? (all.find((v) => v.name === best.name) ?? null) : null
  }, [supported, voiceName])

  const speakFrom = useCallback(
    (index: number) => {
      if (!supported) return
      if (index < 0 || index >= utterances.length) {
        atRef.current = -1
        setAt(-1)
        setState('idle')
        return
      }
      atRef.current = index
      setAt(index)

      const u = new SpeechSynthesisUtterance(utterances[index])
      const voice = pickVoice()
      if (voice) {
        u.voice = voice
        // Some engines ignore the voice unless the language agrees with it.
        u.lang = voice.lang
      }
      u.rate = rate
      u.onend = () => {
        if (stopping.current) return
        speakFrom(atRef.current + 1)
      }
      u.onerror = () => {
        // `cancel()` raises this on the utterance in flight. Anything else is
        // a real failure of one sentence, and skipping it beats stopping.
        if (stopping.current) return
        speakFrom(atRef.current + 1)
      }
      window.speechSynthesis.speak(u)
      setState('speaking')
    },
    [supported, utterances, pickVoice, rate],
  )

  const stop = useCallback(() => {
    if (!supported) return
    stopping.current = true
    window.speechSynthesis.cancel()
    atRef.current = -1
    setAt(-1)
    setState('idle')
    // Released on the next tick so the cancel-triggered error event, which
    // arrives asynchronously, is still recognised as ours.
    setTimeout(() => {
      stopping.current = false
    }, 0)
  }, [supported])

  const start = useCallback(
    (from = 0) => {
      if (!supported || utterances.length === 0) return
      stopping.current = true
      window.speechSynthesis.cancel()
      stopping.current = false
      speakFrom(Math.max(0, Math.min(from, utterances.length - 1)))
    },
    [supported, utterances.length, speakFrom],
  )

  const pause = useCallback(() => {
    if (!supported) return
    window.speechSynthesis.pause()
    setState('paused')
  }, [supported])

  const resume = useCallback(() => {
    if (!supported) return
    window.speechSynthesis.resume()
    setState('speaking')
  }, [supported])

  const skip = useCallback(
    (delta: number) => {
      const next = (atRef.current < 0 ? 0 : atRef.current) + delta
      if (next < 0 || next >= utterances.length) return
      start(next)
    },
    [utterances.length, start],
  )

  // The Chromium keepalive. A pause immediately followed by a resume is a
  // no-op to the listener and resets the watchdog that would otherwise cut
  // the voice off.
  useEffect(() => {
    if (!supported || state !== 'speaking') return
    const id = setInterval(() => {
      const s = window.speechSynthesis
      if (s.speaking && !s.paused) {
        s.pause()
        s.resume()
      }
    }, KEEPALIVE_MS)
    return () => clearInterval(id)
  }, [supported, state])

  // Leaving the lesson, or swapping to another one, must not leave a voice
  // reading a page that is no longer on screen.
  useEffect(() => {
    if (!supported) return
    return () => {
      stopping.current = true
      window.speechSynthesis.cancel()
    }
  }, [supported, markdown])

  return {
    supported,
    state,
    at,
    total: utterances.length,
    voices,
    start,
    pause,
    resume,
    stop,
    skip,
  }
}
