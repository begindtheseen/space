/* ============================================================================
   ORBIT — keeping the reader's place
   ----------------------------------------------------------------------------
   Two jobs, both about not punishing someone for stopping:

     restore  reopening a lesson puts her back where she stopped reading,
              rather than at the top of three thousand words she already read.
     record   how far down she is, written continuously, so the place survives
              the laptop dying rather than only a tidy close.

   Scroll fires tens of times a second, so writes are throttled and the write
   itself deliberately avoids React state — see the note in useLearner.
   ========================================================================== */
import { useEffect, useRef } from 'react'
import type { ResumePoint } from '@/engine/resume'
import { useLearner } from './useLearner'

/** The app's scroll container. */
const SCROLLER = '.scroll'

/** Don't write more than four times a second while scrolling. */
const THROTTLE_MS = 250

/**
 * Below this, "where she was" is the top of the page and restoring is just a
 * confusing jump. Above it near the end, she finished — send her to the top
 * next time rather than to the summary she already read.
 */
const RESTORE_MIN = 0.03
const RESTORE_MAX = 0.97

export interface ReadingPlaceOptions {
  /** `moduleId::lessonId`. Also the key the position is stored under. */
  placeKey: string
  /** False while the body is still loading — there is nothing to scroll yet. */
  ready: boolean
  /** Where to send her back to, recorded alongside the position. */
  resume: Omit<ResumePoint, 'at' | 'progress'>
}

export function useReadingPlace({ placeKey, ready, resume }: ReadingPlaceOptions): void {
  const { state, setPlace, setResume } = useLearner()

  // Read once per lesson rather than tracking: the stored value changes on
  // every scroll event, and depending on it would restore on every frame.
  const savedRef = useRef<number | null>(null)
  const restoredRef = useRef<string | null>(null)
  if (restoredRef.current !== placeKey) savedRef.current = state.place[placeKey] ?? null

  // Held in a ref so the scroll listener never needs re-binding when the
  // label changes, and so the latest value is always the one written.
  const resumeRef = useRef(resume)
  resumeRef.current = resume

  useEffect(() => {
    if (!ready) return
    const scroller = document.querySelector(SCROLLER)
    if (!(scroller instanceof HTMLElement)) return

    const span = () => scroller.scrollHeight - scroller.clientHeight

    /* ── restore ─────────────────────────────────────────────────────────── */
    if (restoredRef.current !== placeKey) {
      restoredRef.current = placeKey
      const saved = savedRef.current
      if (saved !== null && saved > RESTORE_MIN && saved < RESTORE_MAX) {
        // After paint: the markdown has just been inserted and KaTeX may still
        // be sizing, so the scroll height is not final until the next frame.
        requestAnimationFrame(() => {
          const total = span()
          if (total > 0) scroller.scrollTo({ top: saved * total, behavior: 'instant' as ScrollBehavior })
        })
      }
    }

    /* ── record ──────────────────────────────────────────────────────────── */
    let timer: ReturnType<typeof setTimeout> | null = null
    let latest = 0

    const write = () => {
      timer = null
      setPlace(placeKey, latest)
      setResume({ ...resumeRef.current, progress: latest, at: new Date().toISOString() })
    }

    const onScroll = () => {
      const total = span()
      latest = total > 0 ? Math.min(1, Math.max(0, scroller.scrollTop / total)) : 0
      if (timer === null) timer = setTimeout(write, THROTTLE_MS)
    }

    // Record on arrival too, so opening a lesson and walking away still leaves
    // a resume point pointing at it.
    onScroll()
    write()

    scroller.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      scroller.removeEventListener('scroll', onScroll)
      if (timer !== null) {
        clearTimeout(timer)
        write()
      }
    }
  }, [placeKey, ready, setPlace, setResume])
}
