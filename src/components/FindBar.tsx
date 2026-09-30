/* ============================================================================
   ORBIT — find on the page (⌘F / Ctrl+F)
   ----------------------------------------------------------------------------
   The desktop app has no browser around it, so no browser find: this is it,
   on every page. ⌘F opens a small bar at the top right; what she types is lit
   everywhere it appears (lib/find.ts), the one she is on brighter, with "3 of
   12" beside it. Enter (or ⌘G) goes to the next, Shift+Enter to the one
   before, Escape puts it away. The matches follow the page while the bar is
   open, so a section she opens or a lesson that finishes drawing is searched
   too.

   The lights are CSS Custom Highlights, painted by the browser over the page
   with no change to its markup. Where there is no Highlight API the match she
   is on is selected instead.
   ========================================================================== */
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { IconChevronDown, IconSearch, IconX } from '@/components/icons'
import { findInPage } from '@/lib/find'
import './find.css'

const ALL = 'orbit-find'
const NOW = 'orbit-find-now'

type HighlightCtor = new (...ranges: Range[]) => object
type Registry = { set: (name: string, h: object) => void; delete: (name: string) => void }
const api = (): { Ctor: HighlightCtor; reg: Registry } | null => {
  const g = globalThis as unknown as { Highlight?: HighlightCtor; CSS?: { highlights?: Registry } }
  return g.Highlight && g.CSS?.highlights ? { Ctor: g.Highlight, reg: g.CSS.highlights } : null
}

/** Where to search: the page's own column, not the sidebar or the top bar's controls. */
const pageRoot = (): Element => document.querySelector('.shell .scroll') ?? document.body

export function FindBar() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [count, setCount] = useState(0)
  const [at, setAt] = useState(-1)
  const input = useRef<HTMLInputElement>(null)
  const ranges = useRef<Range[]>([])
  const atRef = useRef(-1)

  const paint = useCallback((i: number, scroll: boolean) => {
    const list = ranges.current
    const h = api()
    const r = list[i]
    if (h) {
      h.reg.set(ALL, new h.Ctor(...list))
      if (r) h.reg.set(NOW, new h.Ctor(r))
      else h.reg.delete(NOW)
    } else if (r && scroll) {
      const sel = getSelection()
      sel?.removeAllRanges()
      sel?.addRange(r)
    }
    atRef.current = i
    setAt(i)
    if (r && scroll) {
      const el = r.startContainer.parentElement
      const box = r.getBoundingClientRect()
      const out = box.top < 90 || box.bottom > innerHeight - 90 || box.left < 0 || box.right > innerWidth
      if (el && out) {
        const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches && document.documentElement.dataset.reduceMotion !== 'true'
        el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: smooth ? 'smooth' : 'auto' })
      }
    }
  }, [])

  const clear = useCallback(() => {
    const h = api()
    h?.reg.delete(ALL)
    h?.reg.delete(NOW)
    ranges.current = []
    setCount(0)
    atRef.current = -1
    setAt(-1)
  }, [])

  /**
   * Searches again. `keep` holds her place: the match at or after the one she was on stays current, so a page
   * that redraws under her does not throw her back to the first.
   */
  const search = useCallback(
    (q: string, keep: boolean, scroll: boolean) => {
      const was = keep ? ranges.current[atRef.current] : undefined
      const list = q.trim() ? findInPage(pageRoot(), q) : []
      ranges.current = list
      setCount(list.length)
      if (!list.length) {
        clear()
        return
      }
      let i = 0
      if (was) {
        const k = list.findIndex((r) => {
          try {
            return r.compareBoundaryPoints(Range.START_TO_START, was) >= 0
          } catch {
            return false
          }
        })
        i = k >= 0 ? k : 0
      } else {
        // A new search starts at the first match on screen, as a browser's does, not at the top of the page.
        const k = list.findIndex((r) => r.getBoundingClientRect().bottom > 70)
        i = k >= 0 ? k : 0
      }
      paint(i, scroll)
    },
    [clear, paint],
  )

  const step = useCallback(
    (d: number) => {
      const n = ranges.current.length
      if (!n) return
      // What she stepped from may have been redrawn away: look again first, keeping her place.
      if (ranges.current.some((r) => !r.startContainer.isConnected)) search(query, true, false)
      const m = ranges.current.length
      if (!m) return
      paint((atRef.current + d + m) % m, true)
    },
    [paint, search, query],
  )

  const close = useCallback(() => {
    setOpen(false)
    clear()
  }, [clear])

  // ⌘F / Ctrl+F opens it (or selects what is typed, if it is open); ⌘G and ⇧⌘G step through the matches.
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (!mod || e.altKey) return
      const k = e.key.toLowerCase()
      if (k === 'f' && !e.shiftKey) {
        e.preventDefault()
        // What she has selected on the page is what she wants to find.
        const picked = getSelection()?.toString().trim()
        if (picked && picked.length < 80 && !picked.includes('\n')) setQuery(picked)
        setOpen(true)
        requestAnimationFrame(() => {
          input.current?.focus()
          input.current?.select()
        })
      } else if (k === 'g' && open) {
        e.preventDefault()
        step(e.shiftKey ? -1 : 1)
      }
    }
    addEventListener('keydown', key, true)
    return () => removeEventListener('keydown', key, true)
  }, [open, step])

  // Typing searches as she goes.
  useEffect(() => {
    if (open) search(query, false, true)
  }, [open, query, search])

  // The page changes under the bar (a section opened, a lesson drawn, another page): look again, keeping her place.
  useEffect(() => {
    if (!open) return
    let timer = 0
    const again = () => {
      clearTimeout(timer)
      timer = window.setTimeout(() => search(query, true, false), 180)
    }
    const mo = new MutationObserver((records) => {
      if (records.every((r) => (r.target as Element).closest?.('.findbar'))) return
      again()
    })
    mo.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['open', 'hidden', 'class'] })
    return () => {
      clearTimeout(timer)
      mo.disconnect()
    }
  }, [open, query, search])

  // A new page: the old matches are gone with it.
  useEffect(() => {
    const away = () => {
      if (!open) return
      requestAnimationFrame(() => search(query, false, false))
    }
    addEventListener('hashchange', away)
    return () => removeEventListener('hashchange', away)
  }, [open, query, search])

  if (!open || typeof document === 'undefined') return null
  const none = query.trim() !== '' && count === 0
  return createPortal(
    <div className="findbar" role="search" data-none={none}>
      <IconSearch size={13} className="findbar__glass" />
      <input
        ref={input}
        className="findbar__input"
        type="text"
        value={query}
        placeholder="Find on this page"
        aria-label="Find on this page"
        spellCheck={false}
        autoComplete="off"
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            step(e.shiftKey ? -1 : 1)
          } else if (e.key === 'Escape') {
            e.preventDefault()
            e.stopPropagation()
            close()
          }
        }}
      />
      <span className="findbar__count" aria-live="polite">
        {query.trim() ? (count ? `${at + 1} of ${count}${count >= 2000 ? '+' : ''}` : 'No matches') : ''}
      </span>
      <span className="findbar__sep" aria-hidden="true" />
      <button type="button" className="findbar__btn findbar__btn--up" onClick={() => step(-1)} disabled={!count} aria-label="Previous match" title="Previous (Shift+Enter)">
        <IconChevronDown size={13} />
      </button>
      <button type="button" className="findbar__btn" onClick={() => step(1)} disabled={!count} aria-label="Next match" title="Next (Enter)">
        <IconChevronDown size={13} />
      </button>
      <button type="button" className="findbar__btn" onClick={close} aria-label="Close find" title="Close (Esc)">
        <IconX size={11} />
      </button>
    </div>,
    document.body,
  )
}
