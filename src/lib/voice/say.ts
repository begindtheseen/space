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
        await sayNatural(utterances, voice, rate, opts, () => stopped, stops)
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

/* ── Ready before it's needed ────────────────────────────────────────────── */

/** Phrases made ahead, kept in memory by voice and speed: the tutor's openers, said the instant a line starts. */
const ready = new Map<string, Float32Array>()
const readyKey = (voice: string, rate: number, text: string) => `${voice}|${rate}|${text}`
/** A phrase as the voice says it: prepared like any line. */
const spoken = (phrase: string) => prepare(phrase).utterances.join(' ').trim()
/** Said on its own, a lead-in keeps its lift: "Close, but," not a full stop. */
const voiced = (lead: string) => (/[,:;.!?]$/.test(lead) ? lead : `${lead},`)

/**
 * Gets the voice ready to answer at once, for as long as a page may need it: loads it (when it is already on
 * the device; this never downloads), keeps it loaded, and makes `phrases` ahead of time. Returns the release.
 */
export function warmVoice(opts: { voiceName?: string; rate?: number; phrases?: string[] }): () => void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.getVoices()
  const voice = naturalVoiceFor(opts.voiceName)
  if (!voice || !naturalSupported()) return () => {}
  const release = naturalVoice.hold()
  let cancelled = false
  void (async () => {
    if (!(await naturalVoice.downloaded()) || cancelled) return
    await naturalVoice.ensure()
    const rate = opts.rate ?? 1
    // One at a time, so a line that is needed now never waits behind more than one of these.
    for (const phrase of opts.phrases ?? []) {
      if (cancelled) return
      const text = spoken(phrase)
      const key = readyKey(voice.id, rate, text)
      if (!text || ready.has(key)) continue
      ready.set(key, (await naturalVoice.synth(voiced(text), voice, rate)).pcm)
    }
  })().catch(() => {})
  return () => {
    cancelled = true
    release()
  }
}

/** A piece of a line to make and play, and the pause after it (seconds). */
interface Piece {
  text: string
  pause: number
  pcm?: Float32Array
}

/**
 * The line in pieces that can start sooner: a lead-in made ahead is split off the front, and a long sentence
 * is cut at its commas and colons, so the workers make the pieces side by side and the first is ready soon.
 */
export function piecesOf(utterances: string[], voice: string, rate: number): Piece[] {
  const out: Piece[] = []
  utterances.forEach((u, i) => {
    let rest = u.trim()
    if (i === 0) {
      let lead = ''
      for (const key of ready.keys()) {
        const [v, r, text] = key.split('|') as [string, string, string]
        if (v === voice && Number(r) === rate && text.length > lead.length && rest.startsWith(text) && rest.length > text.length + 2) lead = text
      }
      if (lead) {
        out.push({ text: lead, pause: 0.02, pcm: ready.get(readyKey(voice, rate, lead)) })
        rest = rest.slice(lead.length).trim()
      }
    }
    const clauses: string[] = []
    for (const part of rest.length > 90 ? rest.split(/(?<=[,;:])\s+/) : [rest]) {
      if (clauses.length && (clauses[clauses.length - 1]!.length < 30 || part.length < 20)) clauses[clauses.length - 1] += ` ${part}`
      else clauses.push(part)
    }
    clauses.forEach((c, k) => out.push({ text: c, pause: k < clauses.length - 1 ? 0.05 : 0.18 }))
  })
  return out.filter((p) => p.text)
}

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
  if (c.state !== 'running') void c.resume().catch(() => {})
  const pieces = piecesOf(utterances, voice.id, rate)
  // A lead-in made ahead plays while the voice is still starting, or making the rest.
  const starting = naturalVoice.ensure()
  const made = pieces.map((p) => (p.pcm ? Promise.resolve(p.pcm) : starting.then(() => naturalVoice.synth(p.text, voice, rate)).then((s) => s.pcm)))
  const chars = pieces.reduce((n, p) => n + p.text.length, 0) || 1
  // Each piece is set to start the moment the one before ends: no gap waiting on a timer.
  const plan: { at: number; end: number; before: number; len: number }[] = []
  let next = 0
  let said = 0
  const tick = setInterval(() => {
    const now = c.currentTime
    const p = plan.findLast((x) => x.at <= now)
    if (p) opts.onProgress?.(Math.min(1, (p.before + p.len * Math.min(1, (now - p.at) / Math.max(0.01, p.end - p.at))) / chars))
  }, 80)
  stops.push(() => clearInterval(tick))
  let last: AudioBufferSourceNode | null = null
  try {
    for (let i = 0; i < pieces.length; i++) {
      const pcm = await made[i]!
      if (stopped()) return
      if (!pcm.length) continue
      const buffer = c.createBuffer(1, pcm.length, SAMPLE_RATE)
      buffer.getChannelData(0).set(pcm)
      const src = c.createBufferSource()
      src.buffer = buffer
      src.connect(c.destination)
      const at = Math.max(c.currentTime + 0.02, next)
      src.start(at)
      plan.push({ at, end: at + buffer.duration, before: said, len: pieces[i]!.text.length })
      said += pieces[i]!.text.length
      next = at + buffer.duration + pieces[i]!.pause / Math.max(0.5, rate)
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
    clearInterval(tick)
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
