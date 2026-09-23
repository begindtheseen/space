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
       which must not be reported as a failure. It arrives asynchronously, so
       a boolean set and cleared around the cancel call is already false by the
       time it lands: the cancelled utterance then looks like a real error,
       advances the index, and a second chain starts speaking alongside the
       first. Every chain therefore carries the epoch it was started in, and a
       callback from a superseded epoch does nothing.
     - `pause()` and `resume()` are not guaranteed to land. A resume that does
       not leaves the synthesiser paused while this hook still believes it is
       speaking, which reads as the whole player freezing.
   ========================================================================== */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { prepare, usableVoices, type VoiceLike } from '@/lib/speech'

/** How often to nudge Chromium so it does not fall silent mid-lesson. */
const KEEPALIVE_MS = 10_000

/**
 * How long a speed or voice change is left to settle before the sentence in
 * flight is spoken again with it. Long enough that stepping through the list
 * restarts once at the end rather than at every value, short enough that the
 * control still feels like it did something.
 */
const SETTLE_MS = 260

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

  /**
   * Which run of the player a callback belongs to. Bumped by every start and
   * every stop, so an `onend` or `onerror` from a cancelled utterance — which
   * arrives after the call that cancelled it has returned — can tell that it
   * has been superseded and stay quiet.
   */
  const epochRef = useRef(0)

  // Speed and voice are read at the moment each sentence is spoken rather than
  // captured when playback started. Without this the whole lesson keeps the
  // settings it began with: the chain is built from callbacks that closed over
  // the values of one render, so changing the speed changed nothing at all.
  const rateRef = useRef(rate)
  const voiceNameRef = useRef(voiceName)
  useEffect(() => {
    rateRef.current = rate
    voiceNameRef.current = voiceName
  }, [rate, voiceName])

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
    const wanted = voiceNameRef.current && all.find((v) => v.name === voiceNameRef.current)
    if (wanted) return wanted
    const best = usableVoices(all)[0]
    return best ? (all.find((v) => v.name === best.name) ?? null) : null
  }, [supported])

  const speakFrom = useCallback(
    (index: number, epoch: number) => {
      if (!supported) return
      if (epoch !== epochRef.current) return
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
      // Read now, not when this chain started, so a speed chosen mid-lesson
      // applies to every sentence after it.
      u.rate = rateRef.current
      u.onend = () => {
        if (epoch !== epochRef.current) return
        speakFrom(atRef.current + 1, epoch)
      }
      u.onerror = () => {
        // `cancel()` raises this on the utterance in flight, and it lands after
        // the caller has moved on — the epoch is what tells the two apart.
        // Anything else is a real failure of one sentence, and skipping it
        // beats stopping.
        if (epoch !== epochRef.current) return
        speakFrom(atRef.current + 1, epoch)
      }
      window.speechSynthesis.speak(u)
      setState('speaking')
    },
    [supported, utterances, pickVoice],
  )

  const stop = useCallback(() => {
    if (!supported) return
    epochRef.current += 1
    window.speechSynthesis.cancel()
    atRef.current = -1
    setAt(-1)
    setState('idle')
  }, [supported])

  const start = useCallback(
    (from = 0) => {
      if (!supported || utterances.length === 0) return
      // Bumping first orphans anything the cancel below is about to interrupt,
      // so the outgoing utterance's error event cannot start a rival chain.
      epochRef.current += 1
      const epoch = epochRef.current
      window.speechSynthesis.cancel()
      speakFrom(Math.max(0, Math.min(from, utterances.length - 1)), epoch)
    },
    [supported, utterances.length, speakFrom],
  )

  const pause = useCallback(() => {
    if (!supported) return
    // Only claim paused if there is something to pause. Saying so when the
    // synthesiser is idle leaves the controls offering a resume that can never
    // do anything.
    if (!window.speechSynthesis.speaking) return
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

  // Applying a change made while she is listening.
  //
  // Doing nothing would be smooth and useless: the sentence in flight can run
  // for twenty seconds, so a speed she just chose appears not to work.
  // Restarting on every keystroke of a drag is the opposite — a stutter per
  // step. So the change is settled first and then the current sentence is
  // spoken again from its start, which is the shortest restart available:
  // sentences are capped when the lesson is prepared, so it re-reads a clause,
  // not a paragraph.
  const speakFromRef = useRef(speakFrom)
  const stateRef = useRef(state)
  useEffect(() => {
    speakFromRef.current = speakFrom
    stateRef.current = state
  }, [speakFrom, state])

  const settledOnce = useRef(false)
  useEffect(() => {
    if (!supported) return
    // The first pass is the mount, where there is nothing playing to adjust.
    if (!settledOnce.current) {
      settledOnce.current = true
      return
    }
    if (stateRef.current !== 'speaking') return
    const id = setTimeout(() => {
      const index = atRef.current
      if (index < 0 || stateRef.current !== 'speaking') return
      epochRef.current += 1
      const epoch = epochRef.current
      window.speechSynthesis.cancel()
      speakFromRef.current(index, epoch)
    }, SETTLE_MS)
    return () => clearTimeout(id)
  }, [supported, rate, voiceName])

  // The Chromium keepalive. A pause immediately followed by a resume is a
  // no-op to the listener and resets the watchdog that would otherwise cut
  // the voice off.
  useEffect(() => {
    if (!supported || state !== 'speaking') return
    const id = setInterval(() => {
      const s = window.speechSynthesis
      if (!s.speaking) return
      if (s.paused) {
        // We believe we are speaking and it is paused, which means an earlier
        // resume did not land. The old guard skipped this case, so one missed
        // resume silenced the rest of the lesson while the controls went on
        // showing it as playing.
        s.resume()
        return
      }
      s.pause()
      s.resume()
    }, KEEPALIVE_MS)
    return () => clearInterval(id)
  }, [supported, state])

  // Leaving the lesson, or swapping to another one, must not leave a voice
  // reading a page that is no longer on screen.
  useEffect(() => {
    if (!supported) return
    return () => {
      epochRef.current += 1
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
