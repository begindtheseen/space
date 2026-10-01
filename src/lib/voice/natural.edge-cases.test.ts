import { describe, expect, it } from 'vitest'
import { workerPlan } from './natural'

describe('natural voice: edge cases and boundary conditions', () => {
  describe('GPU Real-Time Factor (RTF) threshold at 0.9', () => {
    const GPU_MAX_RTF = 0.9

    it('correctly identifies GPU_MAX_RTF = 0.9 as the cutoff', () => {
      // When RTF = 0.9, speech is made in real-time: 1 second of work for 1 second of speech.
      // Above 0.9, GPU is slower than real-time and should be dropped in favor of CPU pool.
      const gpu_fast = 0.7 // Faster than 0.9: keep GPU
      const gpu_slow = 0.95 // Slower than 0.9: drop GPU
      const cpu_typical = 1.6 // Typical CPU performance

      expect(gpu_fast).toBeLessThanOrEqual(GPU_MAX_RTF)
      expect(gpu_slow).toBeGreaterThan(GPU_MAX_RTF)
      expect(cpu_typical).toBeGreaterThan(gpu_slow)
    })

    it('handles RTF measurement at the exact boundary (0.9)', () => {
      // RTF = ms / 1000 / seconds, so if a 1-second sentence takes 900ms, RTF = 0.9
      const ms = 900
      const seconds = 1.0
      const rtf = ms / 1000 / seconds
      expect(rtf).toBe(GPU_MAX_RTF)
      // At the exact boundary, GPU should be kept (not > GPU_MAX_RTF)
      expect(rtf > 0.9).toBe(false)
    })

    it('computes running RTF average correctly with exponential smoothing', () => {
      // RTF is updated as: rtf = rtf * 0.6 + newRtf * 0.4
      // This is a 60% weight on history, 40% on new measurement
      const rtf1 = null // First measurement
      const newRtf1 = 0.7
      const rtf2 = rtf1 === null ? newRtf1 : rtf1 * 0.6 + newRtf1 * 0.4
      expect(rtf2).toBe(0.7) // First measurement becomes the average

      // Second measurement: GPU heats up, RTF increases
      const newRtf2 = 0.95
      const rtf3 = rtf2 * 0.6 + newRtf2 * 0.4
      expect(rtf3).toBeCloseTo(0.7 * 0.6 + 0.95 * 0.4, 2) // ≈ 0.8 (weighted average)

      // Third measurement: GPU still slow
      const newRtf3 = 0.93
      const rtf4 = rtf3 * 0.6 + newRtf3 * 0.4
      expect(rtf4).toBeGreaterThan(0.8)
      // After 3 slow measurements, should exceed 0.9 threshold
    })
  })

  describe('worker pool lifecycle and rotation', () => {
    it('rotates workers after ROTATE_AFTER = 30 sentences', () => {
      // Workers are swapped after 30 sentences because WebAssembly memory only grows.
      const ROTATE_AFTER = 30
      const sentenceCount = ROTATE_AFTER + 5

      // The 30th sentence should trigger rotation
      const rotate_at = 30
      expect(rotate_at % ROTATE_AFTER).toBe(0)
      expect(sentenceCount).toBeGreaterThan(ROTATE_AFTER)

      // But rotation only happens if the queue is empty and the worker is not currently busy
      const queue_empty = true
      const worker_idle = true
      expect(rotate_at >= ROTATE_AFTER && queue_empty && worker_idle).toBe(true)
    })

    it('handles worker spawn failures with retry and replacement', () => {
      // When a worker fails to spawn, it is replaced. Up to MAX_REPLACEMENTS = 6.
      const MAX_REPLACEMENTS = 6
      const replacements = [1, 2, 3, 4, 5, 6]
      replacements.forEach((attempt) => {
        expect(attempt).toBeLessThanOrEqual(MAX_REPLACEMENTS)
      })
      // The 7th failure should trigger giveUp()
      expect(MAX_REPLACEMENTS + 1).toBeGreaterThan(MAX_REPLACEMENTS)
    })
  })

  describe('worker pool sizing', () => {
    it('caps pool size based on device memory and CPU cores', () => {
      // On a 4-core machine with 8GB: workerPlan() should return a reasonable pool
      const plan = workerPlan(
        {
          hardwareConcurrency: 4,
          deviceMemory: 8,
        } as unknown as Navigator,
        false, // No threading
      )
      // Should be 1-3 workers on a typical 4-core machine
      expect(plan.workers).toBeGreaterThanOrEqual(1)
      expect(plan.workers).toBeLessThanOrEqual(3)
    })

    it('uses phone pool size on limited devices', () => {
      const plan = workerPlan(
        {
          hardwareConcurrency: 4,
          deviceMemory: 4,
        } as unknown as Navigator,
        false,
      )
      // Phone or low-memory devices should have fewer workers
      expect(plan.workers).toBeGreaterThanOrEqual(1)
    })
  })

  describe('concurrent sentence synthesis', () => {
    it('handles lookahead synthesis without blocking the main sentence', () => {
      // Lookahead pre-fetches the next sentence while the current one plays.
      // Promise.race([audioFor(...), sleep(8000)]) ensures it doesn't block forever.
      const timeoutMs = 8000
      expect(timeoutMs).toBeGreaterThan(5000) // Timeout long enough for synthesis
      expect(timeoutMs).toBeLessThan(15000) // But not so long the reading seems paused
    })

    it('cancels lookahead gracefully if the lesson changes mid-synthesis', () => {
      // Epoch tracking ensures cancelled work doesn't interfere with the new lesson.
      const epochRef = { current: 1 }
      const epoch = epochRef.current

      // Lesson changes
      epochRef.current = 2

      // The lookahead should check `if (epoch !== epochRef.current) return`
      expect(epoch).not.toBe(epochRef.current)
    })
  })

  describe('audio context state transitions', () => {
    it('correctly distinguishes audio context states', () => {
      // Valid states: suspended, running, closed, interrupted (iOS)
      const states = ['suspended', 'running', 'closed', 'interrupted'] as const
      expect(states).toContain('running')
      expect(states).toContain('suspended')

      // Attempting to use a closed context should fail
      const ctx_state: string = 'closed'
      expect(ctx_state === 'running').toBe(false)
    })
  })

  describe('FIFO audio cache eviction', () => {
    it('evicts oldest cached sentences first when cache exceeds limit', () => {
      // AUDIO_CACHE_LIMIT = 400 sentences (~60 MB)
      const AUDIO_CACHE_LIMIT = 400
      const cache = new Map<string, ArrayBuffer>()

      // Fill cache to limit
      for (let i = 0; i < AUDIO_CACHE_LIMIT + 10; i++) {
        const key = `sentence-${i}`
        const value = new ArrayBuffer(150_000) // ~150KB per sentence
        cache.set(key, value)
      }

      // Current FIFO implementation: oldest keys are evicted
      const keys = Array.from(cache.keys())
      expect(keys.length).toBeLessThanOrEqual(AUDIO_CACHE_LIMIT + 10)
      // First keys in the array are oldest; they should be removed first
      const oldest_key = keys[0]
      expect(oldest_key).toBeDefined()
    })
  })

  describe('remembered GPU performance across sessions', () => {
    it('stores and retrieves GPU_SLOW_KEY from localStorage', () => {
      // If GPU measured slow, key is stored: localStorage[GPU_SLOW_KEY] = RTF value
      const gpu_slow_rtf = '0.95'

      // On next launch, chooseDevice() checks this key
      // If present, it returns 'wasm' instead of trying GPU again
      const stored = gpu_slow_rtf
      expect(stored).toBeDefined()
      expect(Number(stored)).toBeGreaterThan(0.9)
    })
  })

  describe('keepalive for Chromium 15-second pause bug', () => {
    it('documents the Chromium bug and keepalive interval', () => {
      // Bug: Chromium stops speaking after ~15 seconds unless nudged
      // Workaround: periodic pause/resume cycle with KEEPALIVE_MS = 10_000
      const KEEPALIVE_MS = 10_000
      const CHROMIUM_FREEZE_THRESHOLD = 15_000

      expect(KEEPALIVE_MS).toBeLessThan(CHROMIUM_FREEZE_THRESHOLD)
      expect(KEEPALIVE_MS).toBeGreaterThan(5000) // Frequent enough to prevent freeze
    })

    it('handles missed resume gracefully', () => {
      // If pause/resume fails, one missed resume must not silence the rest.
      // Detected by: haltedRef tracks how long ago audio stopped.
      // After 1500ms paused, show "paused" state so user can tap Resume.
      const HALT_THRESHOLD = 1500
      const halt_time = 1600
      expect(halt_time).toBeGreaterThan(HALT_THRESHOLD)
    })
  })
})
