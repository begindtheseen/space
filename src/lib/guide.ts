/* ============================================================================
   Guided reading: what the read-aloud player can do to the page
   ----------------------------------------------------------------------------
   Reading a Learn lesson aloud stops at every code window. An example window
   with code already in it is run for her, and the reading carries on once it
   has finished; a window that asks her for code (the lesson's task, a practice
   problem, a question) holds the reading until she has passed it.

   The windows and the player never see each other, so they meet here: a code
   window registers a way to run itself under an id, and the lesson page says
   when something has been passed. Both are plain module state, because each
   lives in a different part of the page's tree.
   ========================================================================== */
import { useEffect, useRef } from 'react'

type Runner = { el: () => Element | null; run: () => Promise<void> | void }

const runners = new Map<string, Runner>()

/**
 * Registers a code window that can be run on the reader's behalf. `run` is read
 * when it is called, not when it was registered, so it always uses her latest edit.
 */
export function useGuideRunner(id: string | undefined, el: () => Element | null, run: () => Promise<void> | void): void {
  const latest = useRef({ el, run })
  latest.current = { el, run }
  useEffect(() => {
    if (!id) return
    const runner: Runner = { el: () => latest.current.el(), run: () => latest.current.run() }
    runners.set(id, runner)
    return () => {
      if (runners.get(id) === runner) runners.delete(id)
    }
  }, [id])
}

/** Brings an element to the middle of the screen, the way a reader's eye would move to it. */
export function bringIntoView(el: Element | null | undefined): void {
  el?.scrollIntoView?.({ block: 'center', behavior: 'smooth' })
}

/**
 * Runs the code window registered as `id` and resolves when it has finished.
 * False when no such window is on the page, so the reading simply goes on.
 */
export async function runWindow(id: string, signal?: AbortSignal): Promise<boolean> {
  const runner = runners.get(id)
  if (!runner || signal?.aborted) return false
  bringIntoView(runner.el())
  // A moment for the scroll to land, so she sees the run start.
  await new Promise((r) => setTimeout(r, 400))
  if (signal?.aborted) return false
  await runner.run()
  return true
}

/* ── Passing ──────────────────────────────────────────────────────────────── */

const listeners = new Set<(id: string) => void>()

/** The lesson page calls this when a task, practice problem or question is passed. */
export function markSolved(id: string): void {
  for (const l of [...listeners]) l(id)
}

/** Resolves when `id` is next passed; rejects if `signal` aborts first (the reading stopped or moved). */
export function whenSolved(id: string, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException('stopped', 'AbortError'))
    const on = (solved: string) => {
      if (solved !== id) return
      listeners.delete(on)
      signal?.removeEventListener('abort', abort)
      resolve()
    }
    const abort = () => {
      listeners.delete(on)
      reject(new DOMException('stopped', 'AbortError'))
    }
    listeners.add(on)
    signal?.addEventListener('abort', abort, { once: true })
  })
}

/* ── Showing a practice item ──────────────────────────────────────────────── */

const showers = new Set<(id: string) => void>()

/** The practice section listens here, so the reader can bring up the item it is about to read. */
export function onShowItem(fn: (id: string) => void): () => void {
  showers.add(fn)
  return () => void showers.delete(fn)
}

/** Asks the practice section to show item `id`. */
export function showItem(id: string): void {
  for (const s of [...showers]) s(id)
}
