/* ============================================================================
   ORBIT — who has the context panel
   ----------------------------------------------------------------------------
   Two things open down the right of a lesson: a context note (markdown.tsx)
   and Explain (ExplainPanel.tsx). Only one should show at a time, and the lesson
   should step aside while either does. This is the small shared switch for
   both: whoever opens claims the panel and the other closes, and the page
   stays pushed aside while anything still holds it.
   ========================================================================== */
import type { ExplainSeed } from '@/lib/explain'

export type CtxOwner = 'note' | 'explain'

const CLAIM = 'orbit:ctx-claim'
const EXPLAIN = 'orbit:explain'
let holds = 0
let explainListeners = 0

/** Keeps the lesson pushed aside for the panel until the returned release runs. */
export function holdCtxOpen(): () => void {
  holds++
  document.documentElement.dataset.ctxOpen = 'true'
  let released = false
  return () => {
    if (released) return
    released = true
    holds = Math.max(0, holds - 1)
    if (holds === 0) delete document.documentElement.dataset.ctxOpen
  }
}

export function claimCtx(owner: CtxOwner): void {
  window.dispatchEvent(new CustomEvent<CtxOwner>(CLAIM, { detail: owner }))
}

/** Calls back when someone else opens the panel. */
export function onCtxClaimed(me: CtxOwner, cb: () => void): () => void {
  const listener = (e: Event) => {
    if ((e as CustomEvent<CtxOwner>).detail !== me) cb()
  }
  window.addEventListener(CLAIM, listener)
  return () => window.removeEventListener(CLAIM, listener)
}

/** Opens Explain on something, e.g. from a note's "where else this comes up". */
export function requestExplain(seed: ExplainSeed): void {
  window.dispatchEvent(new CustomEvent<ExplainSeed>(EXPLAIN, { detail: seed }))
}

/** Whether a page that can answer is listening right now. */
export function canRequestExplain(): boolean {
  return explainListeners > 0
}

export function onExplainRequested(cb: (seed: ExplainSeed) => void): () => void {
  const listener = (e: Event) => cb((e as CustomEvent<ExplainSeed>).detail)
  window.addEventListener(EXPLAIN, listener)
  explainListeners++
  return () => {
    window.removeEventListener(EXPLAIN, listener)
    explainListeners--
  }
}
