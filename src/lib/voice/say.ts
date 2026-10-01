/* ============================================================================
   Saying one thing: a short line in her chosen voice
   ----------------------------------------------------------------------------
   The read-aloud player reads a whole lesson. This says one line, now: the
   tutor after a run that did not pass, or the voice sample in Settings.

   It speaks in the voice she chose. The natural voice is used when its model
   is already on the device (a hint never starts a 92 MB download); otherwise
   the device's own voice. If the lesson is being read aloud at that moment,
   the reading steps aside, the line is said, and the reading carries on.
   Only one line is said at a time: a new one cuts off the one before.
   ========================================================================== */
import { prepare, usableVoices } from '@/lib/speech'
import { SAMPLE_RATE, naturalVoiceFor, textWords } from './kokoro'
import { naturalSupported, naturalVoice } from './natural'

/** The lesson's reader, so a line can be said over it: `hold` pauses it and returns how to carry on. */
export interface ReaderHold {
  busy: () => boolean
  hold: () => () => void
}

let reader: ReaderHold | null = null

/** The read-aloud player registers itself here while it is on the page. */
export function registerReader(r: ReaderHold): () => void {
  reader = r
  return () => {
    if (reader === r) reader = null
  }
}

/* ── Sound ───────────────────────────────────────────────────────────────── */

let ctx: AudioContext | null = null

function audio(): AudioContext | null {
  if (ctx) return ctx
  if (typeof window === 'undefined') return null
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctx) return null
  try {
    ctx = new Ctx({ sampleRate: SAMPLE_RATE })
  } catch {
    ctx = new Ctx()
  }
  return ctx
}

// Browsers let sound start only after she has touched the page. A run is always started by a tap
// or a key, so the context is made (or woken) then, and is ready by the time the run has failed.
if (typeof window !== 'undefined') {
  const wake = () => {
    const c = audio()
    if (c && c.state !== 'running')
      void c.resume().catch((e) => {
        console.debug('[Voice] Audio context resume failed:', e)
      })
  }
  window.addEventListener('pointerdown', wake, { capture: true, passive: true })
  window.addEventListener('keydown', wake, { capture: true, passive: true })
}

/* ── Saying ──────────────────────────────────────────────────────────────── */

export interface SayOptions {
  /** The voice setting: a natural voice ("natural:af_heart"), a device voice by name, or absent for the best one. */
  voiceName?: string
  rate?: number
  /** How much has been said, 0 to 1, as it goes: for captions that keep pace with the voice. */
  onProgress?: (share: number) => void
  /** Download the natural voice if it is not here yet: only when she asked to hear it. */
  download?: boolean
  /** The words that will be said, in order, before the first is heard (as the voice reads them, see textWords). */
  onWords?: (words: string[]) => void
  /** The word being heard now: its place in the list onWords gave. */
  onWord?: (index: number) => void
}

export interface Saying {
  /** Resolves when the line has been said, or was stopped. */
  done: Promise<void>
  stop: () => void
}

let current: Saying | null = null

/** Stops whatever is being said. */
export function stopSaying(): void {
  current?.stop()
  current = null
}

/** Whether anything can be said on this device at all. */
export function canSay(): boolean {
  return typeof window !== 'undefined' && (naturalSupported() || 'speechSynthesis' in window)
}

/** Says `markdown` (code in backticks is read the way a programmer says it) in her chosen voice. */
export function say(markdown: string, opts: SayOptions = {}): Saying {
  stopSaying()
  const { utterances } = prepare(markdown)
  const total = utterances.reduce((n, u) => n + u.length, 0) || 1
  let stopped = false
  const stops: (() => void)[] = []
  const release = reader?.busy() ? reader.hold() : null

  const done = (async () => {
    if (!utterances.length) return
    const voice = naturalVoiceFor(opts.voiceName)
    const rate = opts.rate ?? 1
    const natural = !!voice && naturalSupported() && (!!opts.download || naturalVoice.status === 'ready' || (await naturalVoice.downloaded()))
    if (natural && voice && !stopped) {
      try {
        await sayNatural(utterances, voice, rate, opts, () => stopped, stops)
        return
      } catch (e) {
        console.debug('[Voice] Natural voice synthesis failed, falling back to device voice:', e)
        /* the device's voice says it instead */
      }
    }
    if (!stopped) await sayDevice(utterances, opts.voiceName, rate, total, opts, () => stopped, stops)
  })()
    .catch((e) => {
      console.error('[Voice] Failed to say text:', e)
    })
    .finally(() => {
      opts.onProgress?.(1)
      release?.()
      if (current === saying) current = null
    })

  const saying: Saying = {
    done,
    stop: () => {
      if (stopped) return
      stopped = true
      for (const s of stops) s()
    },
  }
  current = saying
  return saying
}

/* ── Ready before it's needed ────────────────────────────────────────────── */

/**
 * Gets the voice ready to answer at once, for as long as a page may need it: loads it (when it is already on
 * the device; this never downloads) and keeps it loaded. Returns the release.
 */
export function warmVoice(opts: { voiceName?: string }): () => void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.getVoices()
  const voice = naturalVoiceFor(opts.voiceName)
  if (!voice || !naturalSupported()) return () => {}
  const release = naturalVoice.hold()
  let cancelled = false
  void (async () => {
    if ((await naturalVoice.downloaded()) && !cancelled) await naturalVoice.ensure()
  })().catch((e) => {
    console.debug('[Voice] Failed to warm voice:', e)
  })
  return () => {
    cancelled = true
    release()
  }
}

/**
 * The line in the pieces the voice makes: the first sentence on its own, so it can start soon, and the rest
 * together in stretches of a few sentences. A sentence is never cut: the model only phrases a sentence
 * naturally when it hears all of it, and one made in parts sounds like parts.
 */
export function piecesOf(utterances: string[], most = 220): string[] {
  const out: string[] = []
  utterances.forEach((u, i) => {
    const t = u.trim()
    if (!t) return
    const last = out.length - 1
    if (i > 1 && last >= 1 && out[last]!.length + t.length + 1 <= most) out[last] = `${out[last]} ${t}`
    else out.push(t)
  })
  return out
}

/** How late the speakers are behind the audio clock: what is heard now was scheduled this long ago. */
const heardDelay = (c: AudioContext) => (c.outputLatency || 0) + (c.baseLatency || 0)

async function sayNatural(
  utterances: string[],
  voice: NonNullable<ReturnType<typeof naturalVoiceFor>>,
  rate: number,
  opts: SayOptions,
  stopped: () => boolean,
  stops: (() => void)[],
): Promise<void> {
  const c = audio()
  if (!c) throw new Error('no audio')
  if (c.state !== 'running')
    void c.resume().catch((e) => {
      console.debug('[Voice] Audio context resume in sayNatural failed:', e)
    })
  await naturalVoice.ensure()
  const pieces = piecesOf(utterances)
  // All of it is asked for at once: the pool makes the later pieces while the first is playing.
  const made = pieces.map((p) => naturalVoice.synth(p, voice, rate, 'line'))
  // Stopped before it was all made: what has not started is not made at all.
  stops.push(() => naturalVoice.clear('line'))
  for (const m of made)
    m.catch((e) => {
      console.debug('[Voice] Piece synthesis failed during say:', e instanceof Error ? e.message : String(e))
    })
  const spoken = pieces.map((p) => textWords(p).map((w) => p.slice(w.start, w.end)))
  opts.onWords?.(spoken.flat())
  const chars = pieces.reduce((n, p) => n + p.length, 0) || 1
  // Where every piece sits on the audio clock, and its words' times within it.
  const plan: { at: number; end: number; base: number; words?: Float64Array; before: number; len: number }[] = []
  let next = 0
  let said = 0
  let base = 0
  let lastWord = -1
  let frame = 0
  // Follows what is being heard, frame by frame: the word, and how far through the line.
  const follow = () => {
    const now = c.currentTime - heardDelay(c)
    const p = plan.findLast((x) => x.at <= now)
    if (p) {
      const into = now - p.at
      opts.onProgress?.(Math.min(1, (p.before + p.len * Math.min(1, into / Math.max(0.01, p.end - p.at))) / chars))
      let k = -1
      if (p.words) for (let i = 0; i * 2 < p.words.length; i++) {
        const s0 = p.words[i * 2]!
        if (Number.isNaN(s0)) continue
        if (s0 <= into + 0.02) k = i
        else break
      }
      else k = Math.min(Math.floor((into / Math.max(0.01, p.end - p.at)) * (spoken[plan.indexOf(p)]?.length ?? 0)), (spoken[plan.indexOf(p)]?.length ?? 1) - 1)
      const w = k >= 0 ? p.base + k : -1
      if (w !== lastWord && w >= 0) {
        lastWord = w
        opts.onWord?.(w)
      }
    }
    frame = requestFrame(follow)
  }
  frame = requestFrame(follow)
  stops.push(() => cancelFrame(frame))
  let last: AudioBufferSourceNode | null = null
  try {
    for (let i = 0; i < pieces.length; i++) {
      const { pcm, words } = await made[i]!
      if (stopped()) return
      if (!pcm.length) continue
      const buffer = c.createBuffer(1, pcm.length, SAMPLE_RATE)
      buffer.getChannelData(0).set(pcm)
      const src = c.createBufferSource()
      src.buffer = buffer
      src.connect(c.destination)
      // Each piece starts the moment the one before ends, with a breath between: no gap waiting on a timer.
      const at = Math.max(c.currentTime + 0.03, next)
      src.start(at)
      plan.push({ at, end: at + buffer.duration, base, words, before: said, len: pieces[i]!.length })
      base += spoken[i]!.length
      said += pieces[i]!.length
      next = at + buffer.duration + 0.16 / Math.max(0.5, rate)
      stops.push(() => {
        try {
          src.stop()
        } catch {
          /* already over */
        }
      })
      last = src
    }
    if (last && !stopped()) {
      const end = last
      await new Promise<void>((resolve) => {
        end.onended = () => resolve()
        stops.push(resolve)
      })
    }
  } finally {
    cancelFrame(frame)
  }
}

const requestFrame = (f: () => void): number => (typeof requestAnimationFrame === 'function' ? requestAnimationFrame(f) : (setTimeout(f, 16) as unknown as number))
const cancelFrame = (id: number) => (typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame(id) : clearTimeout(id))

function sayDevice(
  utterances: string[],
  voiceName: string | undefined,
  rate: number,
  total: number,
  opts: SayOptions,
  stopped: () => boolean,
  stops: (() => void)[],
): Promise<void> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return Promise.resolve()
  const synth = window.speechSynthesis
  const all = synth.getVoices()
  const wanted = voiceName ? all.find((v) => v.name === voiceName) : undefined
  const best = wanted ?? (() => {
    const top = usableVoices(all)[0]
    return top ? all.find((v) => v.name === top.name) : undefined
  })()
  stops.push(() => synth.cancel())
  // A paused synthesiser (the reader's) would hold these back.
  if (synth.paused) synth.cancel()
  // The device's voice says which character it has reached: that is the word, in the same list as the natural voice's.
  const spans = utterances.map((t) => textWords(t))
  opts.onWords?.(utterances.flatMap((t, k) => spans[k]!.map((w) => t.slice(w.start, w.end))))
  const firsts = spans.map((_, k) => spans.slice(0, k).reduce((n, x) => n + x.length, 0))
  return new Promise<void>((resolve) => {
    let said = 0
    const next = (i: number) => {
      if (stopped() || i >= utterances.length) return resolve()
      const text = utterances[i]!
      const u = new SpeechSynthesisUtterance(text)
      if (best) {
        u.voice = best
        u.lang = best.lang
      }
      u.rate = rate
      u.onboundary = (e) => {
        opts.onProgress?.(Math.min(1, (said + e.charIndex) / total))
        const k = spans[i]!.findLastIndex((w) => w.start <= e.charIndex)
        if (k >= 0) opts.onWord?.(firsts[i]! + k)
      }
      u.onend = () => {
        said += text.length
        opts.onProgress?.(said / total)
        next(i + 1)
      }
      u.onerror = () => resolve()
      synth.speak(u)
    }
    next(0)
  })
}
