/* ============================================================================
   ORBIT — how much of this lesson is left
   ----------------------------------------------------------------------------
   A hairline across the top of the window that fills as she reads.

   It is here for the same reason a focus block has a visible end. Three
   thousand words with no edge in sight is a wall; the same three thousand
   words with a line that is visibly two-thirds across is a thing about to be
   finished. The bar answers "how much more of this" without her having to
   drag the scrollbar to find out, and it is the cheapest possible answer —
   one line, no numbers, no percentage to feel bad about.

   It does not go through React state. Scroll fires tens of times a second and
   re-rendering the page on each one would make the very thing it is measuring
   feel heavy, so the fill is written straight to the node inside an animation
   frame. That is also why it uses a transform rather than a width: a scale is
   composited, a width is a layout.
   ========================================================================== */
import { useEffect, useRef } from 'react'
import './reading-progress.css'

/** The app's scroll container. */
const SCROLLER = '.scroll'

/**
 * Below this much scrollable overflow the lesson already fits on screen, and
 * a progress bar for something with no progress to make is noise.
 */
const MIN_SPAN_PX = 240

export function ReadingProgress({ active }: { active: boolean }) {
  const fill = useRef<HTMLDivElement | null>(null)
  const host = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!active) return
    const scroller = document.querySelector(SCROLLER)
    if (!(scroller instanceof HTMLElement)) return

    let frame = 0

    const paint = () => {
      frame = 0
      const span = scroller.scrollHeight - scroller.clientHeight
      const node = fill.current
      const box = host.current
      if (!node || !box) return
      if (span < MIN_SPAN_PX) {
        box.dataset.on = 'false'
        return
      }
      box.dataset.on = 'true'
      const at = Math.min(1, Math.max(0, scroller.scrollTop / span))
      node.style.transform = `scaleX(${at})`
    }

    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(paint)
    }

    // The body has just been inserted and the maths may still be sizing, so
    // the scroll height is not final until a frame has passed.
    requestAnimationFrame(paint)
    scroller.addEventListener('scroll', onScroll, { passive: true })

    // A lesson can grow after load — an image decodes, a formula reflows — and
    // the bar would otherwise keep reporting the old height.
    const ro = new ResizeObserver(onScroll)
    ro.observe(scroller)

    return () => {
      scroller.removeEventListener('scroll', onScroll)
      ro.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [active])

  if (!active) return null

  return (
    <div className="rprog" ref={host} data-on="false" aria-hidden="true">
      <div className="rprog__fill" ref={fill} />
    </div>
  )
}
