/* ============================================================================
   ORBIT — the context panel
   ----------------------------------------------------------------------------
   Where a context note opens (src/lib/contextNotes.ts): a panel down the right
   of the window on a desk, a sheet from the bottom on a phone. It sits over
   the lesson rather than pushing it aside, so the line she was reading does
   not jump; Escape, the close button, or tapping the same phrase again puts it
   away, and tapping another phrase swaps the note in place.
   ========================================================================== */
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { IconX } from '@/components/icons'
import { Markdown } from '@/lib/markdown'
import type { ContextNote } from '@/lib/contextNotes'
import './context-panel.css'

/**
 * A note's picture, drawn as an image: the browser runs nothing inside an SVG
 * shown this way, whatever it contains, and the validator keeps it plain too.
 */
const drawSvg = (lang: string, code: string) =>
  lang === 'svg' ? (
    <img className="ctx-panel__pic" src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(code.trim())}`} alt="" />
  ) : null

export function ContextPanel({ note, onClose }: { note: ContextNote; onClose: () => void }) {
  const ref = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // A new note starts at its top, and the panel takes focus so a keyboard or
  // screen reader lands in it.
  useEffect(() => {
    ref.current?.scrollTo({ top: 0 })
    ref.current?.focus({ preventScroll: true })
  }, [note.id])

  return createPortal(
    <aside className="ctx-panel" role="dialog" aria-modal="false" aria-labelledby="ctx-panel-title" tabIndex={-1} ref={ref}>
      <div className="ctx-panel__head">
        <div>
          <div className="ctx-panel__kicker">Context</div>
          <h2 className="ctx-panel__title" id="ctx-panel-title">
            {note.title}
          </h2>
        </div>
        <button type="button" className="ctx-panel__close" onClick={onClose} aria-label="Close the note">
          <IconX size={15} />
        </button>
      </div>
      <Markdown className="ctx-panel__body" renderCode={drawSvg}>
        {note.body}
      </Markdown>
    </aside>,
    document.body,
  )
}
