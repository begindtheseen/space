/* ============================================================================
   ORBIT — learner context
   ----------------------------------------------------------------------------
   One provider holding the whole learner state, plus the derived values the UI
   reads constantly (mastery per module, readiness per track, due count).

   Derivation is memoised on a `revision` counter rather than on the state
   object itself: mastery is a full pass over every atom in the corpus, and
   recomputing it on each React render would show up as jank during a review
   session where state changes on every keypress.
   ========================================================================== */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { MODULES, TRACK_ORDER, dag as buildDag } from '@/curriculum'
import type { Module, TrackId } from '@/curriculum/types'
import { applyAttempt, type AttemptInput, type AttemptOutcome } from '@/engine/apply'
import type { Dag } from '@/engine/graph'
import { dueAtoms, masteryMap } from '@/engine/scheduler'
import { newLearnerState, type LearnerState } from '@/engine/state'
import { flushState, loadState, requestPersistence, saveState } from '@/engine/store'

interface LearnerContextValue {
  state: LearnerState
  dag: Dag
  modules: Module[]
  /** Module id → 0–1 mastery. */
  mastery: Map<string, number>
  /** Track id → 0–1 readiness. */
  trackReadiness: Record<TrackId, number>
  /** Weighted overall readiness — the big ring. */
  readiness: number
  dueCount: number
  loaded: boolean
  /** Replace state wholesale (settings edits, restore, reset). */
  setState: (next: LearnerState | ((prev: LearnerState) => LearnerState)) => void
  /** Record a graded attempt. Returns what the engine decided. */
  grade: (input: AttemptInput) => AttemptOutcome
}

const LearnerContext = createContext<LearnerContextValue | null>(null)

export function LearnerProvider({ children }: { children: ReactNode }) {
  const [state, setStateRaw] = useState<LearnerState>(() => newLearnerState())
  const [loaded, setLoaded] = useState(false)
  const [revision, setRevision] = useState(0)
  const stateRef = useRef(state)
  stateRef.current = state

  const dag = useMemo(() => buildDag(), [])

  /* ── hydrate ───────────────────────────────────────────────────────────── */
  useEffect(() => {
    let cancelled = false
    void (async () => {
      const loadedState = await loadState()
      if (cancelled) return
      setStateRaw(loadedState)
      setRevision((r) => r + 1)
      setLoaded(true)
      // Ask once, after there is something worth keeping.
      void requestPersistence()
    })()
    return () => {
      cancelled = true
    }
  }, [])

  /* ── flush on the way out ──────────────────────────────────────────────── */
  useEffect(() => {
    const onHide = () => {
      void flushState()
    }
    addEventListener('pagehide', onHide)
    addEventListener('visibilitychange', onHide)
    return () => {
      removeEventListener('pagehide', onHide)
      removeEventListener('visibilitychange', onHide)
    }
  }, [])

  const setState = useCallback<LearnerContextValue['setState']>((next) => {
    setStateRaw((prev) => {
      const resolved = typeof next === 'function' ? next(prev) : next
      stateRef.current = resolved
      saveState(resolved)
      return resolved
    })
    setRevision((r) => r + 1)
  }, [])

  /* ── derived ───────────────────────────────────────────────────────────── */
  const mastery = useMemo(
    () => masteryMap(stateRef.current, MODULES),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on revision by design
    [revision],
  )

  const trackReadiness = useMemo(() => {
    const out = {} as Record<TrackId, number>
    for (const t of TRACK_ORDER) {
      out[t] = dag.trackReadiness(mastery, t)
    }
    return out
  }, [dag, mastery])

  const readiness = useMemo(() => dag.readiness(mastery), [dag, mastery])

  const dueCount = useMemo(
    () => dueAtoms(stateRef.current, MODULES).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on revision by design
    [revision],
  )

  const grade = useCallback<LearnerContextValue['grade']>(
    (input) => {
      const current = stateRef.current
      const moduleId = input.itemId.split('::')[0] ?? ''
      const module = MODULES.find((m) => m.id === moduleId)

      const outcome = applyAttempt(current, input, module, new Date(), (next) =>
        dag.readiness(masteryMap(next, MODULES)),
      )

      stateRef.current = outcome.state
      setStateRaw(outcome.state)
      saveState(outcome.state)
      setRevision((r) => r + 1)
      return outcome
    },
    [dag],
  )

  const value = useMemo<LearnerContextValue>(
    () => ({
      state,
      dag,
      modules: MODULES,
      mastery,
      trackReadiness,
      readiness,
      dueCount,
      loaded,
      setState,
      grade,
    }),
    [state, dag, mastery, trackReadiness, readiness, dueCount, loaded, setState, grade],
  )

  return <LearnerContext.Provider value={value}>{children}</LearnerContext.Provider>
}

export function useLearner(): LearnerContextValue {
  const ctx = useContext(LearnerContext)
  if (!ctx) throw new Error('useLearner must be used inside <LearnerProvider>')
  return ctx
}
