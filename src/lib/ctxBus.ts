/* ============================================================================
   ORBIT — who has the context panel
   ----------------------------------------------------------------------------
   Two things open down the right of a lesson: a context note (markdown.tsx)
   and Ask AI (AskPanel.tsx). Only one should show at a time, and the lesson
   should step aside while either does. This is the small shared switch for
   both: whoever opens claims the panel and the other closes, and the page
   stays pushed aside while anything still holds it.
   ========================================================================== */
import type { AskSeed } from '@/lib/askAi'

export type CtxOwner = 'note' | 'ai'

const CLAIM = 'orbit:ctx-claim'
const ASK = 'orbit:ask'
let holds = 0
let askListeners = 0

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

/** Asks Ask AI about something, e.g. from a note's "explain it another way". */
export function requestAsk(seed: AskSeed): void {
  window.dispatchEvent(new CustomEvent<AskSeed>(ASK, { detail: seed }))
}

/** Whether a page that can answer is listening right now. */
export function canRequestAsk(): boolean {
  return askListeners > 0
}

export function onAskRequested(cb: (seed: AskSeed) => void): () => void {
  const listener = (e: Event) => cb((e as CustomEvent<AskSeed>).detail)
  window.addEventListener(ASK, listener)
  askListeners++
  return () => {
    window.removeEventListener(ASK, listener)
    askListeners--
  }
}
