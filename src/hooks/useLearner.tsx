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
import { flushState, loadState, requestPersistence, saveState, saveStateNow } from '@/engine/store'
import type { LiveSession, MediaProgress, ResumePoint } from '@/engine/resume'

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
  /** Remember where she is, for the resume card. Null clears it. */
  setResume: (point: ResumePoint | null) => void
  /** Store or clear the in-flight session. Written immediately. */
  setLive: (session: LiveSession | null) => void
  /** Remember a video's playback position. */
  setMedia: (videoId: string, progress: MediaProgress) => void
  /** Remember how far into a lesson she has read, 0-1. */
  setPlace: (key: string, fraction: number) => void
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
  /*
   * Every way the app can stop existing, because only some of them fire in any
   * given situation: `pagehide` on navigation away, `visibilitychange` when
   * the window is hidden or the machine sleeps, `blur` when she switches to
   * another app mid-question, `freeze` when the OS suspends the tab, and
   * `beforeunload` on an ordinary close. A crash or a power cut fires none of
   * them, which is why the debounce is short and the important moments write
   * immediately rather than relying on any of this.
   */
  useEffect(() => {
    const onHide = () => {
      void flushState()
    }
    const events = ['pagehide', 'visibilitychange', 'blur', 'freeze', 'beforeunload']
    for (const e of events) addEventListener(e, onHide)
    return () => {
      for (const e of events) removeEventListener(e, onHide)
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

  /*
   * The place-keeping writes below bypass React state on purpose.
   *
   * They fire on scroll, on video timeupdate and on every keystroke in the
   * playground. Routing those through setState would re-render the whole
   * provider — and recompute mastery over the entire corpus — several times a
   * second. Instead they mutate the ref and persist, and the next real state
   * change picks the values up. Nothing renders from them mid-interaction;
   * they exist to be read back after a crash.
   */
  const persistQuiet = useCallback((mutate: (s: LearnerState) => LearnerState, now = false) => {
    const next = mutate(stateRef.current)
    stateRef.current = next
    if (now) saveStateNow(next)
    else saveState(next)
  }, [])

  const setResume = useCallback(
    (point: ResumePoint | null) => {
      persistQuiet((s) => {
        const out = { ...s }
        if (point) out.resume = point
        else delete out.resume
        return out
      })
    },
    [persistQuiet],
  )

  /** Starting, advancing or ending a session is always worth an immediate write. */
  const setLive = useCallback(
    (session: LiveSession | null) => {
      persistQuiet((s) => {
        const out = { ...s }
        if (session) out.live = session
        else delete out.live
        return out
      }, true)
      setStateRaw(stateRef.current)
      setRevision((r) => r + 1)
    },
    [persistQuiet],
  )

  const setMedia = useCallback(
    (videoId: string, progress: MediaProgress) => {
      persistQuiet((s) => ({ ...s, media: { ...s.media, [videoId]: progress } }))
    },
    [persistQuiet],
  )

  const setPlace = useCallback(
    (key: string, fraction: number) => {
      persistQuiet((s) => ({ ...s, place: { ...s.place, [key]: fraction } }))
    },
    [persistQuiet],
  )

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
      // A graded answer is exactly the thing that must not be lost.
      saveStateNow(outcome.state)
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
      setResume,
      setLive,
      setMedia,
      setPlace,
    }),
    [
      state,
      dag,
      mastery,
      trackReadiness,
      readiness,
      dueCount,
      loaded,
      setState,
      grade,
      setResume,
      setLive,
      setMedia,
      setPlace,
    ],
  )

  return <LearnerContext.Provider value={value}>{children}</LearnerContext.Provider>
}

export function useLearner(): LearnerContextValue {
  const ctx = useContext(LearnerContext)
  if (!ctx) throw new Error('useLearner must be used inside <LearnerProvider>')
  return ctx
}
