/* ============================================================================
   The natural voice — the page's side
   ----------------------------------------------------------------------------
   A neural voice (Kokoro-82M) that reads like a person, the same on every
   device, instead of whatever the browser's built-in synthesiser offers —
   which on many phones and computers is still a voice from twenty years ago.

   It runs entirely on the device. The model (92 MB) is downloaded once from
   Hugging Face, where its authors publish it, and kept in Cache Storage, so
   after the first time it works offline. Speech is made in workers
   (workers/voice.worker.ts):

     - on a GPU (WebGPU), one worker, many times faster than speech;
     - otherwise a small pool of CPU workers, each making a different sentence
       at the same time, because one alone is not fast enough on most machines.

   Reading aloud is only fluent if speech is made at least as fast as it is
   spoken, so this measures that as it goes. A GPU that turns out slower than
   the CPU pool is dropped for it, and remembered, so the next lesson starts
   on the faster one. Sentences already made are kept in Cache Storage too:
   a lesson heard once plays back at once.
   ========================================================================== */
import type { VoiceDevice, VoiceReply, VoiceRequest } from '@/workers/voice.worker'
import { MAX_UNIT_CHARS, type NaturalVoiceInfo } from './kokoro'

export const MODEL_URL = 'https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main/onnx/model_quantized.onnx'
/** The model's size, for the progress bar when the server does not say. */
export const MODEL_BYTES = 92_361_116
const CACHE_NAME = 'natural-voice-v1'
const AUDIO_CACHE = 'natural-voice-audio-v1'
/** Sentences kept on the device; the oldest go first. At ~150 KB each, about 60 MB. */
const AUDIO_CACHE_LIMIT = 400
/** Workers are let go after this long without anything to say, to give back their memory: sooner on a phone. */
const IDLE_MS = 180_000
const PHONE_IDLE_MS = 45_000
/** Workers replaced after failing, per start, before the voice gives up and says so. */
const MAX_REPLACEMENTS = 6
/** A device override for testing and diagnosis: 'wasm' or 'webgpu'. */
const DEVICE_KEY = 'natural-voice:device'
/** Set when the GPU proved slower than real time, or failed, on this device. */
const GPU_SLOW_KEY = 'natural-voice:gpu-slow'
/** A GPU slower than this (seconds of work per second of speech) is dropped for the CPU workers. */
const GPU_MAX_RTF = 0.9
/** How fast each kind of worker made speech here last time, for planning before it is measured again. */
const RTF_KEY = 'natural-voice:rtf:'

export type NaturalStatus = 'idle' | 'downloading' | 'starting' | 'ready' | 'failed'

interface Job {
  id: number
  text: string
  voice: NaturalVoiceInfo
  speed: number
  resolve: (pcm: Float32Array) => void
  reject: (err: Error) => void
  cancelled: boolean
  /** Times it was handed to a fresh worker after one failed on it. */
  retries: number
}

interface Slot {
  worker: Worker
  device: VoiceDevice
  ready: boolean
  job: Job | null
  /** Fires if the worker never answers: it hung, or the system took it. */
  watchdog: ReturnType<typeof setTimeout> | null
}

type Nav = { hardwareConcurrency?: number; deviceMemory?: number; userAgent?: string; maxTouchPoints?: number }

/** A phone or tablet: an iPad says it is a Mac, but has a touch screen. */
export function isPhone(nav: Nav = navigator): boolean {
  return /Mobi|Android|iPhone|iPad/i.test(nav.userAgent ?? '') || ((nav.maxTouchPoints ?? 0) > 1 && /Macintosh/.test(nav.userAgent ?? ''))
}

/**
 * The longest piece of text given to the model at once here. Its memory
 * grows with the length of what it says and is never given back, so a phone
 * gets shorter pieces: long sentences are cut at a comma or semicolon, where
 * a reader pauses anyway.
 */
export function unitChars(nav: Nav = navigator): number {
  return isPhone(nav) ? 150 : MAX_UNIT_CHARS
}

/** Whether this browser can run the natural voice at all. */
export function naturalSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof WebAssembly === 'object' &&
    typeof Worker === 'function' &&
    typeof (window.AudioContext ?? (window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext) === 'function'
  )
}

/**
 * How many CPU workers to run. Each takes about 450 MB to start and more as
 * it speaks, so an iPhone or iPad gets one — with two, iOS ran out of memory
 * mid-lesson and the reading froze — and a roomy computer three. A machine
 * with two cores or fewer gets one, because a second would only fight the page.
 */
export function poolSize(nav: Nav = navigator): number {
  const cores = nav.hardwareConcurrency ?? 2
  if (cores <= 2) return 1
  if (isPhone(nav)) {
    // Only an Android phone says how much memory it has; iOS never does.
    return (nav.deviceMemory ?? 0) >= 8 && cores >= 8 ? 2 : 1
  }
  const memory = nav.deviceMemory ?? 8
  if (memory < 8 || cores < 6) return 2
  return 3
}

function stored(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function store(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* no storage: it is only a hint for next time */
  }
}

/** The GPU, where there is a real one this device has not found wanting; otherwise the CPU. */
export async function chooseDevice(): Promise<VoiceDevice> {
  const forced = stored(DEVICE_KEY)
  if (forced === 'wasm' || forced === 'webgpu') return forced
  if (stored(GPU_SLOW_KEY)) return 'wasm'
  // On a phone the GPU shares the phone's memory, and the model's weights
  // expand to four times their size there: not yet worth the risk.
  if (isPhone()) return 'wasm'
  const gpu = (navigator as unknown as { gpu?: { requestAdapter(): Promise<{ info?: { isFallbackAdapter?: boolean }; isFallbackAdapter?: boolean } | null> } }).gpu
  if (!gpu) return 'wasm'
  try {
    const adapter = await gpu.requestAdapter()
    // A software adapter is the CPU pretending to be a GPU, and slower than the CPU pool.
    if (!adapter || adapter.info?.isFallbackAdapter || adapter.isFallbackAdapter) return 'wasm'
    return 'webgpu'
  } catch {
    return 'wasm'
  }
}

/** A short stable key for a piece of text. */
export function textKey(text: string): string {
  let h1 = 0x811c9dc5
  let h2 = 0x01000193
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i)
    h1 = Math.imul(h1 ^ c, 0x01000193)
    h2 = Math.imul(h2 ^ c, 0x5bd1e995)
  }
  return `${(h1 >>> 0).toString(36)}${(h2 >>> 0).toString(36)}${text.length.toString(36)}`
}

function cacheUrl(text: string, voice: NaturalVoiceInfo, speed: number): string {
  return `https://natural-voice.invalid/${voice.id}/${speed}/${textKey(text)}`
}

class NaturalVoice {
  status: NaturalStatus = 'idle'
  /** Download progress, 0 to 1, while downloading. */
  progress = 0
  error: string | null = null
  device: VoiceDevice | null = null
  /** Seconds of work per second of speech, per worker, as measured. */
  rtf: number | null = null

  private slots: Slot[] = []
  private queue: Job[] = []
  private nextId = 1
  private starting: Promise<void> | null = null
  private idleTimer: ReturnType<typeof setTimeout> | null = null
  private listeners = new Set<() => void>()
  private gpuJobs = 0
  private audioWrites = 0
  private replacements = 0

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  private emit(): void {
    for (const fn of this.listeners) fn()
  }

  private set(status: NaturalStatus, extra: Partial<Pick<NaturalVoice, 'progress' | 'error'>> = {}): void {
    this.status = status
    Object.assign(this, extra)
    this.emit()
  }

  /** Seconds of work per second of speech to plan with: measured now, or last time on this device, or a cautious guess. */
  expectedRtf(): number {
    if (this.rtf !== null) return this.rtf
    const last = Number(stored(`${RTF_KEY}${this.device ?? 'wasm'}`))
    if (Number.isFinite(last) && last > 0) return last
    return this.device === 'webgpu' ? 0.4 : 1.6
  }

  /** How many pieces can be in the works at once: one GPU worker, or the CPU pool (counting those still starting). */
  get parallel(): number {
    return this.device === 'webgpu' ? 1 : poolSize()
  }

  /** Whether the model is already on this device, so starting needs no download. */
  async downloaded(): Promise<boolean> {
    try {
      return !!(await (await caches.open(CACHE_NAME)).match(MODEL_URL))
    } catch {
      return false
    }
  }

  private async download(): Promise<void> {
    let cache: Cache | null = null
    try {
      cache = await caches.open(CACHE_NAME)
      if (await cache.match(MODEL_URL)) return
    } catch {
      // No Cache Storage (a private window): each worker fetches it instead,
      // and the browser's own HTTP cache is all there is.
      return
    }
    this.set('downloading', { progress: 0 })
    const res = await fetch(MODEL_URL)
    if (!res.ok || !res.body) throw new Error(`The voice did not download (HTTP ${res.status}).`)
    const total = Number(res.headers.get('content-length')) || MODEL_BYTES
    const reader = res.body.getReader()
    const parts: Uint8Array[] = []
    let got = 0
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      parts.push(value)
      got += value.length
      this.progress = Math.min(1, got / total)
      this.emit()
    }
    await cache.put(MODEL_URL, new Response(new Blob(parts as BlobPart[]), { headers: { 'content-type': 'application/octet-stream' } }))
  }

  private spawn(device: VoiceDevice): Promise<void> {
    return new Promise((resolve, reject) => {
      const worker = new Worker(new URL('../../workers/voice.worker.ts', import.meta.url), { type: 'module' })
      const slot: Slot = { worker, device, ready: false, job: null, watchdog: null }
      this.slots.push(slot)
      worker.onmessage = (e: MessageEvent<VoiceReply>) => {
        const m = e.data
        if (m.type === 'ready') {
          if (device === 'webgpu' && m.rtf !== undefined) {
            // The GPU timed itself on a sentence as it started: slower than
            // speech here means the CPU workers read better. Remembered.
            if (m.rtf > GPU_MAX_RTF) {
              store(GPU_SLOW_KEY, String(Math.round(m.rtf * 100) / 100))
              this.slots = this.slots.filter((s) => s !== slot)
              worker.terminate()
              reject(new Error('The GPU makes speech slower than it is spoken here.'))
              return
            }
            this.rtf = m.rtf
            store(`${RTF_KEY}webgpu`, m.rtf.toFixed(3))
          }
          slot.ready = true
          resolve()
          this.pump()
          return
        }
        if (m.type === 'fatal') {
          this.slots = this.slots.filter((s) => s !== slot)
          worker.terminate()
          reject(new Error(m.message))
          return
        }
        const job = slot.job
        if (!job || job.id !== m.id) return
        if (m.type === 'error') {
          // Most often it ran out of memory, and a worker that has cannot be
          // trusted again: a fresh one takes its place and tries the piece again.
          this.replace(slot, m.message)
          return
        }
        if (slot.watchdog) clearTimeout(slot.watchdog)
        slot.watchdog = null
        slot.job = null
        this.measure(m.ms, m.pcm.length / m.sampleRate)
        job.resolve(m.pcm)
        this.pump()
      }
      worker.onerror = (e) => {
        e.preventDefault()
        if (slot.ready) {
          this.replace(slot, 'The voice stopped unexpectedly.')
          return
        }
        this.slots = this.slots.filter((s) => s !== slot)
        worker.terminate()
        reject(new Error('The voice could not start in this browser.'))
        this.pump()
      }
      const init: VoiceRequest = {
        cmd: 'init',
        modelUrl: MODEL_URL,
        cacheName: CACHE_NAME,
        voiceBase: new URL(`${import.meta.env.BASE_URL}voices/`, location.href).href,
        device,
      }
      worker.postMessage(init)
    })
  }

  /** Keeps a running measure of speed; drops a GPU that is not faster than speech. */
  private measure(ms: number, seconds: number): void {
    if (seconds < 0.5) return
    const rtf = ms / 1000 / seconds
    this.rtf = this.rtf === null ? rtf : this.rtf * 0.6 + rtf * 0.4
    if (this.device) store(`${RTF_KEY}${this.device}`, this.rtf.toFixed(3))
    if (this.device === 'webgpu' && ++this.gpuJobs >= 3 && this.rtf > GPU_MAX_RTF) {
      store(GPU_SLOW_KEY, String(Math.round(this.rtf * 100) / 100))
      void this.switchTo('wasm')
    }
  }

  /**
   * Puts a fresh worker in place of one that failed, hung or was taken by the
   * system, and hands its piece to the next free worker, once. Without this a
   * lost worker left its piece unanswered forever: the reading froze, and
   * each restart queued behind it.
   */
  private replace(slot: Slot, reason: string): void {
    if (!this.slots.includes(slot)) return
    if (slot.watchdog) clearTimeout(slot.watchdog)
    this.slots = this.slots.filter((s) => s !== slot)
    slot.worker.terminate()
    const job = slot.job
    slot.job = null
    if (job && !job.cancelled) {
      if (job.retries < 1) {
        job.retries++
        this.queue.unshift(job)
      } else job.reject(new Error(reason))
    }
    if (++this.replacements > MAX_REPLACEMENTS) {
      if (!this.slots.length) this.giveUp(reason)
      return
    }
    this.spawn(slot.device).catch((err: unknown) => {
      if (!this.slots.length) this.giveUp(err instanceof Error ? err.message : String(err))
    })
    this.pump()
  }

  /** No worker left and none coming: every waiting piece is told, so nothing waits forever. */
  private giveUp(reason: string): void {
    for (const j of this.queue) j.reject(new Error(reason))
    this.queue = []
    this.set('failed', { error: reason })
  }

  /** How long a piece may take before its worker is presumed lost: generous, since a slow phone is not a lost one. */
  private deadline(job: Job): number {
    const seconds = job.text.length / 15 / Math.max(0.5, job.speed)
    return 20_000 + seconds * 1000 * Math.max(4, this.expectedRtf() * 3)
  }

  private async startWorkers(device: VoiceDevice): Promise<void> {
    this.device = device
    this.rtf = null
    this.gpuJobs = 0
    this.replacements = 0
    this.set('starting')
    if (device === 'webgpu') {
      await this.spawn('webgpu')
      return
    }
    // All at once: each loads on its own core, so the second sentence starts
    // being made seconds sooner than if the workers queued to start. Reading
    // can begin as soon as the first is ready.
    const all = Array.from({ length: poolSize() }, () => this.spawn('wasm'))
    for (const p of all) p.catch(() => {})
    await Promise.any(all)
  }

  /** Moves to other workers mid-reading; queued pieces carry over. */
  private async switchTo(device: VoiceDevice): Promise<void> {
    const old = this.slots
    this.slots = []
    for (const s of old) {
      if (s.job) this.queue.unshift(s.job)
      s.worker.terminate()
    }
    try {
      await this.startWorkers(device)
      this.set('ready')
    } catch (err) {
      this.set('failed', { error: err instanceof Error ? err.message : String(err) })
    }
    this.pump()
  }

  /** Downloads the model if it is not here yet and starts the workers. Resolves once one can speak. */
  ensure(): Promise<void> {
    // Ready, or a replacement worker on its way: the queue waits for it.
    if (this.status === 'ready' && this.slots.length) return Promise.resolve()
    if (this.starting) return this.starting
    this.starting = (async () => {
      try {
        await this.download()
        const device = await chooseDevice()
        try {
          await this.startWorkers(device)
        } catch (err) {
          if (device !== 'webgpu') throw err
          // The GPU would not start here, or is too slow: remember, and use the CPU.
          if (!stored(GPU_SLOW_KEY)) store(GPU_SLOW_KEY, 'failed')
          for (const s of this.slots) s.worker.terminate()
          this.slots = []
          await this.startWorkers('wasm')
        }
        this.set('ready', { error: null })
      } catch (err) {
        for (const s of this.slots) s.worker.terminate()
        this.slots = []
        this.set('failed', { error: err instanceof Error ? err.message : String(err) })
        throw err
      } finally {
        this.starting = null
      }
    })()
    return this.starting
  }

  /** Speech for one piece of text, as 24 kHz samples: from the device's cache if it was made before. */
  synth(text: string, voice: NaturalVoiceInfo, speed: number): Promise<Float32Array> {
    return this.fromCache(text, voice, speed).then((hit) => {
      if (hit) return hit
      const made = new Promise<Float32Array>((resolve, reject) => {
        this.queue.push({ id: this.nextId++, text, voice, speed, resolve, reject, cancelled: false, retries: 0 })
        this.pump()
      })
      return made.then((pcm) => {
        void this.toCache(text, voice, speed, pcm)
        return pcm
      })
    })
  }

  private async fromCache(text: string, voice: NaturalVoiceInfo, speed: number): Promise<Float32Array | null> {
    try {
      const hit = await (await caches.open(AUDIO_CACHE)).match(cacheUrl(text, voice, speed))
      if (!hit) return null
      const pcm16 = new Int16Array(await hit.arrayBuffer())
      const out = new Float32Array(pcm16.length)
      for (let i = 0; i < pcm16.length; i++) out[i] = pcm16[i]! / 32767
      return out
    } catch {
      return null
    }
  }

  private async toCache(text: string, voice: NaturalVoiceInfo, speed: number, pcm: Float32Array): Promise<void> {
    try {
      const pcm16 = new Int16Array(pcm.length)
      for (let i = 0; i < pcm.length; i++) pcm16[i] = Math.max(-32767, Math.min(32767, Math.round(pcm[i]! * 32767)))
      const cache = await caches.open(AUDIO_CACHE)
      await cache.put(cacheUrl(text, voice, speed), new Response(pcm16.buffer, { headers: { 'content-type': 'application/octet-stream' } }))
      if (++this.audioWrites % 25 === 0) {
        const keys = await cache.keys()
        for (const k of keys.slice(0, Math.max(0, keys.length - AUDIO_CACHE_LIMIT))) await cache.delete(k)
      }
    } catch {
      /* no Cache Storage: it is made again next time */
    }
  }

  /** Forgets every piece not yet started. The ones in flight finish and are kept in the cache. */
  clear(): void {
    for (const j of this.queue) {
      j.cancelled = true
      j.reject(new Error('cancelled'))
    }
    this.queue = []
  }

  private pump(): void {
    this.queue = this.queue.filter((j) => !j.cancelled)
    for (const slot of this.slots) {
      if (!slot.ready || slot.job) continue
      const job = this.queue.shift()
      if (!job) break
      slot.job = job
      slot.watchdog = setTimeout(() => this.replace(slot, 'The voice stopped answering.'), this.deadline(job))
      const req: VoiceRequest = { cmd: 'speak', id: job.id, text: job.text, voice: job.voice.id, lang: job.voice.lang, speed: job.speed }
      slot.worker.postMessage(req)
    }
    this.touch()
  }

  private touch(): void {
    if (this.idleTimer) clearTimeout(this.idleTimer)
    const busy = this.queue.length > 0 || this.slots.some((s) => s.job)
    if (busy || !this.slots.length) return
    this.idleTimer = setTimeout(() => {
      for (const s of this.slots) s.worker.terminate()
      this.slots = []
      this.set('idle')
    }, isPhone() ? PHONE_IDLE_MS : IDLE_MS)
  }
}

export const naturalVoice = new NaturalVoice()
