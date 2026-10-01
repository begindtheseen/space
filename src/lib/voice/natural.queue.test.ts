import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { VoiceReply, VoiceRequest } from '@/workers/voice.worker'
import { naturalVoiceFor } from './kokoro'
import { NaturalVoice } from './natural'

/** A voice worker that starts at once and makes each piece when the test says. */
class FakeWorker {
  static all: FakeWorker[] = []
  static failStart = false
  onmessage: ((e: { data: VoiceReply }) => void) | null = null
  onerror: ((e: { preventDefault(): void }) => void) | null = null
  speaking: { id: number; text: string }[] = []
  constructor() {
    FakeWorker.all.push(this)
  }
  postMessage(m: VoiceRequest) {
    if (m.cmd === 'init') {
      const reply: VoiceReply = FakeWorker.failStart ? { type: 'fatal', message: 'no voice here' } : { type: 'ready' }
      queueMicrotask(() => this.onmessage?.({ data: reply }))
    } else this.speaking.push({ id: m.id, text: m.text })
  }
  finish() {
    const j = this.speaking.shift()!
    this.onmessage?.({ data: { type: 'audio', id: j.id, pcm: new Float32Array(24_000), sampleRate: 24_000, ms: 200 } })
  }
  terminate() {}
}

const VOICE = naturalVoiceFor('')!
const busy = () => FakeWorker.all.flatMap((w) => w.speaking.map((s) => s.text)).sort()
const flush = async () => {
  for (let i = 0; i < 10; i++) await new Promise((r) => setImmediate(r))
}

describe('the voice queue', () => {
  beforeEach(() => {
    FakeWorker.all = []
    FakeWorker.failStart = false
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    vi.stubGlobal('Worker', FakeWorker)
    // A computer with room for three workers.
    vi.stubGlobal('navigator', { hardwareConcurrency: 8, userAgent: 'test', maxTouchPoints: 0 })
    vi.stubGlobal('location', { href: 'http://localhost/' })
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('makes openings ahead on one worker at most, leaving the rest for the lesson being read', async () => {
    const v = new NaturalVoice()
    await v.ensure()
    await flush()
    expect(FakeWorker.all).toHaveLength(3)
    for (const t of ['a1', 'a2', 'a3']) void v.synth(t, VOICE, 1, 'ahead', true)
    await flush()
    expect(busy()).toEqual(['a1'])
    // Pressing play: the reader's pieces go straight to the free workers.
    void v.synth('r1', VOICE, 1, 'reader')
    void v.synth('r2', VOICE, 1, 'reader')
    await flush()
    expect(busy()).toEqual(['a1', 'r1', 'r2'])
    // A worker coming free takes the reader's next piece before another opening.
    void v.synth('r3', VOICE, 1, 'reader')
    await flush()
    FakeWorker.all.find((w) => w.speaking[0]?.text === 'r1')!.finish()
    await flush()
    expect(busy()).toEqual(['a1', 'r2', 'r3'])
  })

  it('shares a piece already on its way, moved up to the place of whoever needs it soonest', async () => {
    const v = new NaturalVoice()
    await v.ensure()
    await flush()
    const first = v.synth('opening', VOICE, 1, 'ahead', true)
    const waiting = v.synth('next opening', VOICE, 1, 'ahead', true)
    await flush()
    expect(busy()).toEqual(['opening'])
    // The reader asks for the opening still waiting its turn: the same piece, made now, not a second copy.
    const asked = v.synth('next opening', VOICE, 1, 'reader')
    expect(asked).toBe(waiting)
    await flush()
    expect(busy()).toEqual(['next opening', 'opening'])
    expect(v.synth('opening', VOICE, 1, 'reader')).toBe(first)
  })

  it('tells every waiting piece when the voice cannot start, so nothing waits on it forever', async () => {
    FakeWorker.failStart = true
    const v = new NaturalVoice()
    const piece = v.synth('hello', VOICE, 1, 'reader')
    await flush()
    await expect(v.ensure()).rejects.toBeTruthy()
    await expect(piece).rejects.toBeTruthy()
  })

  it('clearing openings made ahead leaves the reader’s pieces alone', async () => {
    const v = new NaturalVoice()
    await v.ensure()
    await flush()
    for (const w of ['x', 'y', 'z']) void v.synth(w, VOICE, 1, 'reader')
    const later = v.synth('later', VOICE, 1, 'reader')
    const ahead = v.synth('ahead', VOICE, 1, 'ahead', true)
    await flush()
    v.clear('ahead')
    await expect(ahead).rejects.toThrow('cancelled')
    FakeWorker.all[0]!.finish()
    await flush()
    expect(busy()).toContain('later')
    void later
  })
})
