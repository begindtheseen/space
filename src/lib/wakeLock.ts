/* ============================================================================
   ORBIT — keeping the screen awake
   ----------------------------------------------------------------------------
   A Mac dims and sleeps its display after a few minutes without a key press.
   That is right for most apps and wrong for this one: reading a derivation,
   listening to a lesson, or sitting in a focus block are all long stretches
   of looking without touching, and the screen going dark in the middle of
   one breaks it.

   So the app holds a screen wake lock (the browser's Screen Wake Lock API)
   while there is a reason to: a focus block is running, the lesson is being
   read aloud, or she has used the app in the last fifteen minutes. The
   last is what keeps a long read on screen, and the time limit is what lets
   the display sleep when she has walked away.

   Every reason is a named hold; the lock is held while any hold is, and only
   while the page is visible (the browser drops the lock on its own when it
   is hidden, and it is asked for again on the way back). Where the API is
   missing or refused — an old desktop shell that denies every permission, a
   browser without it — nothing happens and nothing breaks.
   ========================================================================== */
import { useEffect } from 'react'

interface Sentinel {
  readonly released: boolean
  release(): Promise<void>
  addEventListener(type: 'release', cb: () => void): void
}
interface WakeLockApi {
  request(type: 'screen'): Promise<Sentinel>
}

/** How long after her last touch, key or scroll the screen is kept on. */
export const IDLE_MS = 15 * 60_000

const holds = new Set<string>()
let sentinel: Sentinel | null = null
let requesting = false
let listening = false

function api(): WakeLockApi | null {
  if (typeof navigator === 'undefined') return null
  return (navigator as Navigator & { wakeLock?: WakeLockApi }).wakeLock ?? null
}

const visible = () => typeof document === 'undefined' || document.visibilityState === 'visible'

async function sync(): Promise<void> {
  const want = holds.size > 0 && visible()
  if (want && !sentinel && !requesting) {
    const wl = api()
    if (!wl) return
    requesting = true
    try {
      const s = await wl.request('screen')
      s.addEventListener('release', () => {
        if (sentinel === s) sentinel = null
      })
      sentinel = s
      // A hold may have ended while the request was out.
      if (holds.size === 0 || !visible()) void release()
    } catch {
      // Refused (no permission, low battery, page hidden): try again next time
      // something changes rather than in a loop.
    } finally {
      requesting = false
    }
  } else if (!want && sentinel) {
    await release()
  }
}

async function release(): Promise<void> {
  const s = sentinel
  sentinel = null
  try {
    await s?.release()
  } catch {
    /* already gone */
  }
}

function listen() {
  if (listening || typeof document === 'undefined') return
  listening = true
  document.addEventListener('visibilitychange', () => void sync())
}

/** Keeps the screen on until the returned function is called. */
export function holdAwake(reason: string): () => void {
  listen()
  holds.add(reason)
  void sync()
  return () => {
    holds.delete(reason)
    void sync()
  }
}

/** What is holding the screen on, for tests and the curious. */
export function awakeReasons(): string[] {
  return [...holds]
}

/** Holds the screen on while `active` is true. */
export function useWakeLock(reason: string, active: boolean): void {
  useEffect(() => (active ? holdAwake(reason) : undefined), [reason, active])
}

const ACTIVITY = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'scroll', 'touchstart'] as const

/**
 * Holds the screen on while she is using the app, and lets it go `idleMs`
 * after the last sign of her: a click, a key, a scroll, a touch.
 */
export function useAwakeWhileActive(reason = 'in-use', idleMs = IDLE_MS): void {
  useEffect(() => {
    if (typeof window === 'undefined') return
    let release: (() => void) | null = null
    let timer: number | undefined
    let last = 0
    const touch = () => {
      const now = Date.now()
      // Pointer moves arrive by the hundred; re-arming once a second is plenty.
      if (release && now - last < 1000) return
      last = now
      release ??= holdAwake(reason)
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        release?.()
        release = null
      }, idleMs)
    }
    touch()
    for (const e of ACTIVITY) window.addEventListener(e, touch, { passive: true, capture: true })
    return () => {
      for (const e of ACTIVITY) window.removeEventListener(e, touch, { capture: true })
      window.clearTimeout(timer)
      release?.()
    }
  }, [reason, idleMs])
}
