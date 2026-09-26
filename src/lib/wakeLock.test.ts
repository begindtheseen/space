import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/** A stand-in for navigator.wakeLock that records what was asked of it. */
function fakeWakeLock(opts: { refuse?: boolean } = {}) {
  const log: string[] = []
  const live: { released: boolean; release(): Promise<void>; addEventListener(t: string, cb: () => void): void }[] = []
  const wakeLock = {
    async request(type: string) {
      log.push(`request:${type}`)
      if (opts.refuse) throw new DOMException('denied', 'NotAllowedError')
      const listeners: (() => void)[] = []
      const s = {
        released: false,
        async release() {
          if (s.released) return
          s.released = true
          log.push('release')
          for (const cb of listeners) cb()
        },
        addEventListener(_t: string, cb: () => void) {
          listeners.push(cb)
        },
      }
      live.push(s)
      return s
    },
  }
  return { wakeLock, log, live }
}

const flush = () => new Promise((r) => setTimeout(r, 0))

describe('wake lock', () => {
  beforeEach(() => vi.resetModules())
  afterEach(() => vi.unstubAllGlobals())

  it('holds the screen while any reason does, and lets go when the last one ends', async () => {
    const fake = fakeWakeLock()
    vi.stubGlobal('navigator', { wakeLock: fake.wakeLock })
    const { holdAwake, awakeReasons } = await import('./wakeLock')
    const endFocus = holdAwake('focus')
    const endReading = holdAwake('read-aloud')
    await flush()
    expect(fake.log).toEqual(['request:screen'])
    expect(awakeReasons().sort()).toEqual(['focus', 'read-aloud'])
    endFocus()
    await flush()
    expect(fake.log).toEqual(['request:screen'])
    endReading()
    await flush()
    expect(fake.log).toEqual(['request:screen', 'release'])
    expect(awakeReasons()).toEqual([])
  })

  it('asks again after the browser drops the lock', async () => {
    const fake = fakeWakeLock()
    vi.stubGlobal('navigator', { wakeLock: fake.wakeLock })
    const { holdAwake } = await import('./wakeLock')
    const end = holdAwake('focus')
    await flush()
    await fake.live[0]!.release() // the page was hidden, say
    holdAwake('read-aloud')()
    await flush()
    expect(fake.log.filter((l) => l.startsWith('request'))).toHaveLength(2)
    end()
  })

  it('does nothing, and throws nothing, where the lock is missing or refused', async () => {
    vi.stubGlobal('navigator', {})
    let mod = await import('./wakeLock')
    expect(() => mod.holdAwake('focus')()).not.toThrow()
    vi.resetModules()
    const refused = fakeWakeLock({ refuse: true })
    vi.stubGlobal('navigator', { wakeLock: refused.wakeLock })
    mod = await import('./wakeLock')
    const end = mod.holdAwake('focus')
    await flush()
    expect(refused.log).toEqual(['request:screen'])
    end()
  })
})
