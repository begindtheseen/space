/* ============================================================================
   ORBIT — keep looking for updates
   ----------------------------------------------------------------------------
   The shell asks GitHub for the latest release once, four seconds after
   launch, and then never again (desktop/main.js). That is fine for an app you
   open and close. This one gets left open — a lesson in the morning, reviews
   in the evening — so a release that lands while it is running stays
   invisible, and the update panel keeps saying it is up to date, because the
   last time it asked, it was.

   So the renderer asks again: on a timer, and when the window is given focus
   after being away long enough to be worth it. The answer comes back as a
   pushed snapshot, which every mounted `useUpdates` already receives, so
   nothing here touches the UI directly — the bell lights on its own.

   This lives in the renderer rather than the shell deliberately. The bundle
   updates itself; the `.app` around it is a separate download. A fix that
   shipped in the shell would only reach her the next time she installed one
   by hand, which is the very thing that went wrong.
   ========================================================================== */
import { getOrbit, type UpdateState, type UpdateStatus } from '@/lib/desktop'

/** How often to ask while the app is simply sitting there. */
export const RECHECK_MS = 30 * 60_000

/**
 * Coming back to the window asks again, but no more often than this. Tabbing
 * in and out of the app is not a reason to hammer the API.
 */
export const FOCUS_GAP_MS = 15 * 60_000

/**
 * Statuses where asking again would tell us nothing.
 *
 * `available` is not among them: if a newer release lands while an older one
 * is sitting unread in the bell, the notes should follow it.
 */
const SKIP: ReadonlySet<UpdateStatus> = new Set<UpdateStatus>(['checking', 'downloading', 'ready'])

/** The slice of the bridge this needs. */
export interface UpdateAsker {
  getState(): Promise<UpdateState>
  check(): Promise<UpdateState>
}

export interface Watcher {
  /** Ask, unless it is too soon or the updater is already working. Resolves to whether it asked. */
  ask(gapMs: number): Promise<boolean>
}

/**
 * The decision, separated from the wiring so it can be tested without a
 * window or a clock.
 */
export function makeWatcher(asker: UpdateAsker, now: () => number = Date.now, lastAsk = now()): Watcher {
  let last = lastAsk
  // Held across the whole call, not just the network part: without it, two
  // asks can both clear the gap while the first is still reading the state.
  let busy = false

  return {
    async ask(gapMs: number): Promise<boolean> {
      if (busy || now() - last < gapMs) return false
      busy = true
      let asked = false
      try {
        const { status } = await asker.getState()
        if (SKIP.has(status)) return false
        // Stamped before the request, so a slow answer cannot let a second
        // ask through behind it.
        last = now()
        asked = true
        await asker.check()
      } catch {
        // A check that fails is the updater's own business — it reports
        // through the state it pushes. Swallowed here so a dead network
        // cannot throw out of a timer.
      } finally {
        busy = false
      }
      return asked
    },
  }
}

/**
 * Start watching. Returns a function that stops it.
 *
 * A no-op outside the desktop shell, where there is no updater to ask.
 */
export function startUpdateWatch(): () => void {
  const orbit = getOrbit()
  if (!orbit || typeof window === 'undefined') return () => {}

  const watcher = makeWatcher(orbit.updates)
  const timer = window.setInterval(() => void watcher.ask(RECHECK_MS), RECHECK_MS)
  const onFocus = () => void watcher.ask(FOCUS_GAP_MS)
  window.addEventListener('focus', onFocus)

  return () => {
    window.clearInterval(timer)
    window.removeEventListener('focus', onFocus)
  }
}
