/// <reference lib="webworker" />
/* ============================================================================
   The natural voice — one synthesis worker
   ----------------------------------------------------------------------------
   Runs Kokoro-82M (a neural text-to-speech model, Apache-2.0) with ONNX
   Runtime in WebAssembly, and turns one piece of text into speech: 24 kHz
   mono samples, handed back to the page to play.

   Several of these run side by side (lib/voice/natural.ts keeps the pool):
   one worker cannot make speech as fast as it is spoken on most machines,
   because WebAssembly here runs on a single thread — the page is not
   cross-origin isolated, so there are no shared-memory threads. Separate
   workers each on their own core, each making a different sentence, can.

   The runtime (about 14 MB) and the phonemiser (about 3 MB) are downloaded
   once from a CDN, pinned to exact versions, like the compilers; the model is
   downloaded once by the page into Cache Storage and read from there.
   ========================================================================== */
import { SAMPLE_RATE, cleanPhonemes, splitPunctuation, normalizeText, styleRow, tokenize } from '@/lib/voice/kokoro'

const ORT_VERSION = '1.30.0'
const PHONEMIZER_VERSION = '1.2.1'
const ORT_MIRRORS = [
  `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VERSION}/dist/`,
  `https://unpkg.com/onnxruntime-web@${ORT_VERSION}/dist/`,
]
const PHONEMIZER_MIRRORS = [
  `https://cdn.jsdelivr.net/npm/phonemizer@${PHONEMIZER_VERSION}/dist/phonemizer.js`,
  `https://unpkg.com/phonemizer@${PHONEMIZER_VERSION}/dist/phonemizer.js`,
]

/** Rows of 256 numbers in a voice file: one style per phoneme count. */
const STYLE_DIM = 256

// The slice of ONNX Runtime used here, typed locally so the app takes no
// build-time dependency on a runtime it downloads when the voice is first used.
interface OrtTensor {
  data: Float32Array
}
interface OrtSession {
  run(feeds: Record<string, unknown>): Promise<Record<string, OrtTensor>>
  outputNames: readonly string[]
}
interface Ort {
  env: { wasm: { wasmPaths: string; numThreads: number; proxy: boolean } }
  Tensor: new (type: string, data: unknown, dims: number[]) => unknown
  InferenceSession: { create(model: Uint8Array, opts: Record<string, unknown>): Promise<OrtSession> }
}
type Phonemize = (text: string, lang: string) => Promise<string[]>

export type VoiceRequest =
  | { cmd: 'init'; modelUrl: string; cacheName: string; voiceBase: string }
  | { cmd: 'speak'; id: number; text: string; voice: string; lang: 'en-us' | 'en'; speed: number }

export type VoiceReply =
  | { type: 'ready' }
  | { type: 'fatal'; message: string }
  | { type: 'audio'; id: number; pcm: Float32Array; sampleRate: number }
  | { type: 'error'; id: number; message: string }

const post = (m: VoiceReply, transfer: Transferable[] = []) => (self as unknown as Worker).postMessage(m, transfer)

async function firstImport<T>(urls: string[]): Promise<{ mod: T; url: string }> {
  let last: unknown = null
  for (const url of urls) {
    try {
      return { mod: (await import(/* @vite-ignore */ url)) as T, url }
    } catch (err) {
      last = err
    }
  }
  throw last instanceof Error ? last : new Error(String(last))
}

let ort: Ort | null = null
let session: OrtSession | null = null
let phonemize: Phonemize | null = null
let voiceBase = ''
const voices = new Map<string, Promise<Float32Array>>()

async function modelBytes(url: string, cacheName: string): Promise<Uint8Array> {
  // The page downloads the model into this cache first, with progress; a
  // worker only reads it. Fetching directly is the fallback for a browser
  // with no Cache Storage (some private windows).
  try {
    const cache = await caches.open(cacheName)
    const hit = await cache.match(url)
    if (hit) return new Uint8Array(await hit.arrayBuffer())
  } catch {
    /* no Cache Storage here: fetch it instead */
  }
  const res = await fetch(url)
  if (!res.ok) throw new Error(`The voice model did not download (HTTP ${res.status}).`)
  return new Uint8Array(await res.arrayBuffer())
}

async function init(req: Extract<VoiceRequest, { cmd: 'init' }>): Promise<void> {
  voiceBase = req.voiceBase
  const [runtime, phon] = await Promise.all([
    firstImport<Ort & { default?: Ort }>(ORT_MIRRORS.map((b) => `${b}ort.wasm.min.mjs`)),
    firstImport<{ phonemize: Phonemize }>(PHONEMIZER_MIRRORS),
  ])
  ort = runtime.mod.default ?? runtime.mod
  ort.env.wasm.wasmPaths = runtime.url.slice(0, runtime.url.lastIndexOf('/') + 1)
  ort.env.wasm.numThreads = 1
  ort.env.wasm.proxy = false
  phonemize = phon.mod.phonemize
  const bytes = await modelBytes(req.modelUrl, req.cacheName)
  session = await ort.InferenceSession.create(bytes, { executionProviders: ['wasm'], graphOptimizationLevel: 'all' })
}

function voice(id: string): Promise<Float32Array> {
  let v = voices.get(id)
  if (!v) {
    v = fetch(`${voiceBase}${id}.bin`).then(async (res) => {
      if (!res.ok) throw new Error(`The voice "${id}" did not load (HTTP ${res.status}).`)
      return new Float32Array(await res.arrayBuffer())
    })
    v.catch(() => voices.delete(id))
    voices.set(id, v)
  }
  return v
}

/** Text → phonemes, keeping the punctuation the model needs for its pauses and pitch. */
async function toPhonemes(text: string, lang: 'en-us' | 'en'): Promise<string> {
  const parts = await Promise.all(
    splitPunctuation(normalizeText(text)).map(async (p) => (p.punct ? p.text : (await phonemize!(p.text, lang)).join(' '))),
  )
  return cleanPhonemes(parts.join(''), lang)
}

async function speak(req: Extract<VoiceRequest, { cmd: 'speak' }>): Promise<Float32Array> {
  if (!ort || !session || !phonemize) throw new Error('The voice is not ready.')
  const [phonemes, styles] = await Promise.all([toPhonemes(req.text, req.lang), voice(req.voice)])
  const ids = tokenize(phonemes)
  if (ids.length <= 2) return new Float32Array(0)
  const row = styleRow(ids.length, Math.floor(styles.length / STYLE_DIM))
  const style = styles.slice(row * STYLE_DIM, row * STYLE_DIM + STYLE_DIM)
  const out = await session.run({
    input_ids: new ort.Tensor('int64', BigInt64Array.from(ids, (n) => BigInt(n)), [1, ids.length]),
    style: new ort.Tensor('float32', style, [1, STYLE_DIM]),
    speed: new ort.Tensor('float32', Float32Array.of(req.speed), [1]),
  })
  const wave = out[session.outputNames[0]!]!.data
  // A copy the page can own: the runtime reuses its output buffers.
  return new Float32Array(wave)
}

// One request at a time, in order: the pool sends a worker its next piece
// only when it has answered the last, so there is never a queue in here.
let chain: Promise<void> = Promise.resolve()
self.onmessage = (e: MessageEvent<VoiceRequest>) => {
  const req = e.data
  chain = chain.then(async () => {
    if (req.cmd === 'init') {
      try {
        await init(req)
        post({ type: 'ready' })
      } catch (err) {
        post({ type: 'fatal', message: err instanceof Error ? err.message : String(err) })
      }
      return
    }
    try {
      const pcm = await speak(req)
      post({ type: 'audio', id: req.id, pcm, sampleRate: SAMPLE_RATE }, [pcm.buffer])
    } catch (err) {
      post({ type: 'error', id: req.id, message: err instanceof Error ? err.message : String(err) })
    }
  })
}
