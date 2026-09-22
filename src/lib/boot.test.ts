import { describe, expect, it, vi } from 'vitest'
import { newLearnerState } from '@/engine/state'
import { BOOT_DONE_SIGNAL, runBoot, STEP_TIMEOUT_MS, type BootStep } from './boot'

const state = newLearnerState()
const step = (label: string, run: BootStep['run']): BootStep => ({ label, run, optional: true })

describe('runBoot', () => {
  it('runs every step in order and reports each as it starts', async () => {
    const seen: string[] = []
    const report = await runBoot(state, (label) => seen.push(label), [
      step('one', () => 1),
      step('two', async () => 2),
      step('three', () => 3),
    ])
    expect(seen).toEqual(['one', 'two', 'three'])
    expect(report.completed).toEqual(['one', 'two', 'three'])
    expect(report.skipped).toEqual([])
  })

  it('keeps going when a step throws, and says which was skipped', async () => {
    const report = await runBoot(state, () => {}, [
      step('fine', () => 1),
      step('broken', () => {
        throw new Error('nope')
      }),
      step('after', () => 3),
    ])
    // A cold cache must never cost a launch.
    expect(report.completed).toEqual(['fine', 'after'])
    expect(report.skipped).toEqual([{ label: 'broken', reason: 'nope' }])
  })

  it('survives a step that rejects rather than throws', async () => {
    const report = await runBoot(state, () => {}, [
      step('rejects', () => Promise.reject(new Error('async nope'))),
      step('after', () => 1),
    ])
    expect(report.completed).toEqual(['after'])
    expect(report.skipped[0]?.reason).toBe('async nope')
  })

  it('abandons a step that hangs instead of holding the app closed', async () => {
    vi.useFakeTimers()
    try {
      const promise = runBoot(state, () => {}, [
        step('hangs', () => new Promise(() => {})),
        step('after', () => 1),
      ])
      await vi.advanceTimersByTimeAsync(STEP_TIMEOUT_MS + 10)
      const report = await promise
      expect(report.completed).toEqual(['after'])
      expect(report.skipped[0]?.label).toBe('hangs')
      expect(report.skipped[0]?.reason).toContain('longer than')
    } finally {
      vi.useRealTimers()
    }
  })

  it('reports a duration', async () => {
    const report = await runBoot(state, () => {}, [step('one', () => 1)])
    expect(report.ms).toBeGreaterThanOrEqual(0)
  })

  it('does nothing when given no steps', async () => {
    const report = await runBoot(state, () => {}, [])
    expect(report.completed).toEqual([])
    expect(report.skipped).toEqual([])
  })
})

describe('the done signal', () => {
  it('cannot collide with a step label', () => {
    // The shell compares raw strings, so the sentinel must be something no
    // human-readable label could ever be.
    expect(BOOT_DONE_SIGNAL).toBe('\u0000boot-done')
    expect(BOOT_DONE_SIGNAL.startsWith('\u0000')).toBe(true)
  })

  it('matches the constant the shell compares against', () => {
    // desktop/main.js declares BOOT_DONE independently; if either moves, the
    // splash stops being released early and waits out its cap instead.
    const shell = readShellConstant()
    expect(shell).toBe(BOOT_DONE_SIGNAL)
  })
})

function readShellConstant(): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('node:fs') as typeof import('node:fs')
  const src = fs.readFileSync(new URL('../../desktop/main.js', import.meta.url), 'utf8')
  const m = /const BOOT_DONE = '([^']*)'/.exec(src)
  if (!m) throw new Error('BOOT_DONE not found in desktop/main.js')
  return JSON.parse(`"${m[1]}"`) as string
}
