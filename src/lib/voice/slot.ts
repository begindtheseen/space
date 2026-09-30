/* ============================================================================
   Where the reading's controls can go besides the lesson
   ----------------------------------------------------------------------------
   While a focus block runs, the strip at the bottom of the screen is where she
   looks for the things she uses, so it keeps a place for the voice. The strip
   (components/FocusBar.tsx) hands its place in here, and the read-aloud player
   (components/ReadAloud.tsx) draws its controls into it when there is one.
   ========================================================================== */
import { useSyncExternalStore } from 'react'

let slot: HTMLElement | null = null
const listeners = new Set<() => void>()

/** The focus strip's place for the voice, or null when it is not on screen. Use as a ref callback. */
export function setVoiceSlot(el: HTMLElement | null): void {
  if (slot === el) return
  slot = el
  for (const l of listeners) l()
}

/** The place for the voice's controls in the focus strip, or null. */
export function useVoiceSlot(): HTMLElement | null {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => slot,
    () => null,
  )
}
