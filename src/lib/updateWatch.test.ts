import { describe, expect, it } from 'vitest'
import { FOCUS_GAP_MS, RECHECK_MS, autoFetch, makeWatcher, startAutoDownload, type UpdateAsker } from './updateWatch'
import type { UpdateState, UpdateStatus } from './desktop'

function snapshot(status: UpdateStatus): UpdateState {
  return {
    status,
    current: '1.0.9',
    builtIn: '1.0.9',
    shell: '1.0.9',
    repo: 'begindtheseen/space',
    hasToken: false,
    canRollback: false,
  }
}

/** Records what was asked, and lets a test drive the clock. */
function fake(status: UpdateStatus = 'up-to-date') {
  let clock = 1_000_000
  const calls = { state: 0, check: 0 }
  const asker: UpdateAsker = {
    getState: async () => {
      calls.state += 1
      return snapshot(status)
    },
    check: async () => {
      calls.check += 1
      return snapshot('up-to-date')
    },
  }
  return {
    asker,
    calls,
    now: () => clock,
    advance: (ms: number) => {
      clock += ms
    },
  }
}

describe('makeWatcher', () => {
  it('does not ask again before the gap has passed', async () => {
    const f = fake()
    const w = makeWatcher(f.asker, f.now)

    expect(await w.ask(RECHECK_MS)).toBe(false)
    f.advance(RECHECK_MS - 1)
    expect(await w.ask(RECHECK_MS)).toBe(false)
    expect(f.calls.check).toBe(0)
  })

  it('asks once the gap has passed, and not again until the next one', async () => {
    const f = fake()
    const w = makeWatcher(f.asker, f.now)

    f.advance(RECHECK_MS)
    expect(await w.ask(RECHECK_MS)).toBe(true)
    expect(f.calls.check).toBe(1)

    // Straight after: too soon.
    expect(await w.ask(RECHECK_MS)).toBe(false)
    f.advance(RECHECK_MS)
    expect(await w.ask(RECHECK_MS)).toBe(true)
    expect(f.calls.check).toBe(2)
  })

  it('lets a refocus ask on its own shorter gap', async () => {
    const f = fake()
    const w = makeWatcher(f.asker, f.now)

    f.advance(FOCUS_GAP_MS)
    expect(await w.ask(FOCUS_GAP_MS)).toBe(true)
    expect(f.calls.check).toBe(1)
  })

  // The whole point: a release that lands while she has the app open.
  it('keeps asking while an update sits unread, so newer notes follow it', async () => {
    const f = fake('available')
    const w = makeWatcher(f.asker, f.now)

    f.advance(RECHECK_MS)
    expect(await w.ask(RECHECK_MS)).toBe(true)
    expect(f.calls.check).toBe(1)
  })

  it.each<UpdateStatus>(['checking', 'downloading', 'ready'])(
    'stays out of the way while the updater is %s',
    async (status) => {
      const f = fake(status)
      const w = makeWatcher(f.asker, f.now)

      f.advance(RECHECK_MS)
      expect(await w.ask(RECHECK_MS)).toBe(false)
      expect(f.calls.check).toBe(0)
    },
  )

  it('does not stack two asks that clear the gap together', async () => {
    const f = fake()
    const w = makeWatcher(f.asker, f.now)
    f.advance(RECHECK_MS)

    const [a, b] = await Promise.all([w.ask(RECHECK_MS), w.ask(RECHECK_MS)])
    expect([a, b]).toContain(true)
    expect([a, b]).toContain(false)
    expect(f.calls.check).toBe(1)
  })

  it('survives a check that throws, and does not retry it immediately', async () => {
    const f = fake()
    const asker: UpdateAsker = {
      getState: f.asker.getState,
      check: async () => {
        throw new Error('offline')
      },
    }
    const w = makeWatcher(asker, f.now)

    f.advance(RECHECK_MS)
    await expect(w.ask(RECHECK_MS)).resolves.toBe(true)
    // The failed attempt still counts as an ask, so a dead network is not
    // retried on every tick.
    expect(await w.ask(RECHECK_MS)).toBe(false)
  })

  it('survives a bridge that cannot be reached at all', async () => {
    const f = fake()
    const asker: UpdateAsker = {
      getState: async () => {
        throw new Error('no bridge')
      },
      check: f.asker.check,
    }
    const w = makeWatcher(asker, f.now)

    f.advance(RECHECK_MS)
    expect(await w.ask(RECHECK_MS)).toBe(false)
    expect(f.calls.check).toBe(0)
  })

  it('treats the moment it was made as the last ask', async () => {
    // The shell checks at launch; the watcher should not immediately repeat it.
    const f = fake()
    const w = makeWatcher(f.asker, f.now)
    expect(await w.ask(RECHECK_MS)).toBe(false)
    expect(f.calls.state).toBe(0)
  })
})

describe('autoFetch', () => {
  const latest = { version: '1.2.0', notes: '', publishedAt: '', size: 1, sha256: 'x', minShell: '1.1.1' }
  const at = (status: UpdateStatus, extra: Partial<UpdateState> = {}): UpdateState => ({ ...snapshot(status), latest, ...extra })

  it('fetches a bundle as soon as one is available, once per version', () => {
    const tried = new Set<string>()
    expect(autoFetch(at('available'), tried, true)).toBe('bundle')
    expect(autoFetch(at('available'), tried, true)).toBeNull()
    expect(autoFetch(at('available', { latest: { ...latest, version: '1.2.1' } }), tried, true)).toBe('bundle')
  })

  it('fetches the app when the release needs a newer one and this shell can replace itself', () => {
    const tried = new Set<string>()
    expect(autoFetch(at('shell-required'), tried, false)).toBeNull()
    expect(autoFetch(at('shell-required'), tried, true)).toBe('app')
    expect(autoFetch(at('shell-required'), tried, true)).toBeNull()
    expect(autoFetch(at('shell-required', { shellUpdate: { status: 'manual', version: '1.3.0' } }), new Set(), true)).toBeNull()
  })

  it('leaves everything to a shell that updates itself, and does nothing otherwise', () => {
    expect(autoFetch(at('available', { autoUpdate: true }), new Set(), true)).toBeNull()
    expect(autoFetch(at('shell-required', { autoUpdate: true }), new Set(), true)).toBeNull()
    // Turned off in a new shell (the e2e run, ORBIT_AUTO_UPDATE=0): hands off too.
    expect(autoFetch(at('available', { autoUpdate: false }), new Set(), true)).toBeNull()
    for (const s of ['idle', 'checking', 'up-to-date', 'downloading', 'ready', 'error'] as UpdateStatus[]) {
      expect(autoFetch(at(s), new Set(), true)).toBeNull()
    }
    expect(autoFetch(snapshot('available'), new Set(), true)).toBeNull()
  })

  it('starts the download from the current state and from pushed ones', async () => {
    let push: (s: UpdateState) => void = () => {}
    const calls: string[] = []
    const stop = startAutoDownload({
      getState: async () => at('available'),
      onState: (cb) => {
        push = cb
        return () => calls.push('stopped')
      },
      download: async () => {
        calls.push('download')
        return at('downloading')
      },
      downloadApp: async () => {
        calls.push('app')
        return at('shell-required')
      },
    })
    await Promise.resolve()
    await Promise.resolve()
    push(at('available'))
    push(at('shell-required', { latest: { ...latest, version: '2.0.0' } }))
    stop()
    expect(calls).toEqual(['download', 'app', 'stopped'])
  })
})
