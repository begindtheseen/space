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
import { prepare, toUtterances, usableVoices, type VoiceLike } from '@/lib/speech'
import { CHARS_PER_SECOND, SAMPLE_RATE, fastStart, naturalVoiceFor, safeStart, speechUnits, trimSilence, type NaturalVoiceInfo, type SpeechUnit } from '@/lib/voice/kokoro'
import { naturalSupported, naturalVoice, unitChars, type NaturalStatus } from '@/lib/voice/natural'

/** How often to nudge Chromium so it does not fall silent mid-lesson. */
const KEEPALIVE_MS = 10_000

/**
 * How long a speed or voice change is left to settle before the sentence in
 * flight is spoken again with it. Long enough that stepping through the list
 * restarts once at the end rather than at every value, short enough that the
 * control still feels like it did something.
 */
const SETTLE_MS = 260

/** Synthesised sentences kept in memory for going back without making them again. */
const KEEP_PIECES = 48

/** How far ahead of the audio clock sentences are queued, in seconds. */
const SCHEDULE_AHEAD_S = 8

/** Remembers that she uses read-aloud, so the voice warms up when a lesson opens. */
const USED_KEY = 'natural-voice:used'

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

interface Scheduled {
  src: AudioBufferSourceNode
  start: number
  end: number
  sentence: number
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

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

  const prepared = useMemo(() => (markdown ? prepare(markdown) : null), [markdown])
  const utterances = useMemo(() => prepared?.utterances ?? [], [prepared])
  // What the natural voice reads: whole sentences, never cut at a comma.
  const units = useMemo(() => (prepared ? speechUnits(prepared.text, (p) => toUtterances(p, 100_000), unitChars()) : []), [prepared])
  const sentenceCount = units.length ? units[units.length - 1]!.sentence + 1 : 0

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
  const scheduledRef = useRef<Scheduled[]>([])
  const piecesRef = useRef(new Map<string, Promise<Float32Array>>())
  /** Units whose audio is already made, so planning knows they cost nothing. */
  const madeRef = useRef(new Set<string>())
  /** Whether the natural reader has more to say than is scheduled, so a silence is buffering, not the end. */
  const moreRef = useRef(false)
  /** When the audio was found stopped by the system (see the clock follower), or 0. */
  const haltedRef = useRef(0)
  /** Whether the reader paused it, as against the system stopping the audio. */
  const userPausedRef = useRef(false)

  /** The audio for a unit, made once and kept a while: going back a sentence should not wait. */
  const audioFor = useCallback((unit: SpeechUnit): Promise<Float32Array> => {
    const voice = naturalVoiceRef.current ?? naturalVoiceFor('')!
    const speed = rateRef.current
    const key = `${voice.id}|${speed}|${unit.text}`
    const cache = piecesRef.current
    let p = cache.get(key)
    if (!p) {
      p = naturalVoice.synth(unit.text, voice, speed).then((pcm) => {
        madeRef.current.add(key)
        return trimSilence(pcm)
      })
      p.catch(() => cache.delete(key))
      cache.set(key, p)
      while (cache.size > KEEP_PIECES) cache.delete(cache.keys().next().value!)
    }
    return p
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

  /**
   * Reads from a sentence on. Each sentence is scheduled on the audio clock
   * the moment it is ready, to start exactly when the one before it ends plus
   * the pause chosen for it — no gap left to the event loop. The next few are
   * asked for while earlier ones play, as many as there are workers, and more
   * when speech is being made slowly, so the queue stays ahead of the voice.
   * If it ever falls behind, the wait lands between sentences, where a reader
   * would pause anyway, never inside one.
   */
  const runNatural = useCallback(
    async (from: number, epoch: number) => {
      setState('preparing')
      atRef.current = from
      setAt(from)
      moreRef.current = true
      try {
        await naturalVoice.ensure()
      } catch (err) {
        if (epoch === epochRef.current) fallBack(err instanceof Error ? err.message : String(err), from)
        return
      }
      const ctx = ctxRef.current
      if (!ctx || epoch !== epochRef.current) return
      let plan = units.filter((u) => u.sentence >= from)
      if (naturalVoice.device === 'wasm' && naturalVoice.parallel >= 2) plan = fastStart(plan)
      const lookahead = () => {
        const rtf = naturalVoice.rtf ?? 1.5
        return Math.max(2, Math.ceil(naturalVoice.parallel * Math.max(1, rtf)) + 1)
      }
      const voiceId = (naturalVoiceRef.current ?? naturalVoiceFor('')!).id
      const isMade = (u: SpeechUnit) => madeRef.current.has(`${voiceId}|${rateRef.current}|${u.text}`)
      const firstWasMade = plan[0] ? isMade(plan[0]) : false
      const askedAt = performance.now()
      let playhead = ctx.currentTime + 0.06
      for (let k = 0; k < plan.length; k++) {
        if (epoch !== epochRef.current) return
        for (let a = k; a < Math.min(plan.length, k + lookahead()); a++) void audioFor(plan[a]!).catch(() => {})
        // Queue only a little way ahead of the clock, so stop and skip stay instant.
        while (epoch === epochRef.current && playhead - ctx.currentTime > SCHEDULE_AHEAD_S) await sleep(150)
        let pcm: Float32Array
        try {
          pcm = await audioFor(plan[k]!)
        } catch {
          continue // one piece that would not synthesise is skipped, not the lesson
        }
        if (epoch !== epochRef.current) return
        if (!pcm.length) continue
        if (k === 0) {
          // Buffer before the first word just long enough that the reading
          // never has to stop and wait mid-lesson (see safeStart).
          const cps = CHARS_PER_SECOND * Math.max(0.5, rateRef.current)
          const need = safeStart({
            firstReadyAt: firstWasMade ? 0 : (performance.now() - askedAt) / 1000,
            durations: plan.map((u, i) => (i === 0 ? pcm.length / SAMPLE_RATE : u.text.length / cps)),
            pauses: plan.map((u) => u.pause / Math.max(0.5, rateRef.current)),
            ready: plan.map((u, i) => (i === 0 ? firstWasMade : isMade(u))),
            workers: naturalVoice.parallel,
            rtf: firstWasMade ? naturalVoice.expectedRtf() : undefined,
          })
          const wait = need - (performance.now() - askedAt) / 1000
          if (wait > 0.05) {
            const until = performance.now() + wait * 1000
            while (epoch === epochRef.current && performance.now() < until) await sleep(100)
            if (epoch !== epochRef.current) return
          }
          playhead = ctx.currentTime + 0.06
        }
        const now = ctx.currentTime
        if (playhead < now + 0.02) playhead = now + 0.02
        const buffer = ctx.createBuffer(1, pcm.length, SAMPLE_RATE)
        buffer.getChannelData(0).set(pcm)
        const src = ctx.createBufferSource()
        src.buffer = buffer
        src.connect(ctx.destination)
        src.start(playhead)
        scheduledRef.current.push({ src, start: playhead, end: playhead + buffer.duration, sentence: plan[k]!.sentence })
        playhead += buffer.duration + plan[k]!.pause / Math.max(0.5, rateRef.current)
      }
      moreRef.current = false
      while (epoch === epochRef.current && ctx.currentTime < playhead - 0.05) await sleep(150)
      if (epoch !== epochRef.current) return
      scheduledRef.current = []
      atRef.current = -1
      setAt(-1)
      setState('idle')
    },
    [audioFor, fallBack, units],
  )

  // Follows the audio clock: which sentence is sounding, and whether the
  // reader is waiting on the voice. Paused, the clock stops and so does this.
  useEffect(() => {
    if (engine !== 'natural' || state === 'idle' || state === 'paused') return
    haltedRef.current = 0
    const id = setInterval(() => {
      const ctx = ctxRef.current
      if (!ctx) return
      if (ctx.state !== 'running') {
        // iOS stops web audio on its own — a call, Siri, another app's sound,
        // the screen locking — and the clock stops with it, so the reading
        // would seem frozen. Try to carry on; if the system will not allow it
        // without a tap, show it as paused, so Resume (a tap) brings it back.
        void ctx.resume().catch(() => {})
        if (!haltedRef.current) haltedRef.current = performance.now()
        else if (performance.now() - haltedRef.current > 1500) setState('paused')
        return
      }
      haltedRef.current = 0
      const now = ctx.currentTime
      const list = scheduledRef.current
      while (list.length > 1 && list[1]!.start <= now) list.shift()
      const current = list[0]
      if (current && now >= current.start - 0.02) {
        if (atRef.current !== current.sentence) {
          atRef.current = current.sentence
          setAt(current.sentence)
        }
        const waiting = now > current.end + 0.6 && moreRef.current
        setState((s) => (s === 'paused' ? s : waiting ? 'preparing' : 'speaking'))
      }
    }, 100)
    return () => clearInterval(id)
  }, [engine, state])

  const silenceNatural = useCallback(() => {
    naturalVoice.clear()
    moreRef.current = false
    for (const item of scheduledRef.current) {
      try {
        item.src.stop()
      } catch {
        /* already stopped */
      }
    }
    scheduledRef.current = []
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
      const count = engineRef.current === 'natural' ? sentenceCount : utterances.length
      if (!supported || count === 0) return
      // Bumping first orphans anything about to be interrupted, so the
      // outgoing sentence's end or error cannot start a rival chain.
      epochRef.current += 1
      const epoch = epochRef.current
      const index = Math.max(0, Math.min(from, count - 1))
      if (deviceSupported) window.speechSynthesis.cancel()
      silenceNatural()
      if (engineRef.current === 'natural') {
        userPausedRef.current = false
        // The audio context has to be made and resumed in the tap that started
        // reading: browsers only allow sound to begin from a gesture.
        //
        // On an iPhone, web audio counts as a sound effect and the silent switch
        // mutes it, where the device's speech voice would still be heard. Saying
        // this is playback, like a podcast, keeps the natural voice audible.
        const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession
        if (session && session.type !== 'playback') session.type = 'playback'
        // A context the system stopped (iOS marks it interrupted) may never
        // start again; a fresh one, made in this tap, always can.
        if (ctxRef.current && ctxRef.current.state !== 'running') {
          void ctxRef.current.close().catch(() => {})
          ctxRef.current = null
        }
        if (!ctxRef.current) {
          const Ctx = audioContextClass()
          if (Ctx) {
            try {
              ctxRef.current = new Ctx({ sampleRate: SAMPLE_RATE })
            } catch {
              ctxRef.current = new Ctx()
            }
          }
        }
        const ctx = ctxRef.current
        if (ctx) {
          void ctx.resume().catch(() => {})
          // iOS unlocks audio for the page only once a sound starts inside
          // the tap itself; one silent sample is enough.
          try {
            const src = ctx.createBufferSource()
            src.buffer = ctx.createBuffer(1, 1, ctx.sampleRate)
            src.connect(ctx.destination)
            src.start(0)
          } catch {
            /* the resume above is usually enough */
          }
        }
        try {
          localStorage.setItem(USED_KEY, '1')
        } catch {
          /* only a hint */
        }
        void runNatural(index, epoch)
        return
      }
      speakFrom(index, epoch)
    },
    [supported, deviceSupported, utterances.length, sentenceCount, speakFrom, runNatural, silenceNatural],
  )

  const warm = useCallback(() => {
    if (engineRef.current !== 'natural' || naturalVoice.status === 'downloading' || naturalVoice.status === 'starting') return
    // Only when nothing needs downloading: warming must never start a 92 MB
    // download she did not ask for. Warm means ready to speak at once: the
    // workers started and the opening sentences already made.
    void naturalVoice.downloaded().then(async (here) => {
      if (!here) return
      try {
        await naturalVoice.ensure()
        for (const u of units.slice(0, 2)) void audioFor(u).catch(() => {})
      } catch {
        /* the tap will say what went wrong */
      }
    })
  }, [units, audioFor])

  const pause = useCallback(() => {
    if (engineRef.current === 'natural') {
      if (state === 'idle') return
      userPausedRef.current = true
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
      const ctx = ctxRef.current
      if (ctx && ctx.state === 'suspended' && userPausedRef.current) {
        userPausedRef.current = false
        void ctx.resume()
        setState('speaking')
        return
      }
      // Stopped by the system, not by pause: start again from this sentence,
      // in a fresh context made in this tap. What was made is kept, so it
      // picks up at once.
      start(Math.max(0, atRef.current))
      return
    }
    if (!deviceSupported) return
    window.speechSynthesis.resume()
    setState('speaking')
  }, [deviceSupported, start])

  const skip = useCallback(
    (delta: number) => {
      const count = engineRef.current === 'natural' ? sentenceCount : utterances.length
      const next = (atRef.current < 0 ? 0 : atRef.current) + delta
      if (next < 0 || next >= count) return
      start(next)
    },
    [utterances.length, sentenceCount, start],
  )

  // She has used read-aloud before: get the voice ready while she starts on
  // the lesson, so pressing Read aloud speaks at once.
  useEffect(() => {
    if (engine !== 'natural' || !units.length) return
    let used = false
    try {
      used = localStorage.getItem(USED_KEY) === '1'
    } catch {
      /* no storage: no warm-up */
    }
    if (!used) return
    const id = setTimeout(warm, 2500)
    return () => clearTimeout(id)
  }, [engine, units, warm])

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
    total: engine === 'natural' ? sentenceCount : utterances.length,
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
