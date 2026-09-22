/* ============================================================================
   ORBIT — desktop update state
   ----------------------------------------------------------------------------
   A thin React view over the shell's updater. The main process is the single
   source of truth: every transition arrives as a full snapshot over the
   bridge, so nothing is derived here — the hook stores the latest snapshot
   and knows whether one of its own calls is still in flight.

   Outside the desktop shell there is no bridge. The hook then returns a null
   state, never subscribes, and every action resolves to null, so the browser
   build carries no behaviour from it.
   ========================================================================== */
import { useCallback, useEffect, useRef, useState } from 'react'
import { getOrbit, isUpdateState, type OrbitBridge, type UpdateState } from '@/lib/desktop'

type Action = (updates: OrbitBridge['updates']) => Promise<unknown>

export interface UseUpdates {
  /** Latest snapshot; null before the first one arrives, and always null in a browser. */
  state: UpdateState | null
  /** A call from this hook is in flight, or the updater reports it is checking or downloading. */
  busy: boolean
  /** Each action resolves with the snapshot it produced, or null when nothing came back. */
  check(): Promise<UpdateState | null>
  download(): Promise<UpdateState | null>
  /** Resolves only if the shell declined to relaunch; on success the app restarts. */
  apply(): Promise<UpdateState | null>
  rollback(): Promise<UpdateState | null>
  setToken(token: string | null): Promise<UpdateState | null>
}

export function useUpdates(): UseUpdates {
  const [orbit] = useState(getOrbit)
  const [state, setState] = useState<UpdateState | null>(null)
  const [pending, setPending] = useState(0)
  // Mirrors `state` so an action can build an error snapshot from the latest
  // one without waiting for a render.
  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => {
    if (!orbit) return
    let live = true
    let unsubscribe: (() => void) | undefined
    try {
      unsubscribe = orbit.updates.onState((next) => {
        if (live && isUpdateState(next)) setState(next)
      })
    } catch (err) {
      setState(transportError(null, orbit, err))
    }
    // Subscribed first, so a push that lands while getState() is in flight
    // wins: a push is always at least as fresh as the snapshot.
    orbit.updates.getState().then(
      (snapshot) => {
        if (live && isUpdateState(snapshot)) setState((prev) => prev ?? snapshot)
      },
      (err: unknown) => {
        if (live) setState((prev) => prev ?? transportError(null, orbit, err))
      },
    )
    return () => {
      live = false
      unsubscribe?.()
    }
  }, [orbit])

  const run = useCallback(
    async (action: Action): Promise<UpdateState | null> => {
      if (!orbit) return null
      setPending((n) => n + 1)
      try {
        const result = await action(orbit.updates)
        if (!isUpdateState(result)) return null
        setState(result)
        return result
      } catch (err) {
        // ipc.js answers every invoke with a state, so a rejection means the
        // bridge itself failed; surface it in the same shape.
        const next = transportError(stateRef.current, orbit, err)
        setState(next)
        return next
      } finally {
        setPending((n) => n - 1)
      }
    },
    [orbit],
  )

  const check = useCallback(() => run((u) => u.check()), [run])
  const download = useCallback(() => run((u) => u.download()), [run])
  const apply = useCallback(() => run((u) => u.apply()), [run])
  const rollback = useCallback(() => run((u) => u.rollback()), [run])
  const setToken = useCallback((token: string | null) => run((u) => u.setToken(token)), [run])

  const status = state?.status
  return {
    state,
    busy: pending > 0 || status === 'checking' || status === 'downloading',
    check,
    download,
    apply,
    rollback,
    setToken,
  }
}

function transportError(prev: UpdateState | null, orbit: OrbitBridge, err: unknown): UpdateState {
  const base: UpdateState = prev ?? {
    status: 'idle',
    current: orbit.versions.bundle,
    builtIn: orbit.versions.builtIn,
    shell: orbit.versions.shell,
    repo: '',
    hasToken: false,
    canRollback: false,
  }
  return { ...base, status: 'error', error: `Could not reach the desktop shell (${describe(err)}).` }
}

function describe(err: unknown): string {
  if (err instanceof Error && err.message) return err.message
  if (typeof err === 'string' && err) return err
  return 'unknown error'
}
