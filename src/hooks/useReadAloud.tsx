/* ============================================================================
   ORBIT — the read-aloud player
   ----------------------------------------------------------------------------
   Reads a lesson aloud, one sentence at a time, with one of two engines:

   THE NATURAL VOICE (the default). A neural voice that sounds like a person
   reading (lib/voice/natural.ts), made on the device by a pool of workers
   and played through Web Audio. The player asks for the next few pieces of
   the lesson while the current one plays, so the voice is never waiting on
   the model; a sentence is split into pieces at its commas for the same
   reason, so the first sound comes quickly. Pausing suspends the audio
   clock, which is exact. If the natural voice cannot start — no download, an
   old browser — the player says so and falls back to the device's voice.

   THE DEVICE'S VOICE. The browser's own synthesiser, kept for anyone who
   prefers it or cannot download the model. The interesting parts are all
   defensive, because this API is one of the least reliable in the platform:

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
       every chain carries the epoch it was started in, and a callback from a
       superseded epoch does nothing.
     - `pause()` and `resume()` are not guaranteed to land. A resume that does
       not leaves the synthesiser paused while this hook still believes it is
       speaking, which reads as the whole player freezing.

   Both engines share the epoch: bumped by every start and stop, so anything
   still arriving from a run that has been superseded stays quiet.
   ========================================================================== */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { prepare, usableVoices, type VoiceLike } from '@/lib/speech'
import { SAMPLE_RATE, naturalVoiceFor, rampPieces, synthesisPieces, type NaturalVoiceInfo } from '@/lib/voice/kokoro'
import { naturalSupported, naturalVoice, poolSize, type NaturalStatus } from '@/lib/voice/natural'

/** How often to nudge Chromium so it does not fall silent mid-lesson. */
const KEEPALIVE_MS = 10_000

/**
 * How long a speed or voice change is left to settle before the sentence in
 * flight is spoken again with it. Long enough that stepping through the list
 * restarts once at the end rather than at every value, short enough that the
 * control still feels like it did something.
 */
const SETTLE_MS = 260

/** The breath between two sentences of the natural voice, in seconds. */
const SENTENCE_GAP_S = 0.14

/** Synthesised pieces kept for going back a sentence or two without making them again. */
const KEEP_PIECES = 24

export type ReadState = 'idle' | 'preparing' | 'speaking' | 'paused'
export type ReadEngine = 'natural' | 'device'

export interface ReadAloud {
  supported: boolean
  state: ReadState
  /** Index of the sentence being spoken, or -1. */
  at: number
  total: number
  /** The device's own voices, for the picker. */
  voices: VoiceLike[]
  engine: ReadEngine
  /** Whether the natural voice can run in this browser. */
  naturalAvailable: boolean
  naturalStatus: NaturalStatus
  /** Download progress of the natural voice, 0 to 1. */
  progress: number
  /** Something she should know, such as the natural voice falling back. */
  notice: string | null
  start: (from?: number) => void
  /** Starts the natural voice's workers ahead of a tap, when the model is already here. */
  warm: () => void
  pause: () => void
  resume: () => void
  stop: () => void
  skip: (delta: number) => void
}

export interface ReadAloudOptions {
  /** Lesson markdown. Prepared into speakable sentences internally. */
  markdown: string | null
  /** The voice setting: '' or undefined for the natural default, `natural:<id>`, or a device voice's name. */
  voiceName?: string
  rate?: number
}

interface Piece {
  utt: number
  text: string
  /** Last piece of its sentence: a breath follows it. */
  last: boolean
}

function audioContextClass(): typeof AudioContext | null {
  if (typeof window === 'undefined') return null
  return window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext ?? null
}

export function useReadAloud({ markdown, voiceName, rate = 1 }: ReadAloudOptions): ReadAloud {
  const deviceSupported = typeof window !== 'undefined' && 'speechSynthesis' in window
  const naturalAvailable = naturalSupported()
  const supported = deviceSupported || naturalAvailable

  const [voices, setVoices] = useState<VoiceLike[]>([])
  const [state, setState] = useState<ReadState>('idle')
  const [at, setAt] = useState(-1)
  const [notice, setNotice] = useState<string | null>(null)
  const [fellBack, setFellBack] = useState(false)
  const [natural, setNatural] = useState({ status: naturalVoice.status, progress: naturalVoice.progress })

  useEffect(
    () => naturalVoice.subscribe(() => setNatural({ status: naturalVoice.status, progress: naturalVoice.progress })),
    [],
  )

  const utterances = useMemo(() => (markdown ? prepare(markdown).utterances : []), [markdown])

  const wantedNatural = naturalVoiceFor(voiceName)
  const engine: ReadEngine = wantedNatural && naturalAvailable && !fellBack ? 'natural' : 'device'

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

  // Speed, voice and engine are read at the moment each sentence is spoken
  // rather than captured when playback started. Without this the whole lesson
  // keeps the settings it began with: the chain is built from callbacks that
  // closed over the values of one render.
  const rateRef = useRef(rate)
  const voiceNameRef = useRef(voiceName)
  const engineRef = useRef(engine)
  const naturalVoiceRef = useRef<NaturalVoiceInfo | null>(wantedNatural)
  useEffect(() => {
    rateRef.current = rate
    voiceNameRef.current = voiceName
    engineRef.current = engine
    naturalVoiceRef.current = wantedNatural
  }, [rate, voiceName, engine, wantedNatural])

  useEffect(() => {
    if (!deviceSupported) return
    const read = () => setVoices(usableVoices(window.speechSynthesis.getVoices()))
    read()
    window.speechSynthesis.addEventListener('voiceschanged', read)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', read)
  }, [deviceSupported])

  /* ── The device's voice ──────────────────────────────────────────────── */

  const pickVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (!deviceSupported) return null
    const all = window.speechSynthesis.getVoices()
    const wanted = voiceNameRef.current && all.find((v) => v.name === voiceNameRef.current)
    if (wanted) return wanted
    const best = usableVoices(all)[0]
    return best ? (all.find((v) => v.name === best.name) ?? null) : null
  }, [deviceSupported])

  const speakFrom = useCallback(
    (index: number, epoch: number) => {
      if (!deviceSupported) return
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
    [deviceSupported, utterances, pickVoice],
  )

  /* ── The natural voice ───────────────────────────────────────────────── */

  const ctxRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<AudioBufferSourceNode | null>(null)
  const piecesRef = useRef(new Map<string, Promise<Float32Array>>())

  /** The pieces of the lesson from a sentence on, in speaking order. */
  const piecesFrom = useCallback(
    (from: number): Piece[] => {
      const out: Piece[] = []
      for (let i = from; i < utterances.length; i++) {
        const parts = synthesisPieces(utterances[i]!)
        parts.forEach((text, j) => out.push({ utt: i, text, last: j === parts.length - 1 }))
      }
      return out
    },
    [utterances],
  )

  /** The audio for a piece, made once and kept a while: going back a sentence should not wait. */
  const audioFor = useCallback((piece: Piece): Promise<Float32Array> => {
    const voice = naturalVoiceRef.current ?? naturalVoiceFor('')!
    const speed = rateRef.current
    const key = `${voice.id}|${speed}|${piece.text}`
    const cache = piecesRef.current
    let p = cache.get(key)
    if (!p) {
      p = naturalVoice.synth(piece.text, voice, speed).promise
      p.catch(() => cache.delete(key))
      cache.set(key, p)
      while (cache.size > KEEP_PIECES) cache.delete(cache.keys().next().value!)
    }
    return p
  }, [])

  const playPcm = useCallback((pcm: Float32Array, gap: number, epoch: number): Promise<void> => {
    const ctx = ctxRef.current
    if (!ctx || epoch !== epochRef.current) return Promise.resolve()
    const frames = pcm.length + Math.round(gap * SAMPLE_RATE)
    const buffer = ctx.createBuffer(1, Math.max(1, frames), SAMPLE_RATE)
    buffer.getChannelData(0).set(pcm)
    const src = ctx.createBufferSource()
    src.buffer = buffer
    src.connect(ctx.destination)
    sourceRef.current = src
    return new Promise((resolve) => {
      src.onended = () => {
        if (sourceRef.current === src) sourceRef.current = null
        resolve()
      }
      src.start()
    })
  }, [])

  const fallBack = useCallback(
    (reason: string, from: number) => {
      setFellBack(true)
      engineRef.current = 'device'
      setNotice(`The natural voice could not start (${reason}). Reading with this device's voice instead.`)
      if (!deviceSupported) {
        setState('idle')
        return
      }
      epochRef.current += 1
      speakFrom(from, epochRef.current)
    },
    [deviceSupported, speakFrom],
  )

  const runNatural = useCallback(
    async (from: number, epoch: number) => {
      setState('preparing')
      atRef.current = from
      setAt(from)
      try {
        await naturalVoice.ensure()
      } catch (err) {
        if (epoch === epochRef.current) fallBack(err instanceof Error ? err.message : String(err), from)
        return
      }
      const plan = rampPieces(piecesFrom(from))
      // Ask for a few pieces ahead — one per worker, and one more — so the
      // voice finishes a piece while the one before it is still playing.
      const ahead = poolSize() + 1
      for (let k = 0; k < plan.length; k++) {
        if (epoch !== epochRef.current) return
        for (let a = k; a < Math.min(plan.length, k + ahead); a++) void audioFor(plan[a]!).catch(() => {})
        const piece = plan[k]!
        let pcm: Float32Array
        try {
          pcm = await audioFor(piece)
        } catch {
          continue // one piece that would not synthesise is skipped, not the lesson
        }
        if (epoch !== epochRef.current) return
        if (!pcm.length) continue
        atRef.current = piece.utt
        setAt(piece.utt)
        setState((s) => (s === 'paused' ? s : 'speaking'))
        await playPcm(pcm, piece.last ? SENTENCE_GAP_S : 0, epoch)
      }
      if (epoch !== epochRef.current) return
      atRef.current = -1
      setAt(-1)
      setState('idle')
    },
    [audioFor, fallBack, piecesFrom, playPcm],
  )

  const silenceNatural = useCallback(() => {
    naturalVoice.clear()
    const src = sourceRef.current
    sourceRef.current = null
    if (src) {
      src.onended = null
      try {
        src.stop()
      } catch {
        /* already stopped */
      }
    }
  }, [])

  /* ── Controls, for either engine ─────────────────────────────────────── */

  const stop = useCallback(() => {
    epochRef.current += 1
    if (deviceSupported) window.speechSynthesis.cancel()
    silenceNatural()
    atRef.current = -1
    setAt(-1)
    setState('idle')
  }, [deviceSupported, silenceNatural])

  const start = useCallback(
    (from = 0) => {
      if (!supported || utterances.length === 0) return
      // Bumping first orphans anything about to be interrupted, so the
      // outgoing sentence's end or error cannot start a rival chain.
      epochRef.current += 1
      const epoch = epochRef.current
      const index = Math.max(0, Math.min(from, utterances.length - 1))
      if (deviceSupported) window.speechSynthesis.cancel()
      silenceNatural()
      if (engineRef.current === 'natural') {
        // The audio context has to be made and resumed in the tap that started
        // reading: browsers only allow sound to begin from a gesture.
        //
        // On an iPhone, web audio counts as a sound effect and the silent switch
        // mutes it, where the device's speech voice would still be heard. Saying
        // this is playback, like a podcast, keeps the natural voice audible.
        const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession
        if (session) session.type = 'playback'
        if (!ctxRef.current) {
          const Ctx = audioContextClass()
          if (Ctx) ctxRef.current = new Ctx({ sampleRate: SAMPLE_RATE })
        }
        void ctxRef.current?.resume()
        void runNatural(index, epoch)
        return
      }
      speakFrom(index, epoch)
    },
    [supported, deviceSupported, utterances.length, speakFrom, runNatural, silenceNatural],
  )

  const warm = useCallback(() => {
    if (engineRef.current !== 'natural' || naturalVoice.status !== 'idle') return
    // Only when nothing needs downloading: warming must never start a 92 MB
    // download she did not ask for.
    void naturalVoice.downloaded().then((here) => {
      if (here) void naturalVoice.ensure().catch(() => {})
    })
  }, [])

  const pause = useCallback(() => {
    if (engineRef.current === 'natural') {
      if (state === 'idle') return
      void ctxRef.current?.suspend()
      setState('paused')
      return
    }
    if (!deviceSupported) return
    // Only claim paused if there is something to pause. Saying so when the
    // synthesiser is idle leaves the controls offering a resume that can never
    // do anything.
    if (!window.speechSynthesis.speaking) return
    window.speechSynthesis.pause()
    setState('paused')
  }, [deviceSupported, state])

  const resume = useCallback(() => {
    if (engineRef.current === 'natural') {
      void ctxRef.current?.resume()
      setState(sourceRef.current ? 'speaking' : 'preparing')
      return
    }
    if (!deviceSupported) return
    window.speechSynthesis.resume()
    setState('speaking')
  }, [deviceSupported])

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
  // spoken again from its start, which is the shortest restart available.
  const startRef = useRef(start)
  const stateRef = useRef(state)
  useEffect(() => {
    startRef.current = start
    stateRef.current = state
  }, [start, state])

  const settledOnce = useRef(false)
  useEffect(() => {
    if (!supported) return
    // The first pass is the mount, where there is nothing playing to adjust.
    if (!settledOnce.current) {
      settledOnce.current = true
      return
    }
    if (stateRef.current !== 'speaking' && stateRef.current !== 'preparing') return
    const id = setTimeout(() => {
      const index = atRef.current
      if (index < 0 || (stateRef.current !== 'speaking' && stateRef.current !== 'preparing')) return
      startRef.current(index)
    }, SETTLE_MS)
    return () => clearTimeout(id)
  }, [supported, rate, voiceName])

  // A voice chosen again after a fallback gets another chance.
  useEffect(() => {
    setFellBack(false)
    setNotice(null)
  }, [voiceName])

  // The Chromium keepalive. A pause immediately followed by a resume is a
  // no-op to the listener and resets the watchdog that would otherwise cut
  // the voice off.
  useEffect(() => {
    if (!deviceSupported || engine !== 'device' || state !== 'speaking') return
    const id = setInterval(() => {
      const s = window.speechSynthesis
      if (!s.speaking) return
      if (s.paused) {
        // We believe we are speaking and it is paused, which means an earlier
        // resume did not land; one missed resume must not silence the rest.
        s.resume()
        return
      }
      s.pause()
      s.resume()
    }, KEEPALIVE_MS)
    return () => clearInterval(id)
  }, [deviceSupported, engine, state])

  // Leaving the lesson, or swapping to another one, must not leave a voice
  // reading a page that is no longer on screen.
  useEffect(() => {
    return () => {
      epochRef.current += 1
      if (deviceSupported) window.speechSynthesis.cancel()
      silenceNatural()
      piecesRef.current.clear()
    }
  }, [deviceSupported, markdown, silenceNatural])

  useEffect(
    () => () => {
      void ctxRef.current?.close()
      ctxRef.current = null
    },
    [],
  )

  return {
    supported,
    state,
    at,
    total: utterances.length,
    voices,
    engine,
    naturalAvailable,
    naturalStatus: natural.status,
    progress: natural.progress,
    notice,
    start,
    warm,
    pause,
    resume,
    stop,
    skip,
  }
}
