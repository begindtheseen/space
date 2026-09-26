/* ============================================================================
   ORBIT — "Explain this" on a highlight
   ----------------------------------------------------------------------------
   Highlight words in a lesson and a small button appears just above them (just
   below on a touch screen, where the system's own copy menu sits on top).
   Pressing it hands the words, and the paragraph they came from, to Ask AI.
   The button takes the press without taking focus, so the highlight is still
   there when it opens.
   ========================================================================== */
import { useEffect, useRef, useState, type RefObject } from 'react'
import { IconSpark } from '@/components/icons'
import type { AskSeed } from '@/lib/askAi'

const BLOCKS = 'p, li, blockquote, td, th, h1, h2, h3, h4, figcaption, .md__math--display'
const MIN_CHARS = 2
const MAX_CHARS = 1200

/**
 * The text of a piece of a lesson as she would read it out: maths as its TeX
 * between dollar signs (KaTeX's own markup doubles every symbol), and the
 * words of buttons and code runners left out.
 */
export function readableText(root: Node): string {
  const host = document.createElement('div')
  host.appendChild(root.cloneNode(true))
  for (const m of host.querySelectorAll<HTMLElement>('.md__math')) {
    const tex = m.getAttribute('aria-label')
    m.replaceWith(tex ? ` $${tex}$ ` : (m.querySelector('.katex-html')?.textContent ?? m.textContent ?? ''))
  }
  for (const el of host.querySelectorAll('button, .katex-mathml, [aria-hidden="true"]')) el.remove()
  return (host.textContent ?? '').replace(/\s+/g, ' ').trim()
}

function seedFrom(selection: Selection, container: HTMLElement): AskSeed | null {
  if (selection.isCollapsed || selection.rangeCount === 0) return null
  const range = selection.getRangeAt(0)
  if (!container.contains(range.commonAncestorContainer)) return null
  const text = readableText(range.cloneContents())
  if (text.length < MIN_CHARS) return null
  const anchor = range.commonAncestorContainer
  const el = anchor instanceof Element ? anchor : anchor.parentElement
  const block = el?.closest(BLOCKS)
  const paragraph = block && container.contains(block) ? readableText(block) : text
  return { selection: text.slice(0, MAX_CHARS), paragraph: paragraph.slice(0, 2000) }
}

export function SelectionAsk({ container, onAsk }: { container: RefObject<HTMLElement | null>; onAsk: (seed: AskSeed) => void }) {
  const [spot, setSpot] = useState<{ x: number; y: number; below: boolean } | null>(null)
  const seedRef = useRef<AskSeed | null>(null)

  useEffect(() => {
    let frame = 0
    const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const root = container.current
        const sel = window.getSelection()
        const seed = root && sel ? seedFrom(sel, root) : null
        seedRef.current = seed
        if (!seed || !sel) return setSpot(null)
        const rects = sel.getRangeAt(0).getClientRects()
        const first = rects[0]
        const last = rects[rects.length - 1]
        if (!first || !last) return setSpot(null)
        const below = coarse || first.top < 64
        const r = below ? last : first
        setSpot({
          x: Math.min(Math.max(r.left + r.width / 2, 70), window.innerWidth - 70),
          y: below ? r.bottom + 10 : r.top - 10,
          below,
        })
      })
    }
    const hide = () => setSpot(null)
    document.addEventListener('selectionchange', update)
    // The page scrolls under a fixed button; put it away rather than let it drift.
    const scroller = document.querySelector('.scroll')
    scroller?.addEventListener('scroll', hide, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('selectionchange', update)
      scroller?.removeEventListener('scroll', hide)
    }
  }, [container])

  if (!spot) return null
  return (
    <button
      type="button"
      className="sel-ask"
      data-below={spot.below}
      style={{ left: spot.x, top: spot.y }}
      // Keep the highlight: a mousedown that focuses the button would clear it.
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => {
        const seed = seedRef.current
        if (!seed) return
        setSpot(null)
        onAsk(seed)
      }}
    >
      <IconSpark size={14} /> Explain this
    </button>
  )
}
