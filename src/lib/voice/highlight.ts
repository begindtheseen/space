/* ============================================================================
   Following along: the word being read, lit up in the lesson
   ----------------------------------------------------------------------------
   The voice knows when every word of what it says starts and ends (the model's
   durations, see kokoro.ts wordTimes). This ties those words to the words on
   the page, so the one being spoken can be lit up and scrolled back to.

   What is spoken and what is shown are not the same text: code blocks and
   equations are left out of the reading, headings and list markers are
   reshaped, and the reading has its own full stops. So spoken words are
   matched to the page's words in order, each to the next page word that reads
   the same within a short window; a spoken word with no match on the page
   (a number read out, a symbol spelled) simply lights nothing, and the next
   one picks up where the page is.

   The light is a CSS Custom Highlight (CSS.highlights): a Range painted by the
   browser, with no change to the lesson's markup at all — nothing to undo,
   and nothing that could disturb selection, links or the reading-progress bar.
   Where the browser has no Highlight API the words are still tracked, so
   "back to the word" still works; it just is not painted.
   ========================================================================== */
import { textWords } from './kokoro'

/** Elements whose text is never read aloud. */
const SKIP = 'pre, code, .katex, .katex-display, math, script, style, button, [aria-hidden="true"], .raloud, .runnable, .embed'

/** A word as the matcher sees it: letters and digits only, lower case. */
export const normWord = (s: string): string => s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')

interface PageWord {
  norm: string
  node: Text
  start: number
  end: number
}

/** How far ahead on the page a spoken word may find its match. */
const WINDOW = 40

export class PageWords {
  readonly words: PageWord[] = []

  constructor(root: Element) {
    const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => ((n.parentElement?.closest(SKIP) ?? null) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
    })
    for (let n = walker.nextNode() as Text | null; n; n = walker.nextNode() as Text | null) {
      for (const w of textWords(n.data)) {
        const norm = normWord(n.data.slice(w.start, w.end))
        if (norm) this.words.push({ norm, node: n, start: w.start, end: w.end })
      }
    }
  }

  /**
   * Where a run of spoken words begins on the page, searching from `from`:
   * the first place where most of its first few words match in order.
   */
  seek(norms: readonly string[], from = 0): number {
    const probe = norms.filter(Boolean).slice(0, 4)
    if (!probe.length) return from
    let best = from
    let bestScore = 0
    for (let i = from; i < this.words.length; i++) {
      if (this.words[i]!.norm !== probe[0]) continue
      let score = 1
      let j = i + 1
      for (let k = 1; k < probe.length && j < this.words.length; k++) {
        const hit = this.words.slice(j, j + 3).findIndex((w) => w.norm === probe[k])
        if (hit >= 0) {
          score++
          j += hit + 1
        }
      }
      if (score > bestScore) {
        best = i
        bestScore = score
        if (score === probe.length) break
      }
    }
    return best
  }

  /** The page word each spoken word lands on (-1 for none), matching in order from `from`. */
  align(norms: readonly string[], from: number): Int32Array {
    const out = new Int32Array(norms.length).fill(-1)
    let at = from
    norms.forEach((norm, k) => {
      if (!norm) return
      const end = Math.min(this.words.length, at + WINDOW)
      for (let i = at; i < end; i++) {
        if (this.words[i]!.norm === norm) {
          out[k] = i
          at = i + 1
          return
        }
      }
    })
    return out
  }

  range(i: number, j = i): Range | null {
    const a = this.words[i]
    const b = this.words[j]
    if (!a || !b) return null
    const r = a.node.ownerDocument.createRange()
    try {
      r.setStart(a.node, a.start)
      r.setEnd(b.node, b.end)
    } catch {
      return null
    }
    return r
  }
}

/* ── Painting ─────────────────────────────────────────────────────────────── */

type HighlightCtor = new (...ranges: Range[]) => unknown
interface HighlightRegistry {
  set(name: string, h: unknown): void
  delete(name: string): void
}

function registry(): { Ctor: HighlightCtor; reg: HighlightRegistry } | null {
  const g = globalThis as unknown as { Highlight?: HighlightCtor; CSS?: { highlights?: HighlightRegistry } }
  return g.Highlight && g.CSS?.highlights ? { Ctor: g.Highlight, reg: g.CSS.highlights } : null
}

/** Lights up the word being read and, faintly, the sentence around it; null clears both. */
export function paint(word: Range | null, sentence: Range | null): void {
  const h = registry()
  if (!h) return
  if (word) h.reg.set('raloud-word', new h.Ctor(word))
  else h.reg.delete('raloud-word')
  if (sentence) h.reg.set('raloud-sentence', new h.Ctor(sentence))
  else h.reg.delete('raloud-sentence')
}

export const canPaint = (): boolean => registry() !== null

/** Whether a range is (at least partly) inside the visible part of its scroll container. */
export function inView(range: Range, scroller: Element | null): boolean {
  const r = range.getBoundingClientRect()
  if (!r.width && !r.height) return true
  const top = scroller ? Math.max(0, scroller.getBoundingClientRect().top) : 0
  const bottom = scroller ? Math.min(innerHeight, scroller.getBoundingClientRect().bottom) : innerHeight
  // The focus strip and the read-aloud bar take the bottom of the screen.
  return r.bottom > top + 40 && r.top < bottom - 90
}

/** Scrolls so the range sits a third of the way down the visible area. */
export function scrollToRange(range: Range, scroller: Element | null): void {
  const r = range.getBoundingClientRect()
  if (!scroller) {
    scrollBy({ top: r.top - innerHeight / 3, behavior: 'smooth' })
    return
  }
  const box = scroller.getBoundingClientRect()
  scroller.scrollBy({ top: r.top - box.top - box.height / 3, behavior: 'smooth' })
}
