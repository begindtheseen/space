/* ============================================================================
   The natural voice — the page's side
   ----------------------------------------------------------------------------
   A neural voice (Kokoro-82M) that reads like a person, the same on every
   device, instead of whatever the browser's built-in synthesiser offers —
   which on many phones and computers is still a voice from twenty years ago.

   It runs entirely on the device. The model (92 MB) is downloaded once from
   Hugging Face, where its authors publish it, and kept in Cache Storage, so
   after the first time it works offline. Speech is made by a small pool of
   workers (workers/voice.worker.ts), each making a different piece of the
   lesson at the same time: one alone is not fast enough on most machines.
   ========================================================================== */
import type { VoiceReply, VoiceRequest } from '@/workers/voice.worker'
import type { NaturalVoiceInfo } from './kokoro'

export const MODEL_URL = 'https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main/onnx/model_quantized.onnx'
/** The model's size, for the progress bar when the server does not say. */
export const MODEL_BYTES = 92_361_116
const CACHE_NAME = 'natural-voice-v1'
/** Workers are let go after this long without anything to say, to give back their memory. */
const IDLE_MS = 180_000

export type NaturalStatus = 'idle' | 'downloading' | 'starting' | 'ready' | 'failed'

interface Job {
  id: number
  text: string
  voice: NaturalVoiceInfo
  speed: number
  resolve: (pcm: Float32Array) => void
  reject: (err: Error) => void
  cancelled: boolean
}

interface Slot {
  worker: Worker
  ready: boolean
  job: Job | null
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
 * How many workers to run. Each holds the model in memory (a few hundred MB),
 * so a phone gets two and a roomy computer three; a machine with two cores or
 * fewer gets one, because a second would only fight the page for the CPU.
 */
export function poolSize(nav: { hardwareConcurrency?: number; deviceMemory?: number; userAgent?: string; maxTouchPoints?: number } = navigator): number {
  const cores = nav.hardwareConcurrency ?? 2
  if (cores <= 2) return 1
  const phone = /Mobi|Android|iPhone|iPad/i.test(nav.userAgent ?? '') || ((nav.maxTouchPoints ?? 0) > 1 && /Macintosh/.test(nav.userAgent ?? ''))
  const memory = nav.deviceMemory ?? (phone ? 4 : 8)
  // A phone that says it has the memory and the cores gets a third worker:
  // phone cores are slower, so it needs the help more than a laptop does.
  if (phone) return memory >= 8 && cores >= 8 ? 3 : 2
  if (memory < 8 || cores < 6) return 2
  return 3
}

class NaturalVoice {
  status: NaturalStatus = 'idle'
  /** Download progress, 0 to 1, while downloading. */
  progress = 0
  error: string | null = null

  private slots: Slot[] = []
  private queue: Job[] = []
  private nextId = 1
  private starting: Promise<void> | null = null
  private idleTimer: ReturnType<typeof setTimeout> | null = null
  private listeners = new Set<() => void>()

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

  private spawn(): Promise<void> {
    return new Promise((resolve, reject) => {
      const worker = new Worker(new URL('../../workers/voice.worker.ts', import.meta.url), { type: 'module' })
      const slot: Slot = { worker, ready: false, job: null }
      this.slots.push(slot)
      worker.onmessage = (e: MessageEvent<VoiceReply>) => {
        const m = e.data
        if (m.type === 'ready') {
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
        slot.job = null
        if (job && job.id === m.id) {
          if (m.type === 'audio') job.resolve(m.pcm)
          else job.reject(new Error(m.message))
        }
        this.pump()
      }
      worker.onerror = (e) => {
        e.preventDefault()
        this.slots = this.slots.filter((s) => s !== slot)
        slot.job?.reject(new Error('The voice stopped unexpectedly.'))
        reject(new Error('The voice could not start in this browser.'))
        this.pump()
      }
      const init: VoiceRequest = {
        cmd: 'init',
        modelUrl: MODEL_URL,
        cacheName: CACHE_NAME,
        voiceBase: new URL(`${import.meta.env.BASE_URL}voices/`, location.href).href,
      }
      worker.postMessage(init)
    })
  }

  /** Downloads the model if it is not here yet and starts the workers. Resolves once one can speak. */
  ensure(): Promise<void> {
    if (this.status === 'ready' && this.slots.some((s) => s.ready)) return Promise.resolve()
    if (this.starting) return this.starting
    this.starting = (async () => {
      try {
        await this.download()
        this.set('starting')
        const n = poolSize()
        // The first worker is what she is waiting for; the rest start after
        // it, so they do not compete with it for the CPU while it loads.
        await this.spawn()
        this.set('ready', { error: null })
        for (let i = 1; i < n; i++) void this.spawn().catch(() => {})
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

  /** Speech for one piece of text, as 24 kHz samples. */
  synth(text: string, voice: NaturalVoiceInfo, speed: number): { promise: Promise<Float32Array>; cancel: () => void } {
    let job!: Job
    const promise = new Promise<Float32Array>((resolve, reject) => {
      job = { id: this.nextId++, text, voice, speed, resolve, reject, cancelled: false }
    })
    this.queue.push(job)
    this.pump()
    return {
      promise,
      cancel: () => {
        job.cancelled = true
      },
    }
  }

  /** Forgets every piece not yet started. The ones in flight finish and are thrown away. */
  clear(): void {
    for (const j of this.queue) j.cancelled = true
    this.queue = []
  }

  private pump(): void {
    this.queue = this.queue.filter((j) => !j.cancelled)
    for (const slot of this.slots) {
      if (!slot.ready || slot.job) continue
      const job = this.queue.shift()
      if (!job) break
      slot.job = job
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
    }, IDLE_MS)
  }
}

export const naturalVoice = new NaturalVoice()
