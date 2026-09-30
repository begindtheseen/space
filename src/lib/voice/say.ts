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
import { SAMPLE_RATE, naturalVoiceFor } from './kokoro'
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
    if (c && c.state !== 'running') void c.resume().catch(() => {})
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
        await sayNatural(utterances, voice, rate, total, opts, () => stopped, stops)
        return
      } catch {
        /* the device's voice says it instead */
      }
    }
    if (!stopped) await sayDevice(utterances, opts.voiceName, rate, total, opts, () => stopped, stops)
  })()
    .catch(() => {})
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

async function sayNatural(
  utterances: string[],
  voice: NonNullable<ReturnType<typeof naturalVoiceFor>>,
  rate: number,
  total: number,
  opts: SayOptions,
  stopped: () => boolean,
  stops: (() => void)[],
): Promise<void> {
  await naturalVoice.ensure()
  const c = audio()
  if (!c) throw new Error('no audio')
  if (c.state !== 'running') await c.resume().catch(() => {})
  // All of it is asked for at once, so the next sentence is ready when this one ends.
  const pieces = utterances.map((u) => naturalVoice.synth(u, voice, rate))
  let said = 0
  for (let i = 0; i < utterances.length; i++) {
    const { pcm } = await pieces[i]!
    if (stopped()) return
    if (!pcm.length) continue
    const buffer = c.createBuffer(1, pcm.length, SAMPLE_RATE)
    buffer.getChannelData(0).set(pcm)
    const src = c.createBufferSource()
    src.buffer = buffer
    src.connect(c.destination)
    const start = c.currentTime + 0.03
    const before = said
    const len = utterances[i]!.length
    await new Promise<void>((resolve) => {
      const tick = setInterval(() => opts.onProgress?.(Math.min(1, (before + len * Math.min(1, (c.currentTime - start) / buffer.duration)) / total)), 80)
      const end = () => {
        clearInterval(tick)
        resolve()
      }
      src.onended = end
      stops.push(() => {
        try {
          src.stop()
        } catch {
          /* not started */
        }
        end()
      })
      src.start(start)
    })
    said += len
    // A breath between sentences.
    if (i < utterances.length - 1 && !stopped()) await new Promise((r) => setTimeout(r, 180 / Math.max(0.5, rate)))
  }
}

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
      u.onboundary = (e) => opts.onProgress?.(Math.min(1, (said + e.charIndex) / total))
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
